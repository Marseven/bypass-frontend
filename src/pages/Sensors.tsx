import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Search, Download, Loader2, Radio, AlertTriangle, Activity } from 'lucide-react';
import { Sensor, SensorType, SensorStatus } from '@/types/equipment';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import type { Equipment } from '@/types/equipment';
import api from '../axios';
import { exportToCSV } from '../utils/exportData';
import CsvImportDialog from '../components/CsvImportDialog';

type SensorWithEquipment = Sensor & { equipmentName?: string; equipmentCode?: string; };

const Sensors: React.FC = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingSensor, setEditingSensor] = useState<SensorWithEquipment | null>(null);
  const [newSensor, setNewSensor] = useState({
    name: '', code: '', type: 'temperature' as SensorType, unit: '',
    minValue: 0, maxValue: 100, criticalThreshold: 80, equipmentId: '', status: 'active' as SensorStatus
  });
  const [sensors, setSensors] = useState<SensorWithEquipment[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/equipment');
      const data = response.data?.data || [];
      setEquipment(data.map((eq: any) => ({
        id: eq.id, name: eq.name, code: eq.code, type: eq.type,
        zone: eq.zone?.name || 'N/A', fabricant: eq.fabricant,
        status: eq.status, criticite: eq.criticite, sensors: eq.sensors
      })));
    } catch { setEquipment([]); }
  };

  const fetchSensors = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sensors');
      const data = response.data?.data || [];
      setSensors(data.map((s: any) => ({
        id: s.id, equipmentId: s.equipment_id, name: s.name, code: s.code,
        type: s.type, unit: s.unite, criticalThreshold: s.seuil_critique,
        status: s.status,
        lastCalibration: s.Dernier_Etallonnage ? new Date(s.Dernier_Etallonnage.replace(' ', 'T')).toLocaleString() : 'N/A',
        equipmentName: `${s.equipment?.name || 'N/A'} - ${s.equipment?.zone?.name || 'N/A'}`,
        equipmentCode: s.equipment?.code,
        isActive: s.status === 'active'
      })));
    } catch { setSensors([]); }
    setIsLoading(false);
  };

  useEffect(() => { fetchEquipment(); fetchSensors(); }, []);

  const filteredSensors = sensors.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.equipmentName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchType = selectedType === 'all' || s.type === selectedType;
    const matchStatus = selectedStatus === 'all' || s.status === selectedStatus;
    const matchEquip = selectedEquipment === 'all' || String(s.equipmentId) === selectedEquipment;
    return matchSearch && matchType && matchStatus && matchEquip;
  });

  const totalPages = Math.ceil(filteredSensors.length / itemsPerPage);
  const paginatedSensors = filteredSensors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedType, selectedStatus, selectedEquipment]);
  useEffect(() => {
    const tp = Math.ceil(filteredSensors.length / itemsPerPage);
    if (tp > 0 && currentPage > tp) setCurrentPage(tp);
  }, [filteredSensors.length]);

  const handleAddSensor = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/equipment/${newSensor.equipmentId}/sensors`, {
        ...newSensor, criticalThreshold: String(newSensor.criticalThreshold || '')
      });
      toast.success("Capteur créé");
      fetchSensors();
      resetForm();
    } catch { toast.error('Erreur lors de l\'ajout'); }
    setIsSubmitting(false);
  };

  const handleUpdateSensor = async () => {
    if (!editingSensor) return;
    setIsSubmitting(true);
    try {
      await api.put(`/sensors/${editingSensor.id}`, {
        ...newSensor, criticalThreshold: String(newSensor.criticalThreshold || '')
      });
      toast.success('Capteur modifié');
      fetchSensors();
      resetForm();
    } catch { toast.error('Erreur lors de la modification'); }
    setIsSubmitting(false);
  };

  const handleDeleteSensor = async (id: string) => {
    try {
      await api.delete(`/sensors/${id}`);
      toast.success('Capteur supprimé');
      fetchSensors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleEditSensor = (s: SensorWithEquipment) => {
    setEditingSensor(s);
    setNewSensor({
      name: s.name, code: s.code, type: s.type, unit: s.unit,
      minValue: s.minValue || 0, maxValue: s.maxValue || 100,
      criticalThreshold: s.criticalThreshold || 80,
      equipmentId: String(s.equipmentId || ''), status: s.status
    });
    setIsAddDialogOpen(true);
  };

  const resetForm = () => {
    setNewSensor({ name: '', code: '', type: 'temperature', unit: '', minValue: 0, maxValue: 100, criticalThreshold: 80, equipmentId: '', status: 'active' });
    setEditingSensor(null);
    setIsAddDialogOpen(false);
  };

  const handleExport = () => {
    exportToCSV(filteredSensors.map(s => ({
      Code: s.code, Nom: s.name, Type: s.type, Unité: s.unit || 'N/A',
      'Seuil critique': s.criticalThreshold || 'N/A', Statut: s.status,
      Équipement: s.equipmentName || 'N/A'
    })), `capteurs_${new Date().toISOString().split('T')[0]}`);
    toast.success('Export réussi');
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      temperature: 'Température', pressure: 'Pression', vibration: 'Vibration',
      flow: 'Débit', level: 'Niveau', speed: 'Vitesse', position: 'Position', other: 'Autre'
    };
    return map[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-primary text-primary-foreground text-xs font-bold">SAIN</Badge>
      case 'bypassed': return <Badge className="bg-red-600 text-white text-xs font-bold">EN BYPASS</Badge>
      case 'maintenance': return <Badge variant="outline" className="text-xs font-bold">EN MAINTENANCE</Badge>
      case 'inactive': case 'faulty': return <Badge className="bg-orange-500 text-white text-xs font-bold">EN DÉFAUT</Badge>
      default: return <Badge variant="outline" className="text-xs">{status}</Badge>
    }
  };

  const activeCount = sensors.filter(s => s.status === 'active').length;
  const bypassedCount = sensors.filter(s => s.status === 'bypassed').length;
  const faultyCount = sensors.filter(s => ['inactive', 'faulty', 'maintenance'].includes(s.status)).length;

  const statCards = [
    { label: 'Total Capteurs', value: sensors.length, color: 'bg-primary' },
    { label: 'Sains / Actifs', value: activeCount, color: 'bg-primary' },
    { label: 'En Bypass', value: bypassedCount, color: 'bg-orange-500' },
    { label: 'En Défaut / Déconnectés', value: faultyCount, color: 'bg-red-500' },
  ];

  return (
    <div className="w-full p-4 md:p-6 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventaire des Capteurs</h1>
          <p className="text-sm text-muted-foreground">
            Registre complet et statut en temps réel des {sensors.length} instruments de mesure du site.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un Capteur
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${stat.color} opacity-80`} />
              <div>
                <p className="text-2xl font-bold">{isLoading ? '...' : stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Chercher par Tag, Zone, Modèle..." className="pl-10 h-9"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Type: Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Type: Tous</SelectItem>
            {['temperature', 'pressure', 'vibration', 'flow', 'level', 'speed', 'position'].map(t => (
              <SelectItem key={t} value={t}>{getTypeLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Statut: Tous" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Statut: Tous</SelectItem>
            <SelectItem value="active">Sain</SelectItem>
            <SelectItem value="bypassed">En Bypass</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filteredSensors.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Radio className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucun capteur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Identifiant & Description</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Zone</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Seuil</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground">Statut actuel</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSensors.map((s) => (
                    <TableRow key={s.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <span className="font-mono font-semibold text-primary text-sm">{s.code}</span>
                          <p className="text-xs text-muted-foreground mt-0.5">{s.name}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{getTypeLabel(s.type)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.equipmentName || 'N/A'}</TableCell>
                      <TableCell>
                        {s.criticalThreshold ? (
                          <Badge variant="outline" className="text-xs">{s.criticalThreshold} {s.unit}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/sensors/${s.id}/edit`)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer {s.code} ?</AlertDialogTitle>
                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteSensor(s.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(currentPage - 2, totalPages - 4)) + i;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                      isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSensor ? `Éditer ${editingSensor.code}` : 'Ajouter un capteur'}</DialogTitle>
            <DialogDescription>
              {editingSensor ? 'Modifier les informations du capteur' : 'Remplir les informations du nouveau capteur'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input value={newSensor.name} onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })} placeholder="Nom du capteur" />
              </div>
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input value={newSensor.code} onChange={(e) => setNewSensor({ ...newSensor, code: e.target.value })} placeholder="PT-3042" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newSensor.type} onValueChange={(v) => setNewSensor({ ...newSensor, type: v as SensorType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['temperature', 'pressure', 'vibration', 'flow', 'level', 'speed', 'position'].map(t => (
                      <SelectItem key={t} value={t}>{getTypeLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Input value={newSensor.unit} onChange={(e) => setNewSensor({ ...newSensor, unit: e.target.value })} placeholder="°C, bar, mm/s..." />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Min</Label>
                <Input type="number" value={newSensor.minValue} onChange={(e) => setNewSensor({ ...newSensor, minValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input type="number" value={newSensor.maxValue} onChange={(e) => setNewSensor({ ...newSensor, maxValue: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Seuil critique</Label>
                <Input type="number" value={newSensor.criticalThreshold} onChange={(e) => setNewSensor({ ...newSensor, criticalThreshold: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Équipement *</Label>
              <Select value={newSensor.equipmentId} onValueChange={(v) => setNewSensor({ ...newSensor, equipmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un équipement" /></SelectTrigger>
                <SelectContent>
                  {equipment.map((eq: any) => (
                    <SelectItem key={eq.id} value={String(eq.id)}>{eq.name} ({eq.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm}>Annuler</Button>
            <Button onClick={editingSensor ? handleUpdateSensor : handleAddSensor} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingSensor ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <CsvImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        type="sensors"
        onSuccess={() => { fetchSensors(); setIsImportDialogOpen(false); }}
      />
    </div>
  );
};

export default Sensors;
