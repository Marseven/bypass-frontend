import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search, Settings, Gauge, LayoutGrid, Table as TableIcon, ArrowLeft, Download, Loader2, Upload } from 'lucide-react';
import { mockEquipment } from '@/data/mockEquipment';
import { Sensor, SensorType, SensorStatus } from '@/types/equipment';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';
import type { Equipment, EquipmentType, EquipmentStatus, CriticalityLevel, Zone } from '@/types/equipment';
import api from '../axios';
import { exportToCSV } from '../utils/exportData';
import CsvImportDialog from '../components/CsvImportDialog';

// Type étendu pour les sensors avec les informations d'équipement
type SensorWithEquipment = Sensor & {
  equipmentName?: string;
  equipmentCode?: string;
};

const Sensors: React.FC = () => {
  const isMobile = useIsMobile();
  const [equipmentData, setEquipmentData] = useState(mockEquipment);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<SensorWithEquipment | null>(null);
  const [newSensor, setNewSensor] = useState({
    name: '',
    code: '',
    type: 'temperature' as SensorType,
    unit: '',
    minValue: 0,
    maxValue: 100,
    criticalThreshold: 80,
    equipmentId: '',
    status: 'active' as SensorStatus
  });
  const [sensor, setSensor] = useState<SensorWithEquipment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(isMobile ? 'grid' : 'grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flatten all sensors from all equipment
  // const allSensors = equipmentData.flatMap(equipment => 
  //   equipment.sensors.map(sensor => ({
  //     ...sensor,
  //     equipmentName: equipment.name,
  //     equipmentCode: equipment.code
  //   }))
  // );

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment').then(response => {
        if (response.data.data && response.data.data.length > 0) {
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

          setEquipment(formattedEquips)
        } else {
          setEquipment([]);
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setEquipment([]);
      }); 
    } catch (error) {
      console.error("Erreur lors du GET equipment :", error);
      setEquipment([]);
    }
  };

  const fetchSensor = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sensors').then(response => {
        const data = response.data.data
        if (data.length !== 0) {
          const formattedEquips = data.map(
            (eqs: any, index: number) => ({
              id: eqs.id,
              equipmentId: eqs.equipment_id,
              name: eqs.name ,
              code: eqs.code,
              type: eqs.type,
              unit: eqs.unite,
              criticalThreshold: eqs.seuil_critique,
              status: eqs.status,
              lastCalibration: (new Date(eqs.Dernier_Etallonnage.replace(' ', 'T'))).toLocaleString(),
              equipmentName: `${eqs.equipment.name} - ${eqs.equipment.zone.name}` ,
              equipmentCode: eqs.equipment.code,
              isActive: eqs.status === 'active' ? true : false
            })
          );

          console.log(formattedEquips)

          setSensor(formattedEquips)
        }
        setIsLoading(false);
        // console.log(response);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setIsLoading(false);
      }); 
    } catch (error) {
      console.error("Erreur lors du GET sensors :", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
   fetchEquipment()
   fetchSensor()
  }, []); // 👈 tableau vide = exécuté UNE seule fois au montage

  const filteredSensors = sensor.filter(sensor => {
    const matchesSearch = sensor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sensor.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sensor.equipmentName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || sensor.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || sensor.status === selectedStatus;
    const matchesEquipment = selectedEquipment === 'all' || sensor.equipmentId === selectedEquipment;
    console.log(selectedEquipment)
    return matchesSearch && matchesType && matchesStatus && matchesEquipment;
  });

  // Calcul de la pagination
  const totalPages = Math.ceil(filteredSensors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSensors = filteredSensors.slice(startIndex, endIndex);

  // Réinitialiser la page quand les filtres ou le nombre d'éléments par page changent
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType, selectedStatus, selectedEquipment, itemsPerPage]);

  // Ajuster la page courante si elle dépasse le nombre total de pages après suppression
  useEffect(() => {
    const totalPages = Math.ceil(filteredSensors.length / itemsPerPage);
    if (filteredSensors.length === 0) {
      setCurrentPage(1);
    } else if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredSensors.length, itemsPerPage, currentPage]);

  const handleAddSensor = async () => {
    setIsSubmitting(true);
    const sensor: Sensor = {
      id: `sensor-${Date.now()}`,
      ...newSensor,
      status: 'active' as SensorStatus,
      isActive: true,
      bypassHistory: []
    };

    setEquipmentData(equipmentData.map(equipment => 
      equipment.id === newSensor.equipmentId
        ? { ...equipment, sensors: [...equipment.sensors, sensor] }
        : equipment
    ));

    try {
      const data = await api({
        method: 'post',
        url: `/equipment/${newSensor.equipmentId}/sensors`,
        data: {
          ...newSensor,
          criticalThreshold: String(newSensor.criticalThreshold || '')
        }
      });

      fetchEquipment()
      fetchSensor()
      setNewSensor({
        name: '',
        code: '',
        type: 'temperature',
        unit: '',
        minValue: 0,
        maxValue: 100,
        criticalThreshold: 80,
        equipmentId: '',
        status: 'active'
      });
      setEditingSensor(null);
      setIsAddDialogOpen(false);
      if (data) {
        toast.success("Capteur créé");
      } else {
        toast.error("Probleme de connexion");
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'ajout du capteur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSensor = (sensor: Sensor) => {
    setEditingSensor(sensor);
    setNewSensor({
      name: sensor.name,
      code: sensor.code,
      type: sensor.type,
      unit: sensor.unit,
      minValue: sensor.minValue,
      maxValue: sensor.maxValue,
      criticalThreshold: sensor.criticalThreshold,
      equipmentId: String(sensor.equipmentId || ''),
      status: sensor.status
    });
    setIsAddDialogOpen(true);
  };

  const handleUpdateSensor = async () => {
    if (editingSensor) {
      setIsSubmitting(true);
      setEquipmentData(equipmentData.map(equipment => ({
        ...equipment,
        sensors: equipment.sensors.map(sensor =>
          sensor.id === editingSensor.id
            ? { ...sensor, ...newSensor }
            : sensor
        )
      })));

      try {
        const data = await api({
          method: 'put',
          url: `/sensors/${editingSensor.id}`,
          data: {
            ...newSensor,
            criticalThreshold: String(newSensor.criticalThreshold || '')
          }
        });

        fetchSensor()
        setEditingSensor(null);
        setNewSensor({
          name: '',
          code: '',
          type: 'temperature',
          unit: '',
          minValue: 0,
          maxValue: 100,
          criticalThreshold: 80,
          equipmentId: '',
          status: 'active'
        });
        setIsAddDialogOpen(false);
        if (data) {
          toast.success('Capteur modifié avec succès');
        } else {
          toast.error('Erreur de Connexion');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Erreur lors de la modification du capteur');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleExportData = () => {
    try {
      const dataToExport = filteredSensors.map(sens => ({
        'Code': sens.code,
        'Nom': sens.name,
        'Type': sens.type,
        'Unité': sens.unit || 'N/A',
        'Seuil critique': sens.criticalThreshold || 'N/A',
        'Statut': sens.status,
        'Équipement': sens.equipmentName || 'N/A',
        'Code équipement': sens.equipmentCode || 'N/A',
        'Dernière calibration': sens.lastCalibration || 'N/A'
      }));

      exportToCSV(dataToExport, `capteurs_${new Date().toISOString().split('T')[0]}`);
      toast.success('Export réussi - Les données ont été exportées avec succès.');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erreur d\'export - Une erreur est survenue lors de l\'export des données.');
    }
  };

  const handleDeleteSensor = async (sensorId: string) => {
    try {
      await api.delete(`/sensors/${sensorId}`);
      toast.success('Capteur supprimé avec succès');
      // Recharger la liste des capteurs après suppression
      await fetchSensor();
      // Ajuster la pagination si nécessaire (l'effet s'en chargera automatiquement)
    } catch (error: any) {
      console.error('Error deleting sensor:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du capteur');
    }
  };

  const toggleSensorStatus = (sensorId: string) => {
    setEquipmentData(equipmentData.map(equipment => ({
      ...equipment,
      sensors: equipment.sensors.map(sensor =>
        sensor.id === sensorId
          ? { ...sensor, isActive: !sensor.isActive }
          : sensor
      )
    })));
    toast.success('Statut du capteur modifié');
  };

  const getStatusBadgeVariant = (status: SensorStatus) => {
    switch (status) {
      case 'active': return 'default';
      case 'bypassed': return 'secondary';
      case 'maintenance': return 'outline';
      case 'faulty': return 'destructive';
      case 'calibration': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: SensorStatus) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'bypassed': return 'Contourné';
      case 'maintenance': return 'Maintenance';
      case 'faulty': return 'Défaillant';
      case 'calibration': return 'Calibrage';
      default: return status;
    }
  };

  const getTypeLabel = (type: SensorType) => {
    switch (type) {
      case 'temperature': return 'Température';
      case 'vibration': return 'Vibration';
      case 'pressure': return 'Pression';
      case 'flow': return 'Débit';
      case 'level': return 'Niveau';
      case 'speed': return 'Vitesse';
      case 'current': return 'Courant';
      case 'voltage': return 'Tension';
      default: return type;
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
                <Gauge className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground break-words mb-1 truncate">Gestion des Capteurs</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2 line-clamp-1">Gérez les capteurs et leurs configurations</p>
                <Breadcrumb>
                  <BreadcrumbList className="flex-wrap">
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/" className="truncate">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="truncate">Capteurs</BreadcrumbPage>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 flex-1 w-full min-w-0">
              <div className="sm:col-span-2 lg:col-span-1 w-full min-w-0">
                {/* <Label htmlFor="search" className="text-xs sm:text-sm">Rechercher</Label> */}
                <div className="relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground z-10" />
                  <Input
                    id="search"
                    placeholder="Nom, code ou équipement..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 text-xs sm:text-sm md:text-base w-full min-w-0"
                  />
                </div>
              </div>
              <div className="w-full min-w-0">
                {/* <Label htmlFor="equipment-filter" className="text-xs sm:text-sm">Équipement</Label> */}
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger className="w-full text-xs sm:text-sm md:text-base min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les équipements</SelectItem>
                    {equipment.map(equipment => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name} - {equipment.zone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full min-w-0">
                {/* <Label htmlFor="type-filter" className="text-xs sm:text-sm">Type</Label> */}
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full text-xs sm:text-sm md:text-base min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="temperature">Température</SelectItem>
                    <SelectItem value="vibration">Vibration</SelectItem>
                    <SelectItem value="pressure">Pression</SelectItem>
                    <SelectItem value="flow">Débit</SelectItem>
                    <SelectItem value="level">Niveau</SelectItem>
                    <SelectItem value="speed">Vitesse</SelectItem>
                    <SelectItem value="current">Courant</SelectItem>
                    <SelectItem value="voltage">Tension</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full min-w-0">
                {/* <Label htmlFor="status-filter" className="text-xs sm:text-sm">Statut</Label> */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full text-xs sm:text-sm md:text-base min-w-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="bypassed">Contourné</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="faulty">Défaillant</SelectItem>
                    <SelectItem value="calibration">Calibrage</SelectItem>
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
                disabled={filteredSensors.length === 0}
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline truncate">Exporter</span>
                <span className="sm:hidden truncate">Export</span>
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingSensor(null);
                  setIsSubmitting(false);
                  setNewSensor({
                    name: '',
                    code: '',
                    type: 'temperature',
                    unit: '',
                    minValue: 0,
                    maxValue: 100,
                    criticalThreshold: 80,
                    equipmentId: '',
                    status: 'active'
                  });
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm h-9 sm:h-10" size={isMobile ? "sm" : "default"}>
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline truncate">Ajouter un capteur</span>
                    <span className="sm:hidden truncate">Ajouter</span>
                  </Button>
                </DialogTrigger>
          <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                {editingSensor ? 'Modifier le capteur' : 'Ajouter un capteur'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingSensor ? 'Modifiez les paramètres du capteur.' : 'Ajoutez un nouveau capteur à un équipement.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingSensor) {
                handleUpdateSensor();
              } else {
                handleAddSensor();
              }
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="equipment" className="text-sm">Équipement</Label>
                <Select value={newSensor.equipmentId || ''} onValueChange={(value) => setNewSensor({...newSensor, equipmentId: value})}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Sélectionner un équipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.length === 0 ? (
                      <SelectItem value="" disabled>Aucun équipement disponible</SelectItem>
                    ) : (
                      equipment.map((equipmentItem) => (
                        <SelectItem key={equipmentItem.id} value={String(equipmentItem.id)}>
                          {equipmentItem.name} ({equipmentItem.code})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm">Nom</Label>
                  <Input
                    id="name"
                    value={newSensor.name}
                    onChange={(e) => setNewSensor({...newSensor, name: e.target.value})}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm">Type</Label>
                  <Select value={newSensor.type} onValueChange={(value: SensorType) => setNewSensor({...newSensor, type: value})}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">Température</SelectItem>
                      <SelectItem value="vibration">Vibration</SelectItem>
                      <SelectItem value="pressure">Pression</SelectItem>
                      <SelectItem value="flow">Débit</SelectItem>
                      <SelectItem value="level">Niveau</SelectItem>
                      <SelectItem value="speed">Vitesse</SelectItem>
                      <SelectItem value="current">Courant</SelectItem>
                      <SelectItem value="voltage">Tension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm">Unité</Label>
                  <Input
                    id="unit"
                    value={newSensor.unit}
                    onChange={(e) => setNewSensor({...newSensor, unit: e.target.value})}
                    placeholder="°C, bar, m³/h..."
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="criticalThreshold" className="text-sm">Seuil critique</Label>
                  <Input
                    id="criticalThreshold"
                    type="number"
                    value={newSensor.criticalThreshold}
                    onChange={(e) => setNewSensor({...newSensor, criticalThreshold: Number(e.target.value)})}
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select value={newSensor.status} onValueChange={(value: SensorStatus) => setNewSensor({...newSensor, status: value})}>
                    <SelectTrigger className="text-sm sm:text-base">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="bypassed">Contourné</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="faulty">Défaillant</SelectItem>
                      <SelectItem value="calibration">Calibrage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditingSensor(null);
                  setIsSubmitting(false);
                  setNewSensor({
                    name: '',
                    code: '',
                    type: 'temperature',
                    unit: '',
                    minValue: 0,
                    maxValue: 100,
                    criticalThreshold: 80,
                    equipmentId: '',
                    status: 'active'
                  });
                }} className="w-full sm:w-auto" size={isMobile ? "sm" : "default"}>
                  Annuler
                </Button>
                <Button type="submit" className="w-full sm:w-auto" size={isMobile ? "sm" : "default"} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingSensor ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    editingSensor ? 'Modifier' : 'Ajouter'
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
      {!isLoading && filteredSensors.length > 0 && (
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
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredSensors.length)} sur {filteredSensors.length} capteur{filteredSensors.length > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Liste des capteurs */}
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
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-5 w-12" />
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
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Équipement</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Unité</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Statut</TableHead>
                        <TableHead className="min-w-[60px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Seuil critique</TableHead>
                        <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: itemsPerPage }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
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
            {paginatedSensors.map((sensor) => (
              <Card key={sensor.id} className="hover:shadow-lg transition-shadow w-full min-w-0 box-border">
                <CardHeader className="pb-3 sm:pb-3 p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-start justify-between gap-1.5 sm:gap-2 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                      <Gauge className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-sm sm:text-base md:text-lg truncate min-w-0">{sensor.name}</CardTitle>
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleEditSensor(sensor);
                          setIsAddDialogOpen(true);
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
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
                            <AlertDialogTitle className="text-base sm:text-lg">Supprimer le capteur</AlertDialogTitle>
                            <AlertDialogDescription className="text-xs sm:text-sm">
                              Êtes-vous sûr de vouloir supprimer ce capteur ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                            <AlertDialogCancel className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSensor(sensor.id)} className="w-full sm:w-auto">
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1.5 sm:mt-2 break-words line-clamp-2">{sensor.code} - {getTypeLabel(sensor.type)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 sm:space-y-2 md:space-y-3 p-4 sm:p-5 md:p-6 pt-0 min-w-0">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Équipement:</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs md:text-sm truncate max-w-[60%] flex-shrink-0 whitespace-nowrap">{sensor.equipmentName || 'N/A'}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Type:</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs md:text-sm flex-shrink-0 whitespace-nowrap">{getTypeLabel(sensor.type)}</Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Statut:</span>
                    <Badge variant={getStatusBadgeVariant(sensor.status)} className="text-[10px] sm:text-xs md:text-sm flex-shrink-0 whitespace-nowrap">
                      {getStatusLabel(sensor.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">Seuil critique:</span>
                    <span className="text-[10px] sm:text-xs md:text-sm font-medium text-destructive truncate whitespace-nowrap flex-shrink-0">
                      {sensor.criticalThreshold} {sensor.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">État:</span>
                    <Badge variant={sensor.isActive ? "default" : "secondary"} className="text-[10px] sm:text-xs md:text-sm flex-shrink-0 whitespace-nowrap">
                      {sensor.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!isLoading && filteredSensors.length === 0 && (
            <Card className="p-4 sm:p-6 md:p-12 text-center">
              <Gauge className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                {sensor.length === 0 ? 'Aucun capteur' : 'Aucun résultat'}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-3 sm:mb-4">
                {sensor.length === 0 
                  ? 'Commencez par ajouter votre premier capteur.'
                  : 'Aucun capteur ne correspond à vos critères de recherche.'
                }
              </p>
              {sensor.length === 0 && (
                <Button onClick={() => setIsAddDialogOpen(true)} size={isMobile ? "sm" : "default"} className="w-full sm:w-auto text-xs sm:text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ajouter un capteur</span>
                  <span className="sm:hidden">Ajouter</span>
                </Button>
              )}
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader className="p-2 sm:p-3 md:p-4">
            <CardTitle className="text-xs sm:text-sm md:text-base">Capteurs ({filteredSensors.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-3 w-full min-w-0 overflow-x-auto">
            <div className="w-full min-w-0">
              <Table className="w-full min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[100px] text-[10px] sm:text-xs md:text-sm">Nom</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">Code</TableHead>
                    <TableHead className="min-w-[120px] text-[10px] sm:text-xs md:text-sm">Équipement</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Type</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Statut</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm hidden lg:table-cell">Seuil critique</TableHead>
                    <TableHead className="min-w-[60px] text-[10px] sm:text-xs md:text-sm hidden md:table-cell">État</TableHead>
                    <TableHead className="min-w-[80px] text-[10px] sm:text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {paginatedSensors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <Gauge className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-base sm:text-lg font-semibold mb-2">
                            {sensor.length === 0 ? 'Aucun capteur' : 'Aucun résultat'}
                          </h3>
                          <p className="text-sm sm:text-base text-muted-foreground mb-4">
                            {sensor.length === 0 
                              ? 'Commencez par ajouter votre premier capteur.'
                              : 'Aucun capteur ne correspond à vos critères de recherche.'
                            }
                          </p>
                          {sensor.length === 0 && (
                            <Button onClick={() => setIsAddDialogOpen(true)} size={isMobile ? "sm" : "default"} className="w-full sm:w-auto">
                              <Plus className="w-4 h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Ajouter un capteur</span>
                              <span className="sm:hidden">Ajouter</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedSensors.map((sensor) => (
                        <TableRow key={sensor.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <div className="space-y-1">
                              <div>{sensor.name}</div>
                              <div className="text-xs text-muted-foreground md:hidden">{sensor.code}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">{sensor.code}</TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge variant="outline" className="text-xs sm:text-sm truncate max-w-[150px]">{sensor.equipmentName || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                            <Badge variant="outline" className="text-xs sm:text-sm">{getTypeLabel(sensor.type)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 lg:space-y-0">
                              <Badge variant={getStatusBadgeVariant(sensor.status)} className="text-xs sm:text-sm">
                                {getStatusLabel(sensor.status)}
                              </Badge>
                              <div className="lg:hidden mt-1">
                                <div className="text-muted-foreground text-xs">Type:</div>
                                <Badge variant="outline" className="text-xs">{getTypeLabel(sensor.type)}</Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                            <span className="font-medium text-destructive">
                              {sensor.criticalThreshold} {sensor.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                            <Badge variant={sensor.isActive ? "default" : "secondary"} className="text-xs sm:text-sm">
                              {sensor.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  handleEditSensor(sensor);
                                  setIsAddDialogOpen(true);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="w-[95vw] sm:w-full">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-base sm:text-lg">Supprimer le capteur</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs sm:text-sm">
                                      Êtes-vous sûr de vouloir supprimer ce capteur ? Cette action est irréversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                                    <AlertDialogCancel className="w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>Annuler</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSensor(sensor.id)} className="w-full sm:w-auto">
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
      {filteredSensors.length > 0 && totalPages > 1 && (
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
        importType="sensors"
        onImportSuccess={() => {
          fetchSensor();
          toast.success('Les capteurs ont été importés avec succès.');
        }}
      />
    </div>
  );
};

export default Sensors;