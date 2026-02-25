import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '../axios';

const typeOptions = [
  { value: 'temperature', label: 'Transmetteur Température' },
  { value: 'pressure', label: 'Transmetteur Pression' },
  { value: 'vibration', label: 'Capteur Vibration' },
  { value: 'flow', label: 'Capteur Débit' },
  { value: 'level', label: 'Capteur Niveau' },
  { value: 'speed', label: 'Capteur Vitesse' },
  { value: 'position', label: 'Capteur Position' },
  { value: 'other', label: 'Autre' },
];

const EditSensor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sensor, setSensor] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);

  const [form, setForm] = useState({
    code: '',
    type: '',
    name: '',
    zone_id: '',
    equipment_id: '',
    unit: '',
    seuil_critique: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sensorRes, zonesRes, equipRes] = await Promise.all([
          api.get(`/sensors/${id}`),
          api.get('/zones'),
          api.get('/equipment'),
        ]);

        const s = sensorRes.data?.data || sensorRes.data;
        setSensor(s);

        const zonesData = zonesRes.data?.data || zonesRes.data || [];
        setZones(Array.isArray(zonesData) ? zonesData : []);

        const equipData = equipRes.data?.data || equipRes.data || [];
        setEquipment(Array.isArray(equipData) ? equipData : []);

        setForm({
          code: s.code || '',
          type: s.type || '',
          name: s.name || '',
          zone_id: String(s.equipment?.zone?.id || s.zone_id || ''),
          equipment_id: String(s.equipment_id || ''),
          unit: s.unite || s.unit || '',
          seuil_critique: String(s.seuil_critique || s.criticalThreshold || ''),
        });
      } catch {
        toast.error('Erreur lors du chargement du capteur');
        navigate('/sensors');
      }
      setIsLoading(false);
    };

    if (id) fetchData();
  }, [id]);

  const handleSubmit = async () => {
    if (!form.code || !form.type || !form.name) {
      toast.error('Veuillez remplir les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/sensors/${id}`, {
        code: form.code,
        type: form.type,
        name: form.name,
        equipment_id: form.equipment_id || undefined,
        unite: form.unit,
        seuil_critique: form.seuil_critique || undefined,
      });
      toast.success('Capteur mis à jour');
      navigate('/sensors');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
    setIsSubmitting(false);
  };

  const zoneName = sensor?.equipment?.zone?.name || 'Zone';
  const sensorCode = sensor?.code || '';
  const isBypassed = sensor?.status === 'bypassed';
  const lastModified = sensor?.updated_at
    ? new Date(sensor.updated_at).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : null;

  // Find the active bypass request for this sensor
  const activeBypass = sensor?.active_bypass || null;

  if (isLoading) {
    return (
      <div className="w-full p-4 md:p-6 space-y-6">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 space-y-6 overflow-x-hidden">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/sensors" className="hover:text-foreground transition-colors">
          Inventaire
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span>{zoneName}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Éditer {sensorCode}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Éditer le Capteur : {sensorCode}
          </h1>
          {lastModified && (
            <p className="text-sm text-muted-foreground mt-1">
              Dernière modification le {lastModified}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/sensors')}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Bypass Alert Banner */}
      {isBypassed && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Capteur actuellement en Bypass</p>
                <p className="text-sm text-muted-foreground">
                  {activeBypass
                    ? `Activé le ${new Date(activeBypass.start_date || activeBypass.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} par ${activeBypass.user?.name || 'N/A'}`
                    : 'Un bypass est actuellement actif sur ce capteur.'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/requests/mine')}>
              <Eye className="w-4 h-4 mr-2" />
              Voir le Bypass
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* Section Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10" />
            <h2 className="text-lg font-semibold text-foreground">Informations Générales</h2>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Row 1: Tag + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>
                  Identifiant du Tag <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="PT-3042"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Type d'équipement <span className="text-destructive">*</span>
                </Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Description (full width) */}
            <div className="space-y-2">
              <Label>
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Pression Huile Concasseur Primaire"
              />
            </div>

            {/* Row 3: Zone + Sous-système */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>
                  Zone d'installation <span className="text-destructive">*</span>
                </Label>
                <Select value={form.zone_id} onValueChange={(v) => {
                  setForm({ ...form, zone_id: v, equipment_id: '' });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z: any) => (
                      <SelectItem key={z.id} value={String(z.id)}>
                        {z.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sous-système</Label>
                <Select value={form.equipment_id} onValueChange={(v) => setForm({ ...form, equipment_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un équipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment
                      .filter((eq: any) => !form.zone_id || String(eq.zone?.id || eq.zone_id) === form.zone_id)
                      .map((eq: any) => (
                        <SelectItem key={eq.id} value={String(eq.id)}>
                          {eq.name} ({eq.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditSensor;
