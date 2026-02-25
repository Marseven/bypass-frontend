import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, Search, Filter, LayoutGrid, Table as TableIcon, Shield, ArrowLeft, Download, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { mockEquipment, getAllZones } from '@/data/mockEquipment';
import type { Equipment, EquipmentType, EquipmentStatus, CriticalityLevel, Zone } from '@/types/equipment';
import { Link } from 'react-router-dom';
import api from '../axios';
import { exportToCSV } from '../utils/exportData';
import CsvImportDialog from '../components/CsvImportDialog';

const Equipment = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [zones, setZones] = useState<Zone[]>([])
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(isMobile ? 'grid' : 'grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({ 
    name: '',
    type: '' as EquipmentType,
    zone: '',
    fabricant: '',
    model: '',
    status: '' as EquipmentStatus,
    criticite: '' as CriticalityLevel
  });



  const equipmentTypes: EquipmentType[] = ['conveyor', 'crusher', 'pump', 'fan', 'separator', 'loader', 'truck', 'drill'];
  const equipmentStatuses: EquipmentStatus[] = ['operational', 'maintenance', 'down', 'standby'];
  const criticalityLevels: CriticalityLevel[] = ['low', 'medium', 'high', 'critical'];


  const fetchZones = async () => {
    try {
      const response = await api.get('/zones').then(response => {
        if (response.data.data.length !== 0) {
          const formattedZones = response.data.data.map(
            (zoneName: any, index: number) => ({
              id: `${index + 1}`,
              name: zoneName.name,
              description: `${zoneName.description.toLowerCase()}`,
              equipmentCount: zoneName.equipements.length,
            })
          );

          setZones(formattedZones)
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      }); 
    } catch (error) {
      console.error("Erreur lors du GET zones :", error);
    }
  };


  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/equipment').then(response => {
        if (response.data.data.length !== 0) {
          const formattedEquips = response.data.data.map(
            (eqs: any, index: number) => ({
              id: eqs.id,
              name: eqs.name,
              code: eqs.code,
              type: eqs.type,
              zone: eqs.zone?.name || 'N/A',
              fabricant: eqs.fabricant,
              status: eqs.status,
              criticite: eqs.criticite,
              sensors: eqs.sensors
            })
          );

          setEquipment(formattedEquips);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }); 
    } catch (error) {
      console.error("Erreur lors du GET equipment :", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
   fetchZones()
   fetchEquipment()
  }, []); // 👈 tableau vide = exécuté UNE seule fois au montage


  const getStatusColor = (status: EquipmentStatus) => {
    switch (status) {
      case 'operational': return 'bg-primary';
      case 'maintenance': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      case 'standby': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getCriticalityColor = (criticite: CriticalityLevel) => {
    switch (criticite) {
      case 'low': return 'text-primary';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = selectedZone === 'all' || eq.zone === selectedZone;
    const matchesStatus = selectedStatus === 'all' || eq.status === selectedStatus;

    console.log(selectedZone)
    
    return matchesSearch && matchesZone && matchesStatus;
  });

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres ou le nombre d'éléments par page changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedZone, selectedStatus, itemsPerPage]);

  // Ajuster la page courante si elle dépasse le nombre total de pages après suppression
  useEffect(() => {
    const totalPages = Math.ceil(filteredEquipment.length / itemsPerPage);
    if (filteredEquipment.length === 0) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredEquipment.length, itemsPerPage, currentPage]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    if (!formData.type) {
      errors.type = 'Le type est requis';
    }
    if (!formData.zone) {
      errors.zone = 'La zone est requise';
    }
    if (!formData.fabricant.trim()) {
      errors.fabricant = 'Le fabricant est requis';
    }
    if (!formData.status) {
      errors.status = 'Le statut est requis';
    }
    if (!formData.criticite) {
      errors.criticite = 'La criticité est requise';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire avant la soumission
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingEquipment) {
        setEquipment(equipment.map(eq => 
          eq.id === editingEquipment.id 
            ? { ...eq, ...formData, updatedAt: new Date() }
            : eq
        ));

        // Filtrer les champs vides avant l'envoi
        const dataToSend = {
          name: formData.name.trim(),
          type: formData.type,
          zone: formData.zone,
          fabricant: formData.fabricant.trim(),
          status: formData.status,
          criticite: formData.criticite,
          ...(formData.model && { model: formData.model.trim() })
        };
        
        const data = await api({
          method: 'put',
          url: `/equipment/${editingEquipment.id}`,
          data: dataToSend
        });

        await fetchEquipment();
        
        if (data) {
          toast({
            title: "Équipement modifié",
            description: "L'équipement a été mis à jour avec succès.",
          });
        } else {
          toast({
            title: 'Échec de la mise à jour',
            variant: 'destructive',
          });
        }
      } else {
        const newEquipment: Equipment = {
          id: `eq_${Date.now()}`,
          ...formData,
          installationDate: new Date(),
          sensors: []
        };

        setEquipment([...equipment, newEquipment]);
        
        // Filtrer les champs vides avant l'envoi
        const dataToSend = {
          name: formData.name.trim(),
          type: formData.type,
          zone: formData.zone,
          fabricant: formData.fabricant.trim(),
          status: formData.status,
          criticite: formData.criticite,
          ...(formData.model && { model: formData.model.trim() })
        };
        
        const data = await api({
          method: 'post',
          url: '/equipment',
          data: dataToSend
        });

        await fetchEquipment();
        
        if (data) {
          toast({
            title: "Équipement créé",
            description: "Le nouvel équipement a été ajouté avec succès.",
          });
        } else {
          toast({
            title: 'Échec de la création',
            variant: 'destructive',
          });
        }
      }
      
      setIsDialogOpen(false);
      setEditingEquipment(null);
      setFormErrors({});
      setFormData({
        name: '', type: '' as EquipmentType, zone: '',
        fabricant: '', model: '', status: '' as EquipmentStatus,
        criticite: '' as CriticalityLevel
      });
    } catch (error: any) {
      console.error('Error submitting equipment:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || (editingEquipment ? "Erreur lors de la modification de l'équipement." : "Erreur lors de la création de l'équipement."),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (eq: Equipment) => {
    setEditingEquipment(eq);
    setIsSubmitting(false);
    setFormData({
      name: eq.name,
      type: eq.type,
      zone: eq.zone,
      fabricant: eq.fabricant,
      model: eq.model,
      status: eq.status,
      criticite: eq.criticite
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (equipmentId: string) => {
    try {
      await api.delete(`/equipment/${equipmentId}`);
      toast({
        title: "Équipement supprimé",
        description: "L'équipement a été supprimé avec succès.",
      });
      // Recharger la liste des équipements après suppression
      await fetchEquipment();
      // Ajuster la pagination si nécessaire (l'effet s'en chargera automatiquement)
    } catch (error: any) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression de l'équipement.",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingEquipment(null);
    setIsSubmitting(false);
    setFormErrors({});
    setFormData({
      name: '', type: '' as EquipmentType, zone: '',
      fabricant: '', model: '', status: '' as EquipmentStatus,
      criticite: '' as CriticalityLevel
    });
    setIsDialogOpen(true);
  };

  const handleExportData = () => {
    try {
      const dataToExport = filteredEquipment.map(eq => ({
        'Code': eq.code,
        'Nom': eq.name,
        'Type': eq.type,
        'Zone': eq.zone,
        'Fabricant': eq.fabricant || 'N/A',
        'Statut': eq.status,
        'Criticité': eq.criticite || 'N/A',
        'Nombre de capteurs': eq.sensors ? eq.sensors.length : 0
      }));

      exportToCSV(dataToExport, `equipements_${new Date().toISOString().split('T')[0]}`);
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
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words mb-1 truncate">Gestion des Équipements</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2 line-clamp-1">Gérez vos équipements industriels</p>
                <Breadcrumb>
                  <BreadcrumbList className="flex-wrap">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/" className="truncate">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate">Équipements</BreadcrumbPage>
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
        {/* <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Filtres</CardTitle>
        </CardHeader> */}
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center justify-between w-full min-w-0">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 flex-1 w-full min-w-0">
              <div className="w-full sm:min-w-[150px] sm:max-w-[300px] flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                  <Input
                    id="search"
                    placeholder="Nom ou code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 text-xs sm:text-sm md:text-base w-full min-w-0"
                  />
                </div>
              </div>
              <div className="w-full sm:min-w-[140px] sm:max-w-[200px] flex-shrink-0">
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger className="w-full text-xs sm:text-sm md:text-base min-w-0">
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les zones</SelectItem>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:min-w-[140px] sm:max-w-[200px] flex-shrink-0">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full text-xs sm:text-sm md:text-base min-w-0">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {equipmentStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                variant="outline"
                className="gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm h-9 sm:h-10"
                size={isMobile ? "sm" : "default"}
              >
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline truncate">Importer</span>
                <span className="sm:hidden truncate">Import</span>
              </Button>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm h-9 sm:h-10"
                size={isMobile ? "sm" : "default"}
                disabled={filteredEquipment.length === 0}
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline truncate">Exporter</span>
                <span className="sm:hidden truncate">Export</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                  setEditingEquipment(null);
                  setIsSubmitting(false);
                  setFormErrors({});
                  setFormData({
                    name: '', type: '' as EquipmentType, zone: '',
                    fabricant: '', model: '', status: '' as EquipmentStatus,
                    criticite: '' as CriticalityLevel
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog} className="gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm h-9 sm:h-10" size={isMobile ? "sm" : "default"}>
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline truncate">Nouvel Équipement</span>
                    <span className="sm:hidden truncate">Nouvel</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">
                    {editingEquipment ? 'Modifier l\'équipement' : 'Créer un nouvel équipement'}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    {editingEquipment ? 'Modifiez les informations de l\'équipement.' : 'Ajoutez un nouvel équipement au système.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] sm:max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-sm">Nom <span className="text-destructive">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({...formData, name: e.target.value});
                          if (formErrors.name) {
                            setFormErrors({...formErrors, name: ''});
                          }
                        }}
                        placeholder="Nom de l'équipement"
                        required
                        className={`text-sm sm:text-base ${formErrors.name ? 'border-destructive' : ''}`}
                      />
                      {formErrors.name && (
                        <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type" className="text-sm">Type <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: EquipmentType) => {
                          setFormData({...formData, type: value});
                          if (formErrors.type) {
                            setFormErrors({...formErrors, type: ''});
                          }
                        }}
                      >
                        <SelectTrigger className={`text-sm sm:text-base ${formErrors.type ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.type && (
                        <p className="text-xs text-destructive mt-1">{formErrors.type}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="zone" className="text-sm">Zone <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formData.zone} 
                        onValueChange={(value) => {
                          setFormData({...formData, zone: value});
                          if (formErrors.zone) {
                            setFormErrors({...formErrors, zone: ''});
                          }
                        }}
                      >
                        <SelectTrigger className={`text-sm sm:text-base ${formErrors.zone ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Sélectionner une zone" />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map(zone => (
                            <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.zone && (
                        <p className="text-xs text-destructive mt-1">{formErrors.zone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="fabricant" className="text-sm">Fabricant <span className="text-destructive">*</span></Label>
                      <Input
                        id="fabricant"
                        value={formData.fabricant}
                        onChange={(e) => {
                          setFormData({...formData, fabricant: e.target.value});
                          if (formErrors.fabricant) {
                            setFormErrors({...formErrors, fabricant: ''});
                          }
                        }}
                        placeholder="Nom du fabricant"
                        required
                        className={`text-sm sm:text-base ${formErrors.fabricant ? 'border-destructive' : ''}`}
                      />
                      {formErrors.fabricant && (
                        <p className="text-xs text-destructive mt-1">{formErrors.fabricant}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="text-sm">Statut <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value: EquipmentStatus) => {
                          setFormData({...formData, status: value});
                          if (formErrors.status) {
                            setFormErrors({...formErrors, status: ''});
                          }
                        }}
                      >
                        <SelectTrigger className={`text-sm sm:text-base ${formErrors.status ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentStatuses.map(status => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.status && (
                        <p className="text-xs text-destructive mt-1">{formErrors.status}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="criticite" className="text-sm">Criticité <span className="text-destructive">*</span></Label>
                      <Select 
                        value={formData.criticite} 
                        onValueChange={(value: CriticalityLevel) => {
                          setFormData({...formData, criticite: value});
                          if (formErrors.criticite) {
                            setFormErrors({...formErrors, criticite: ''});
                          }
                        }}
                      >
                        <SelectTrigger className={`text-sm sm:text-base ${formErrors.criticite ? 'border-destructive' : ''}`}>
                          <SelectValue placeholder="Sélectionner la criticité" />
                        </SelectTrigger>
                        <SelectContent>
                          {criticalityLevels.map(level => (
                            <SelectItem key={level} value={level}>
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.criticite && (
                        <p className="text-xs text-destructive mt-1">{formErrors.criticite}</p>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      setEditingEquipment(null);
                      setIsSubmitting(false);
                      setFormErrors({});
                      setFormData({
                        name: '', type: '' as EquipmentType, zone: '',
                        fabricant: '', model: '', status: '' as EquipmentStatus,
                        criticite: '' as CriticalityLevel
                      });
                    }} className="w-full sm:w-auto" size={isMobile ? "sm" : "default"}>
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto" 
                      size={isMobile ? "sm" : "default"} 
                      disabled={isSubmitting || !formData.name.trim() || !formData.type || !formData.zone || !formData.fabricant.trim() || !formData.status || !formData.criticite}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingEquipment ? 'Modification...' : 'Création...'}
                        </>
                      ) : (
                        editingEquipment ? 'Modifier' : 'Créer'
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
      {!isLoading && filteredEquipment.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="items-per-page" className="text-xs sm:text-sm whitespace-nowrap">Éléments par page:</Label>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-16 sm:w-20 md:w-24 text-sm">
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
            {!isMobile && (
              <div className="flex items-center gap-2 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground text-left sm:text-right w-full sm:w-auto truncate whitespace-nowrap">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredEquipment.length)} sur {filteredEquipment.length} équipement{filteredEquipment.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Liste des équipements */}
      {isLoading ? (
        <>
          {/* Skeleton Loading - Vue grille */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full min-w-0 ${viewMode === 'table' ? 'lg:hidden' : ''}`}>
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <Card key={index} className="flex flex-col h-full w-full min-w-0 box-border">
                <CardHeader className="pb-3 sm:pb-3 p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <Skeleton className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                      <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                      <Skeleton className="h-7 w-7 sm:h-8 sm:w-8" />
                    </div>
                  </div>
                  <Skeleton className="h-3 sm:h-4 w-full mt-1.5 sm:mt-2" />
                </CardHeader>
                <CardContent className="space-y-1.5 sm:space-y-2 md:space-y-3 p-4 sm:p-5 md:p-6 pt-0 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-12" />
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Skeleton Loading - Vue tableau */}
          {viewMode === 'table' && (
            <Card className="w-full min-w-0 box-border hidden lg:block">
              <CardHeader className="p-2 sm:p-3 md:p-4">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="p-0 sm:p-2 md:p-3 w-full min-w-0 overflow-hidden">
                <div className="w-full min-w-0">
                  <Table className="w-full min-w-[700px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px] text-[10px] sm:text-xs md:text-sm">Nom</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Code</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Type</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Zone</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Fabricant</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Statut</TableHead>
                        <TableHead className="min-w-[60px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Criticité</TableHead>
                        <TableHead className="min-w-[60px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Capteurs</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-2 w-2 rounded-full" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-8" /></TableCell>
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
        </>
      ) : viewMode === 'grid' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-6 w-full min-w-0">
            {paginatedEquipment.map((eq) => (
              <Card key={eq.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
                <CardHeader className="pb-3 sm:pb-3 p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-base md:text-lg truncate min-w-0">{eq.name}</CardTitle>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(eq)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[95vw] sm:w-full">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base sm:text-lg">Supprimer l'équipement</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm">
                              Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <AlertDialogCancel className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(eq.id)} className="w-full sm:w-auto">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1.5 sm:mt-2 break-words line-clamp-2">{eq.code} - {eq.type}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 sm:space-y-2 md:space-y-3 p-4 sm:p-5 md:p-6 pt-0 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Zone:</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs md:text-sm truncate max-w-[60%] flex-shrink-0 whitespace-nowrap">{eq.zone}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Statut:</span>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(eq.status)}`} />
                      <span className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{eq.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Criticité:</span>
                    <span className={`text-[10px] sm:text-xs md:text-sm font-medium ${getCriticalityColor(eq.criticite)} truncate whitespace-nowrap flex-shrink-0`}>
                      {eq.criticite}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Capteurs:</span>
                    <Badge variant="secondary" className="text-[10px] sm:text-xs md:text-sm flex-shrink-0 whitespace-nowrap">{eq.sensors.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isLoading && filteredEquipment.length === 0 && (
            <Card className="p-4 sm:p-6 md:p-12 text-center">
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                {equipment.length === 0 ? 'Aucun équipement' : 'Aucun résultat'}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4">
                {equipment.length === 0 
                  ? 'Commencez par ajouter votre premier équipement.'
                  : 'Aucun équipement ne correspond à vos critères de recherche.'
                }
              </p>
              {equipment.length === 0 && (
                <Button onClick={openCreateDialog} size={isMobile ? "sm" : "default"} className="w-full sm:w-auto text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ajouter un équipement</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader className="p-2 sm:p-3 md:p-4">
            <CardTitle className="text-xs sm:text-sm md:text-base">Équipements ({filteredEquipment.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-3 w-full min-w-0 overflow-x-auto">
            <div className="w-full min-w-0">
              <Table className="w-full min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px] text-[10px] sm:text-xs md:text-sm">Nom</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Code</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Type</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Zone</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Fabricant</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Statut</TableHead>
                    <TableHead className="min-w-[60px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Criticité</TableHead>
                    <TableHead className="min-w-[60px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Capteurs</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {paginatedEquipment.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-base sm:text-lg font-semibold mb-2">
                            {equipment.length === 0 ? 'Aucun équipement' : 'Aucun résultat'}
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground mb-4">
                            {equipment.length === 0 
                              ? 'Commencez par ajouter votre premier équipement.'
                              : 'Aucun équipement ne correspond à vos critères de recherche.'
                            }
                          </p>
                          {equipment.length === 0 && (
                            <Button onClick={openCreateDialog} size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
                              <Plus className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Ajouter un équipement</span>
                              <span className="sm:hidden">Ajouter</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEquipment.map((eq) => (
                        <TableRow key={eq.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <div className="space-y-1">
                              <div>{eq.name}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{eq.code}</div>
                              <div className="text-xs text-muted-foreground lg:hidden">
                                <Badge variant="outline" className="text-xs">{eq.type}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">{eq.code}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs sm:text-sm">{eq.type}</Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant="outline" className="text-xs sm:text-sm truncate max-w-[100px]">{eq.zone}</Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{eq.fabricant || 'N/A'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(eq.status)}`} />
                              <span className="text-xs sm:text-sm">{eq.status}</span>
                            </div>
                            <div className="lg:hidden mt-1 space-y-1">
                              <div className="text-muted-foreground text-xs">Fabricant:</div>
                              <div className="text-xs">{eq.fabricant || 'N/A'}</div>
                              <div className="text-muted-foreground text-xs">Criticité:</div>
                              <span className={`text-xs font-medium ${getCriticalityColor(eq.criticite)}`}>
                                {eq.criticite}
                              </span>
                              <div className="text-muted-foreground text-xs">Capteurs:</div>
                              <Badge variant="secondary" className="text-xs">{eq.sensors.length}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                            <span className={`font-medium ${getCriticalityColor(eq.criticite)}`}>
                              {eq.criticite}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                            <Badge variant="secondary" className="text-xs sm:text-sm">{eq.sensors.length}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(eq)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[95vw] sm:w-full">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-base sm:text-lg">Supprimer l'équipement</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs sm:text-sm">
                                      Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                    <AlertDialogCancel className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(eq.id)} className="w-full sm:w-auto">
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

      {/* Pagination */}
      {filteredEquipment.length > 0 && totalPages > 1 && (
        <div className="flex justify-center sm:justify-end items-center mt-4 sm:mt-6 w-full">
          <Pagination>
            <PaginationContent className="flex-wrap gap-1 sm:gap-2">
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
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  // Sur mobile, afficher seulement la page actuelle et les pages adjacentes
                  if (isMobile) {
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  }
                  return true;
                })
                .map((page, index, array) => {
                  // Ajouter des ellipses sur mobile si nécessaire
                  if (isMobile && index > 0 && page - array[index - 1] > 1) {
                    return (
                      <React.Fragment key={`ellipsis-${page}`}>
                        <PaginationItem>
                          <span className="px-2 text-muted-foreground">...</span>
                        </PaginationItem>
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer text-xs sm:text-sm"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      </React.Fragment>
                    );
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        isActive={currentPage === page}
                        className="cursor-pointer text-xs sm:text-sm min-w-[2rem] sm:min-w-[2.5rem]"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
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
        importType="equipment"
        onImportSuccess={() => {
          fetchEquipment();
          toast({
            title: "Import réussi",
            description: "Les équipements ont été importés avec succès.",
          });
        }}
      />
    </div>
  );
};

export default Equipment;