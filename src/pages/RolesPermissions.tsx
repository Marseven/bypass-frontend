import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Edit2, Shield, Save, Key, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../axios';
import { Link } from 'react-router-dom';

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Array<{
    id: number;
    name: string;
    guard_name: string;
  }>;
  user_count: number;
}


const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [allAvailablePermissions, setAllAvailablePermissions] = useState<Array<{id: number, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/permissions');
      console.log('Permissions response:', response.data);
      if (response.data && response.data.data) {
        setAllAvailablePermissions(response.data.data);
      } else {
        console.warn('No permissions data in response:', response.data);
      }
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement des permissions');
    }
  };

  const fetchRoles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/roles');
      console.log('Roles response:', response.data);
      if (response.data && response.data.data) {
        setRoles(response.data.data);
      } else {
        console.warn('No roles data in response:', response.data);
        setError('Aucune donnée reçue du serveur');
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors du chargement des rôles';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;

    setIsLoading(true);
    try {
      await api.put(`/roles/${editingRole.id}/permissions`, {
        permissions: editingPermissions
      });
      
      toast.success('Permissions mises à jour avec succès');
      setIsDialogOpen(false);
      setEditingRole(null);
      fetchRoles(); // Recharger les rôles
    } catch (error: any) {
      console.error('Error saving permissions:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde des permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPermissions = (role: Role) => {
    setEditingRole(role);
    setEditingPermissions(role.permissions.map(p => p.name));
    setIsDialogOpen(true);
  };

  const togglePermission = (permissionName: string) => {
    setEditingPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
  };

  const getPermissionLabel = (permissionName: string): string => {
    // Mapping des permissions Spatie vers des labels français
    const labels: Record<string, string> = {
      'requests.create': 'Créer des demandes',
      'requests.view.own': 'Voir ses propres demandes',
      'requests.view.all': 'Voir toutes les demandes',
      'requests.update.own': 'Modifier ses propres demandes',
      'requests.delete.own': 'Supprimer ses propres demandes',
      'requests.validate.level1': 'Valider niveau 1',
      'requests.validate.level2': 'Valider niveau 2',
      'users.view': 'Voir les utilisateurs',
      'users.create': 'Créer des utilisateurs',
      'users.update': 'Modifier des utilisateurs',
      'users.delete': 'Supprimer des utilisateurs',
      'equipment.view': 'Voir les équipements',
      'equipment.create': 'Créer des équipements',
      'equipment.update': 'Modifier des équipements',
      'equipment.delete': 'Supprimer des équipements',
      'zones.view': 'Voir les zones',
      'zones.create': 'Créer des zones',
      'zones.update': 'Modifier des zones',
      'zones.delete': 'Supprimer des zones',
      'sensors.view': 'Voir les capteurs',
      'sensors.create': 'Créer des capteurs',
      'sensors.update': 'Modifier des capteurs',
      'sensors.delete': 'Supprimer des capteurs',
      'system.settings.manage': 'Gérer les paramètres système',
      'history.view': 'Voir l\'historique',
      'dashboard.view': 'Voir le tableau de bord',
    };
    return labels[permissionName] || permissionName;
  };

  const getPermissionDescription = (permissionName: string): string => {
    const descriptions: Record<string, string> = {
      'requests.create': 'Permet de créer de nouvelles demandes de bypass',
      'requests.view.own': 'Permet de voir uniquement ses propres demandes',
      'requests.view.all': 'Permet de voir toutes les demandes du système',
      'requests.validate.level1': 'Permet de valider les demandes au niveau 1 (supervisor)',
      'requests.validate.level2': 'Permet de valider les demandes au niveau 2 (administrator/director)',
      'users.view': 'Permet de consulter la liste des utilisateurs',
      'users.create': 'Permet de créer de nouveaux utilisateurs',
      'users.update': 'Permet de modifier des utilisateurs existants',
      'users.delete': 'Permet de supprimer des utilisateurs',
      'equipment.view': 'Permet de consulter la liste des équipements',
      'equipment.create': 'Permet de créer de nouveaux équipements',
      'equipment.update': 'Permet de modifier des équipements existants',
      'equipment.delete': 'Permet de supprimer des équipements',
      'zones.view': 'Permet de consulter la liste des zones',
      'zones.create': 'Permet de créer de nouvelles zones',
      'zones.update': 'Permet de modifier des zones existantes',
      'zones.delete': 'Permet de supprimer des zones',
      'sensors.view': 'Permet de consulter la liste des capteurs',
      'sensors.create': 'Permet de créer de nouveaux capteurs',
      'sensors.update': 'Permet de modifier des capteurs existants',
      'sensors.delete': 'Permet de supprimer des capteurs',
      'system.settings.manage': 'Permet de modifier les paramètres système',
      'history.view': 'Permet de consulter l\'historique des actions',
      'dashboard.view': 'Permet d\'accéder au tableau de bord',
    };
    return descriptions[permissionName] || '';
  };

  const groupPermissionsByCategory = (permissions: Array<{id: number, name: string}>) => {
    const categories: Record<string, Array<{id: number, name: string}>> = {
      'Demandes': [],
      'Utilisateurs': [],
      'Équipements': [],
      'Zones': [],
      'Capteurs': [],
      'Système': [],
    };

    permissions.forEach(perm => {
      if (perm.name.startsWith('requests.')) {
        categories['Demandes'].push(perm);
      } else if (perm.name.startsWith('users.')) {
        categories['Utilisateurs'].push(perm);
      } else if (perm.name.startsWith('equipment.')) {
        categories['Équipements'].push(perm);
      } else if (perm.name.startsWith('zones.')) {
        categories['Zones'].push(perm);
      } else if (perm.name.startsWith('sensors.')) {
        categories['Capteurs'].push(perm);
      } else {
        categories['Système'].push(perm);
      }
    });

    return categories;
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Gestion des Rôles et Permissions</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Configurez les permissions pour chaque rôle</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Rôles et Permissions</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            {/* Bouton retour */}
            <Button variant="outline" size="icon" className="flex-shrink-0 rounded-full w-10 h-10" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour modifier les permissions */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingRole(null);
        }
      }}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Modifier les permissions - {editingRole?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Ajoutez ou retirez des permissions pour le rôle "{editingRole?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 w-full min-w-0">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm text-muted-foreground">Rôle: <span className="font-medium">{editingRole?.name}</span></Label>
              <p className="text-xs sm:text-sm text-muted-foreground">Nombre d'utilisateurs: {editingRole?.user_count || 0}</p>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Label className="text-sm sm:text-base font-semibold">Permissions</Label>
              
              {allAvailablePermissions.length > 0 && (() => {
                const categories = groupPermissionsByCategory(allAvailablePermissions);
                return Object.entries(categories).map(([category, perms]) => 
                  perms.length > 0 ? (
                    <div key={category} className="space-y-2 sm:space-y-3 border rounded-lg p-3 sm:p-4">
                      <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">{category}</h4>
                      {perms.map((permission) => (
                        <div key={permission.id} className="flex items-start space-x-2 sm:space-x-3 min-w-0">
                          <Checkbox
                            id={`perm-${permission.id}`}
                            checked={editingPermissions.includes(permission.name)}
                            onCheckedChange={() => togglePermission(permission.name)}
                            className="mt-1 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <Label 
                              htmlFor={`perm-${permission.id}`}
                              className="text-xs sm:text-sm font-medium cursor-pointer break-words"
                            >
                              {getPermissionLabel(permission.name)}
                            </Label>
                            <p className="text-xs text-muted-foreground break-words">
                              {getPermissionDescription(permission.name)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null
                );
              })()}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingRole(null);
              }}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm"
            >
              Annuler
            </Button>
            <Button onClick={handleSavePermissions} disabled={isLoading} className="w-full sm:w-auto text-sm">
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
              {isLoading ? 'Enregistrement...' : 'Enregistrer les permissions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liste des rôles */}
      {isLoading ? (
        <Card className="w-full min-w-0 box-border">
          <CardContent className="p-6 sm:p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4 animate-pulse" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">Chargement des rôles...</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Veuillez patienter pendant le chargement des données.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="w-full min-w-0 box-border">
          <CardContent className="p-6 sm:p-12 text-center">
            <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              {error}
            </p>
            <Button onClick={() => {
              setError(null);
              fetchRoles();
              fetchPermissions();
            }}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full min-w-0 box-border">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              Rôles ({roles.length})
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Liste des rôles et leurs permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-3 w-full min-w-0 overflow-hidden box-border">
            <div className="w-full min-w-0 overflow-x-hidden box-border">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm min-w-0 w-[20%] sm:w-auto">Nom</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden sm:table-cell min-w-0 w-[15%]">Code</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden md:table-cell min-w-0 w-[25%]">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm hidden lg:table-cell min-w-0 w-[10%]">Utilisateurs</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-0 w-[20%] sm:w-auto">Permissions</TableHead>
                    <TableHead className="text-xs sm:text-sm text-right min-w-0 w-[15%] sm:w-auto">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 sm:py-8">
                        <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">Aucun rôle</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">
                          Les rôles sont prédéfinis dans le système.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium text-xs sm:text-sm min-w-0 overflow-hidden">
                          <div className="flex flex-col sm:block min-w-0">
                            <span className="truncate sm:whitespace-normal">{role.name}</span>
                            <span className="text-xs text-muted-foreground sm:hidden mt-1 truncate">{role.guard_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell min-w-0 overflow-hidden">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{role.name}</Badge>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm hidden md:table-cell truncate min-w-0 overflow-hidden max-w-[200px]">
                          {role.name === 'user' ? 'Utilisateur standard pouvant soumettre des demandes' :
                           role.name === 'supervisor' ? 'Superviseur pouvant approuver les demandes de niveau 1' :
                           role.name === 'director' ? 'Directeur pouvant approuver les demandes de niveau 2' :
                           role.name === 'administrator' ? 'Administrateur avec tous les droits' : ''}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell min-w-0 overflow-hidden">
                          <Badge variant="secondary" className="text-xs sm:text-sm whitespace-nowrap">{role.user_count || 0}</Badge>
                        </TableCell>
                        <TableCell className="min-w-0 overflow-hidden">
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {role.permissions && role.permissions.slice(0, 2).map((perm) => (
                              <Badge key={perm.id} variant="outline" className="text-xs truncate max-w-[80px] sm:max-w-none">
                                <span className="hidden sm:inline">{getPermissionLabel(perm.name)}</span>
                                <span className="sm:hidden">{getPermissionLabel(perm.name).split(' ')[0]}</span>
                              </Badge>
                            ))}
                            {role.permissions && role.permissions.length > 2 && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                +{role.permissions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right min-w-0 overflow-hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPermissions(role)}
                            className="text-xs sm:text-sm h-7 sm:h-8 p-1 sm:p-2"
                          >
                            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Modifier les permissions</span>
                          </Button>
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

    </div>
  );
};

export default RolesPermissions;

