import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Plus, Pencil, Trash2, Search, User as UserIcon, LayoutGrid, Table as TableIcon, ArrowLeft, Users as UsersIcon, Loader2 } from 'lucide-react';
import { mockUsers } from '@/data/mockUsers';
import { User, UserRole } from '@/types/user';
import { toast } from 'sonner';
import api from '../axios';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PhoneInputField } from '@/components/ui/phone-input';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    role: 'operateur' as UserRole,
    department: '',
    full_name: '',
    password: '',
    zone: '',
    phone: '',
    id: '',
    employeeId: ''
  });

  const departments = ['operateur', 'technicien', 'instrumentiste', 'chef_de_quart', 'responsable_hse', 'resp_exploitation', 'directeur', 'administrateur'];

  const filteredUsers = users.filter(user => {
    const fullName = user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDepartment = selectedDepartment === 'all' || user.role === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres ou le nombre d'éléments par page changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment, itemsPerPage]);

  const handleAddUser = async () => {
    setIsSubmitting(true);
    const user: User = {
      id: `user-${Date.now()}`,
      ...newUser,
      isActive: true,
      lastLogin: new Date()
    };

    // Préparer les données pour l'API (firstName et lastName sont requis)
    const userData = {
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      password: newUser.password,
      phone: newUser.phone,
      role: newUser.role,
    };
    
    try {
      const data = await api({
        method: 'post',
        url: '/users',
        data: userData
      });

      await getUsersList();
      
      if (data) {
        toast.success('Utilisateur ajouté avec succès');
      } else {
        toast.error('Erreur durant l\'ajout');
      }
      
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        role: 'user',
        department: '',
        password: '',
        full_name: '',
        zone: '',
        phone: '',
        employeeId: '',
        username: '',
        id: ''
      });
      setEditingUser(null);
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsSubmitting(false);
    // Extraire firstName et lastName depuis full_name si nécessaire
    let firstName = user.firstName || '';
    let lastName = user.lastName || '';
    
    if (!firstName && !lastName && user.full_name) {
      const nameParts = user.full_name.trim().split(/\s+/);
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || '';
      }
    }
    
    setNewUser({
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      role: user.role,
      full_name: user.full_name || `${firstName} ${lastName}`.trim() || '',
      department: user.department || '',
      zone: user.zone || '',
      phone: user.phone || '',
      username: user.username || '',
      password: '',
      id: user.id,
      employeeId: user.employeeId || ''
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (editingUser) {
      setIsSubmitting(true);
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...editingUser, ...newUser }
          : user
      ));
      
      
      // Construire full_name depuis firstName et lastName pour la mise à jour
      const fullName = `${newUser.firstName || ''} ${newUser.lastName || ''}`.trim();
      const updateData: any = {
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        full_name: fullName || newUser.full_name,
      };
      
      // Ajouter le mot de passe seulement s'il a été modifié
      if (newUser.password) {
        updateData.password = newUser.password;
      }
      
      // Ajouter le rôle seulement si c'est un admin
      if (newUser.role) {
        updateData.role = newUser.role;
      }
      
      try {
        const data = await api({
          method: 'put',
          url: `/users/${newUser.id}`,
          data: updateData
        });

        await getUsersList();
        
        if (data) {
          toast.success('Utilisateur modifié avec succès');
        } else {
          toast.error('Erreur lors de la modification!');
        }
        
        setNewUser({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          role: 'user',
          full_name: '',
          password: '',
          department: '',
          zone: '',
          phone: '',
          employeeId: '',
          id: ''
        });
        setEditingUser(null);
        setIsAddDialogOpen(false);
      } catch (error: any) {
        console.error('Error:', error);
        toast.error(error.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsSubmitting(false);
    setNewUser({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      role: 'user',
      department: '',
      full_name: '',
      password: '',
      zone: '',
      phone: '',
      id: '',
      employeeId: ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    api.delete(`/users/${userId}`)
      .then(() => {
        getUsersList();
        toast.success('Utilisateur supprimé avec succès');
      })
      .catch(error => {
        console.error('Error:', error);
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression de l\'utilisateur');
      });
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    api.put(`/users/${userId}`, {
      is_active: !user.isActive
    })
      .then(() => {
        getUsersList();
        toast.success('Statut utilisateur modifié');
      })
      .catch(error => {
        console.error('Error:', error);
        toast.error('Erreur lors de la modification du statut');
      });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'administrateur': case 'administrator': return 'destructive';
      case 'directeur': case 'director': return 'default';
      case 'resp_exploitation': return 'default';
      case 'responsable_hse': return 'secondary';
      case 'chef_de_quart': case 'supervisor': return 'secondary';
      case 'instrumentiste': return 'outline';
      case 'technicien': return 'outline';
      case 'operateur': case 'user': return 'outline';
      default: return 'outline';
    }
  };

  const ROLE_LABELS: Record<string, string> = {
    operateur: 'Opérateur',
    technicien: 'Technicien',
    instrumentiste: 'Instrumentiste',
    chef_de_quart: 'Chef de quart',
    responsable_hse: 'Responsable HSE',
    resp_exploitation: 'Resp. Exploitation',
    directeur: 'Directeur',
    administrateur: 'Administrateur',
    user: 'Utilisateur',
    supervisor: 'Superviseur',
    director: 'Directeur',
    administrator: 'Administrateur',
  };

  const getRoleLabel = (role: UserRole) => {
    return ROLE_LABELS[role] || role;
  };

  const getUsersList = async () => {
    setIsLoading(true);
    return api.get('/users')
      .then(response => {
        // Handle successful response
        const datas = response.data.data;
        if (datas && datas.length !== 0) {
          const formattedUsers = datas.map(
            (user: any) => ({
              id: user.id,
              full_name: user.full_name,
              email: user.email,
              role: user.role,
              phone: user.phone,
              username: user.username,
              isActive: user.is_active == 1 ? true : false,
              spatie_roles: user.spatie_roles || [user.role] // Rôles Spatie
            })
          );

          setUsers(formattedUsers);
        } else {
          setUsers([]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        // Handle error
        console.error('Error fetching data:', error);
        toast.error('Erreur lors du chargement des utilisateurs');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    getUsersList();
  }, []);

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words mb-1 truncate">Gestion des Utilisateurs</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2 line-clamp-1">Gérez les utilisateurs et leurs permissions</p>
                <Breadcrumb>
                  <BreadcrumbList className="flex-wrap">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/" className="truncate">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate">Utilisateurs</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            {/* Bouton retour */}
            <Button variant="outline" size="icon" className="flex-shrink-0 rounded-full w-9 h-9 sm:w-10 sm:h-10" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-between w-full min-w-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 flex-1 w-full min-w-0">
              <div className="w-full sm:min-w-[150px] sm:max-w-[300px] flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                  <Input
                    id="search"
                    placeholder="Nom, email ou téléphone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 text-xs sm:text-sm md:text-base w-full min-w-0"
                  />
                </div>
              </div>
              <div className="w-full sm:min-w-[140px] sm:max-w-[200px] flex-shrink-0">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full text-xs sm:text-sm md:text-base min-w-0">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{getRoleLabel(dept as UserRole)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) {
                setEditingUser(null);
                setIsSubmitting(false);
                setNewUser({
                  firstName: '',
                  lastName: '',
                  username: '',
                  email: '',
                  role: 'operateur',
                  department: '',
                  full_name: '',
                  password: '',
                  zone: '',
                  phone: '',
                  id: '',
                  employeeId: ''
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm h-9 sm:h-10">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline truncate">Ajouter un utilisateur</span>
                  <span className="sm:hidden truncate">Ajouter</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Modifiez les informations de l\'utilisateur.' : 'Ajoutez un nouveau utilisateur au système.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingUser) {
                handleUpdateUser();
              } else {
                handleAddUser();
              }
            }} className="space-y-3 sm:space-y-4 w-full min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
                <div className="w-full min-w-0">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    placeholder="Prénom de l'utilisateur"
                    required
                    className="w-full min-w-0"
                  />
                </div>
                <div className="w-full min-w-0">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    placeholder="Nom de l'utilisateur"
                    required
                    className="w-full min-w-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                <div className="w-full min-w-0">
                  <Label htmlFor="username">Nom d'utilisateur</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Nom d'utilisateur"
                    required
                    className="w-full min-w-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                <div className="w-full min-w-0">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Email de l'utilisateur"
                    required
                    className="w-full min-w-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                <div className="w-full min-w-0">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Mot de passe"
                      required={!editingUser}
                      className="w-full min-w-0 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                <div className="w-full min-w-0">
                  <Label htmlFor="phone">Téléphone</Label>
                  <PhoneInputField
                    id="phone"
                    value={newUser.phone}
                    onChange={(value) => setNewUser({...newUser, phone: value || ''})}
                    placeholder="Numéro de téléphone"
                    className="w-full min-w-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 w-full min-w-0">
                <div className="w-full min-w-0">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={newUser.role} onValueChange={(value: UserRole) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger className="w-full min-w-0">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operateur">Opérateur</SelectItem>
                      <SelectItem value="technicien">Technicien</SelectItem>
                      <SelectItem value="instrumentiste">Instrumentiste</SelectItem>
                      <SelectItem value="chef_de_quart">Chef de quart</SelectItem>
                      <SelectItem value="responsable_hse">Responsable HSE</SelectItem>
                      <SelectItem value="resp_exploitation">Resp. Exploitation</SelectItem>
                      <SelectItem value="directeur">Directeur</SelectItem>
                      <SelectItem value="administrateur">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 w-full min-w-0">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingUser(null);
                  setIsSubmitting(false);
                  setNewUser({
                    firstName: '',
                    lastName: '',
                    username: '',
                    email: '',
                    role: 'operateur',
                    department: '',
                    full_name: '',
                    password: '',
                    zone: '',
                    phone: '',
                    id: '',
                    employeeId: ''
                  });
                }} className="w-full sm:w-auto text-sm">
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto text-sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingUser ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    editingUser ? 'Modifier' : 'Ajouter'
                  )}
                </Button>
              </DialogFooter>
            </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Contrôles de pagination et sélection du nombre d'éléments */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 mt-3 sm:mt-4 w-full min-w-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0">Éléments par page:</Label>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-16 sm:w-20 flex-shrink-0 h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Boutons de basculement - visibles seulement sur desktop */}
            <div className="hidden lg:flex items-center gap-1 border rounded-md p-0.5">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-7"
                title="Vue grille"
              >
                <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-7"
                title="Vue tableau"
              >
                <TableIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-left truncate whitespace-nowrap">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {isLoading ? (
        /* Skeleton Loading - Vue grille */
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4 w-full min-w-0 ${viewMode === 'table' ? 'lg:hidden' : ''}`}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Card key={index} className="flex flex-col h-full w-full min-w-0 box-border">
              <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start justify-between gap-1 sm:gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                    <Skeleton className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                    <Skeleton className="h-4 sm:h-5 w-20 sm:w-24" />
                  </div>
                  <div className="flex gap-0.5">
                    <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
                    <Skeleton className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mt-1.5" />
              </CardHeader>
              <CardContent className="space-y-1.5 sm:space-y-2 p-4 sm:p-5 md:p-6 pt-0 min-w-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Vue grille - toujours visible sur mobile, cachée sur desktop si viewMode est 'table' */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4 w-full min-w-0 ${viewMode === 'table' ? 'lg:hidden' : ''}`}>
            {paginatedUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-lg transition-shadow flex flex-col h-full w-full min-w-0 box-border">
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-start justify-between gap-1 sm:gap-1.5 min-w-0">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                      <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-base md:text-lg truncate min-w-0">{user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</CardTitle>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleEditUser(user);
                          setIsAddDialogOpen(true);
                        }}
                        className="h-6 w-6 p-0"
                        title="Modifier"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base sm:text-lg">Supprimer l'utilisateur</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <AlertDialogCancel className="w-full sm:w-auto text-sm">Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="w-full sm:w-auto text-sm">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1.5">{user.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 sm:space-y-2 p-4 sm:p-5 md:p-6 pt-0 min-w-0">
                  <div className="flex items-center justify-between min-w-0 gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Nom d'utilisateur:</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs flex-shrink-0 whitespace-nowrap">{user.username || 'N/A'}</Badge>
                  </div>
                  <div className="flex items-center justify-between min-w-0 gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Rôle:</span>
                    <div className="flex flex-wrap gap-1 flex-shrink-0">
                      {(user.spatie_roles || [user.role]).map((role: string) => (
                        <Badge key={role} variant={getRoleBadgeVariant(role as UserRole)} className="text-[10px] sm:text-xs whitespace-nowrap">
                          {getRoleLabel(role as UserRole)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between min-w-0 gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Téléphone:</span>
                    <span className="text-[10px] sm:text-xs truncate ml-2">{user.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between min-w-0 gap-2">
                    <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Statut:</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleUserStatus(user.id)}
                      className="h-auto p-0 flex-shrink-0"
                    >
                      <Badge variant={user.isActive ? "default" : "secondary"} className="text-[10px] sm:text-xs whitespace-nowrap">
                        {user.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Vue tableau - visible seulement sur desktop quand viewMode est 'table' */}
          {viewMode === 'table' && (
            <Card className="w-full min-w-0 box-border hidden lg:block">
              <CardHeader className="p-2 sm:p-3 md:p-4">
                <CardTitle className="text-xs sm:text-sm md:text-base">Utilisateurs ({filteredUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-2 md:p-3 w-full min-w-0 overflow-x-auto">
                <div className="w-full min-w-0">
                  <Table className="w-full min-w-[600px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Nom</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Email</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Nom d'utilisateur</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Rôle</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Téléphone</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Statut</TableHead>
                        <TableHead className="text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 sm:py-8">
                        <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">
                          {users.length === 0 ? 'Aucun utilisateur' : 'Aucun résultat'}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4">
                          {users.length === 0 
                            ? 'Commencez par ajouter votre premier utilisateur.'
                            : 'Aucun utilisateur ne correspond à vos critères de recherche.'
                          }
                        </p>
                        {users.length === 0 && (
                          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter un utilisateur
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-xs sm:text-sm max-w-[120px] sm:max-w-[150px] md:max-w-none">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                            <span className="truncate">{user.full_name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm max-w-[150px] sm:max-w-xs truncate min-w-0">{user.email}</TableCell>
                        <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] sm:text-xs md:text-sm">{user.username || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(user.spatie_roles || [user.role]).map((role: string) => (
                              <Badge key={role} variant={getRoleBadgeVariant(role as UserRole)} className="text-[10px] sm:text-xs md:text-sm">
                                {getRoleLabel(role as UserRole)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[120px] min-w-0">{user.phone || 'N/A'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id)}
                            className="h-auto p-0"
                          >
                            <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs sm:text-sm">
                              {user.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </Button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleEditUser(user);
                                setIsAddDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                              title="Modifier"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Supprimer"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="w-[95vw] max-w-md">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-base sm:text-lg">Supprimer l'utilisateur</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm">
                                    Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                  <AlertDialogCancel className="w-full sm:w-auto text-sm">Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="w-full sm:w-auto text-sm">
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
          )}
        </>
      )}

      {/* Skeleton Loading - Vue tableau */}
      {isLoading && viewMode === 'table' && (
        <Card className="w-full min-w-0 box-border hidden lg:block">
          <CardHeader className="p-2 sm:p-3 md:p-4">
            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-3 w-full min-w-0 overflow-x-auto">
            <div className="w-full min-w-0">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                    <TableHead className="text-xs sm:text-sm">Email</TableHead>
                    <TableHead className="text-xs sm:text-sm">Nom d'utilisateur</TableHead>
                    <TableHead className="text-xs sm:text-sm">Rôle</TableHead>
                    <TableHead className="text-xs sm:text-sm">Téléphone</TableHead>
                    <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && filteredUsers.length === 0 && (
        <Card className="p-6 sm:p-12 text-center">
          <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            {users.length === 0 ? 'Aucun utilisateur' : 'Aucun résultat'}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            {users.length === 0 
              ? 'Commencez par ajouter votre premier utilisateur.'
              : 'Aucun utilisateur ne correspond à vos critères de recherche.'
            }
          </p>
          {users.length === 0 && (
            <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un utilisateur
            </Button>
          )}
        </Card>
      )}

      {/* Pagination */}
      {filteredUsers.length > 0 && totalPages > 1 && (
        <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full min-w-0 overflow-x-hidden">
          <Pagination>
            <PaginationContent className="flex-wrap min-w-0">
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Users;