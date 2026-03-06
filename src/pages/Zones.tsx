import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, LayoutGrid, Table as TableIcon, ArrowLeft, Download, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { getAllZones, getEquipmentByZone } from '@/data/mockEquipment';
import { Link } from 'react-router-dom';
import api from '../axios';
import { exportToCSV } from '../utils/exportData';
import CsvImportDialog from '../components/CsvImportDialog';

interface Zone {
  id: string | number;
  name: string;
  description: string;
  equipmentCount: number;
}


const Zones = () => {
  const { toast } = useToast();
  const [zones, setZones] = useState<Zone[]>([]); // 👈 initialise avec un tableau vide
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/zones').then(response => {
        if (response.data.data.length !== 0) {
          console.log(response.data);

          const formattedZones = response.data.data.map(
            (zoneName: any) => ({
              id: zoneName.id,
              name: zoneName.name,
              description: zoneName.description || '',
              equipmentCount: zoneName.equipements ? zoneName.equipements.length : 0,
            })
          );

          setZones(formattedZones);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }); 
    } catch (error) {
      console.error("Erreur lors du GET zones :", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
   fetchZones()
  }, []); // 👈 tableau vide = exécuté UNE seule fois au montage

  // Filtrage des zones
  const filteredZones = zones.filter(zone => {
    const matchesSearch = zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         zone.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredZones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedZones = filteredZones.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres ou le nombre d'éléments par page changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Ajuster la page courante si elle dépasse le nombre total de pages après suppression
  useEffect(() => {
    const totalPages = Math.ceil(filteredZones.length / itemsPerPage);
    if (filteredZones.length === 0) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredZones.length, itemsPerPage, currentPage]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingZone) {
        setZones(zones.map(zone => 
          zone.id === editingZone.id 
            ? { ...zone, ...formData }
            : zone
        ));

        let id = typeof editingZone.id === 'string' && editingZone.id.includes('_') 
          ? editingZone.id.split("_")[1] 
          : editingZone.id;

        const data = await api({
          method: 'put',
          url: `/zones/${id}`,
          data: formData
        });

        await fetchZones();
        
        if (data) {
          toast({
            title: "Zone modifiée",
            description: "La zone a été mise à jour avec succès.",
          });
        } else {
          toast({
            title: 'Échec de la mise à jour',
            variant: 'destructive',
          });
        }
      } else {
        const data = await api({
          method: 'post',
          url: '/zones',
          data: formData
        });

        await fetchZones();
        
        if (data) {
          toast({
            title: "Zone créée",
            description: "La nouvelle zone a été ajoutée avec succès.",
          });
        } else {
          toast({
            title: 'Échec de la création',
            variant: 'destructive',
          });
        }
      }
      
      setIsDialogOpen(false);
      setEditingZone(null);
      setFormData({ name: '', description: ''});
    } catch (error: any) {
      console.error('Error submitting zone:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || (editingZone ? "Erreur lors de la modification de la zone." : "Erreur lors de la création de la zone."),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setIsSubmitting(false);
    setFormData({
      name: zone.name,
      description: zone.description
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (zoneId: string | number) => {
    try {
      await api.delete(`/zones/${zoneId}`);
      toast({
        title: "Zone supprimée",
        description: "La zone a été supprimée avec succès.",
      });
      // Recharger la liste des zones après suppression
      await fetchZones();
      // Ajuster la pagination si nécessaire (l'effet s'en chargera automatiquement)
    } catch (error: any) {
      console.error('Error deleting zone:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression de la zone.",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingZone(null);
    setIsSubmitting(false);
    setFormData({ name: '', description: ''});
    setIsDialogOpen(true);
  };

  const handleExportData = () => {
    try {
      const dataToExport = filteredZones.map(zone => ({
        'Nom': zone.name,
        'Description': zone.description || 'N/A',
        'Nombre d\'équipements': zone.equipmentCount
      }));

      exportToCSV(dataToExport, `zones_${new Date().toISOString().split('T')[0]}`);
      toast({
        title: "Export réussi",
        description: "Les données ont été exportées avec succès.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export des données.",
        variant: "destructive",
      });
    }
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
                <MapPin className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Gestion des Zones</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Gérez les zones et leurs superviseurs</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Zones</BreadcrumbPage>
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

      {/* Filtres */}
      <Card className='w-full box-border'>
        <CardContent className="p-4 sm:p-6 w-full min-w-0">
          <div className="flex flex-col sm:flex-row gap-3 items-center sm:items-center justify-between w-full min-w-0">
            <div className="w-full sm:flex-1 min-w-0">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom ou description de la zone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 w-full text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
                className="gap-2 w-full sm:w-auto flex-shrink-0 text-sm"
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Importer</span>
                <span className="sm:hidden">Import</span>
              </Button>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="gap-2 w-full sm:w-auto flex-shrink-0 text-sm"
                disabled={filteredZones.length === 0}
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Exporter</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingZone(null);
                  setIsSubmitting(false);
                  setFormData({ name: '', description: ''});
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="gap-2 w-full sm:w-auto flex-shrink-0 text-sm">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Nouvelle Zone</span>
                    <span className="sm:hidden">Nouvelle</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    {editingZone ? 'Modifier la zone' : 'Créer une nouvelle zone'}
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {editingZone ? 'Modifiez les informations de la zone.' : 'Ajoutez une nouvelle zone au système.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name">Nom de la zone</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Zone de production A"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Description de la zone"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      setEditingZone(null);
                      setIsSubmitting(false);
                      setFormData({ name: '', description: ''});
                    }} className="w-full sm:w-auto">
                      Annuler
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingZone ? 'Modification...' : 'Création...'}
                        </>
                      ) : (
                        editingZone ? 'Modifier' : 'Créer'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrôles de pagination et sélection du nombre d'éléments */}
      {filteredZones.length > 0 && (
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
          <div className="text-xs text-muted-foreground text-left">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredZones.length)} sur {filteredZones.length} zone{filteredZones.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Liste des zones */}
      {isLoading ? (
        /* Skeleton Loading - Vue grille */
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4 w-full min-w-0 ${viewMode === 'table' ? 'lg:hidden' : ''}`}>
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <Card key={index} className="flex flex-col h-full w-full min-w-0 box-border">
              <CardHeader className="pb-4 p-6 min-w-0">
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Skeleton className="w-3.5 h-3.5 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex gap-0.5">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-6 w-6" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full mt-1.5" />
              </CardHeader>
              <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Vue grille - toujours visible sur mobile, cachée sur desktop si viewMode est 'table' */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3 md:gap-4 w-full min-w-0 ${viewMode === 'table' ? 'lg:hidden' : ''}`}>
            {paginatedZones.map((zone) => (
          <Card key={zone.id} className="hover:shadow-lg transition-shadow flex flex-col h-full w-full min-w-0 box-border">
            <CardHeader className="pb-4 p-6 min-w-0">
              <div className="flex items-start justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <MapPin className="w-6 h-6 text-primary flex-shrink-0" />
                  <CardTitle className="text-lg truncate min-w-0">{zone.name}</CardTitle>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(zone)}
                    className="h-6 w-6 p-0"
                    title="Modifier"
                  >
                    <Edit2 className="w-3 h-3" />
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
                        <AlertDialogTitle className="text-base sm:text-lg">Supprimer la zone</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                          Êtes-vous sûr de vouloir supprimer la zone "{zone.name}" ? Cette action est irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto text-sm">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(zone.id)} className="w-full sm:w-auto text-sm">
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <CardDescription className="text-xs line-clamp-2 mt-1.5">{zone.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 p-6 pt-0 min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <span className="text-xs text-muted-foreground truncate">Équipements:</span>
                <Badge variant="secondary" className="text-xs flex-shrink-0">{zone.equipmentCount}</Badge>
              </div>
            </CardContent>
          </Card>
            ))}
          </div>
          
          {/* Vue tableau - visible seulement sur desktop quand viewMode est 'table' */}
          {viewMode === 'table' && (
        <Card className="w-full min-w-0 box-border hidden lg:block">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base">Zones ({filteredZones.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-3 w-full min-w-0 overflow-hidden">
            <div className="w-full min-w-0">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                    <TableHead className="text-xs sm:text-sm">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm">Équipements</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedZones.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 sm:py-8">
                        <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-semibold mb-2">
                          {zones.length === 0 ? 'Aucune zone' : 'Aucun résultat'}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4">
                          {zones.length === 0 
                            ? 'Commencez par créer votre première zone.'
                            : 'Aucune zone ne correspond à vos critères de recherche.'
                          }
                        </p>
                        {zones.length === 0 && (
                          <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Créer une zone
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedZones.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium text-sm max-w-[150px] sm:max-w-none">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="truncate">{zone.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate min-w-0">{zone.description}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="text-xs sm:text-sm">{zone.equipmentCount}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(zone)}
                              className="h-8 w-8 p-0"
                              title="Modifier"
                            >
                              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                                  <AlertDialogTitle className="text-base sm:text-lg">Supprimer la zone</AlertDialogTitle>
                                  <AlertDialogDescription className="text-sm">
                                    Êtes-vous sûr de vouloir supprimer la zone "{zone.name}" ? Cette action est irréversible.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                  <AlertDialogCancel className="w-full sm:w-auto text-sm">Annuler</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(zone.id)} className="w-full sm:w-auto text-sm">
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
          <CardHeader className="p-3 sm:p-4">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="p-0 sm:p-3 w-full min-w-0 overflow-hidden">
            <div className="w-full min-w-0">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Nom</TableHead>
                    <TableHead className="text-xs sm:text-sm">Description</TableHead>
                    <TableHead className="text-xs sm:text-sm">Équipements</TableHead>
                    <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
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

      {!isLoading && filteredZones.length === 0 && (
        <Card className="p-6 sm:p-12 text-center">
          <MapPin className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            {zones.length === 0 ? 'Aucune zone' : 'Aucun résultat'}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            {zones.length === 0 
              ? 'Commencez par créer votre première zone.'
              : 'Aucune zone ne correspond à vos critères de recherche.'
            }
          </p>
          {zones.length === 0 && (
            <Button onClick={openCreateDialog} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Créer une zone
            </Button>
          )}
        </Card>
      )}

      {/* Pagination */}
      {filteredZones.length > 0 && totalPages > 1 && (
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

      {/* Import CSV Dialog */}
      <CsvImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        importType="zones"
        onImportSuccess={() => {
          fetchZones();
          toast({
            title: "Import réussi",
            description: "Les zones ont été importées avec succès.",
          });
        }}
      />
    </div>
  );
};

export default Zones;