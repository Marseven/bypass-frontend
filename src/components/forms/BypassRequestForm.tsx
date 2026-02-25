import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, AlertTriangle, FileText, Clock, Shield, Loader2 } from 'lucide-react';
import { Equipment, Sensor } from '@/types/equipment';
import { BypassReason, UrgencyLevel, RiskLevel } from '@/types/request';
import { getCurrentUser } from '@/data/mockUsers';
import api from '../../axios'
import type { EquipmentType, EquipmentStatus, CriticalityLevel, Zone } from '@/types/equipment';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { login, logout, setUsers } from '../../store/users';
import { toast } from 'sonner';

const requestSchema = z.object({
  equipmentId: z.number().min(1, 'Veuillez sélectionner un équipement'),
  sensorId: z.number().min(1, 'Veuillez sélectionner un capteur'),
  plannedStartDate: z.string().min(1, 'Date de début requise'),
  estimatedDuration: z.number().min(1, 'Durée minimale: 1 heure').max(168, 'Durée maximale: 168 heures (7 jours)'),
  reason: z.enum(['preventive_maintenance', 'corrective_maintenance', 'calibration', 'testing', 'emergency_repair', 'system_upgrade', 'investigation', 'other']),
  detailedJustification: z.string().min(20, 'Justification minimale: 20 caractères'),
  maintenanceWorkOrder: z.string().optional(),
  urgencyLevel: z.enum(['low', 'normal', 'high', 'critical', 'emergency']),
  safetyImpact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  operationalImpact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  environmentalImpact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  mitigationMeasures: z.array(z.string()).min(1, 'Au moins une mesure d\'atténuation requise'),
  contingencyPlan: z.string().optional().transform(val => val === '' ? undefined : val),
  acknowledgeSafety: z.boolean().refine(val => val === true, 'Vous devez accepter les conditions de sécurité'),
  acknowledgeResponsibility: z.boolean().refine(val => val === true, 'Vous devez accepter la responsabilité')
});

type RequestFormData = z.infer<typeof requestSchema>;

export const BypassRequestForm = () => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [availableSensors, setAvailableSensors] = useState<Sensor[]>([]);
  const [zones, setZones] = useState<Zone[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const currentUser = getCurrentUser();
  const { users, loading, error, user } = useSelector((state: RootState) => state.user);
  // const zones = getAllZones();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setValue,
    watch,
    reset
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    mode: 'onChange',
    defaultValues: {
      mitigationMeasures: [],
      urgencyLevel: 'normal',
      safetyImpact: 'low',
      operationalImpact: 'low',
      environmentalImpact: 'very_low',
      acknowledgeSafety: false,
      acknowledgeResponsibility: false,
    }
  });

  const watchedValues = watch();

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
              sensors: eqs.sensors?.map(
                (sensor) => ({
                    id: sensor.id,
                    equipmentId: sensor.equipment_id,
                    name: sensor.name,
                    code: sensor.code,
                    type: sensor.type,
                    unit: sensor.unite,
                    criticalThreshold: sensor.seuil_critique,
                    status: sensor.status,
                    lastCalibration: new Date(sensor.Dernier_Etallonnage),
                    isActive: (sensor.status === 'active' ? true : false)
                })
              ) || []
            })
          );

          setEquipment(formattedEquips)
        }
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      }); 
    } catch (error) {
      console.error("Erreur lors du GET zones :", error);
    }
  };

  const getEquipmentByZone = useCallback((zone: string): Equipment[] => {
    return equipment.filter(eq => eq.zone === zone);
  }, [equipment]);
  
  const getSensorsByEquipment = useCallback((equipmentId: string): Sensor[] => {
    const foundEquipment = equipment.find(eq => eq.id === equipmentId); // ✅ Correction: equipment au lieu d'equipmen
    return foundEquipment?.sensors || [];
  }, [equipment]);
  
  useEffect(() => {
    fetchZones();
    fetchEquipment();
  }, []);
  
  useEffect(() => {
    if (selectedZone) {
      const filteredEquipment = getEquipmentByZone(selectedZone);
      setAvailableEquipment(filteredEquipment);
      setSelectedEquipment(null);
      setSelectedSensor(null);
      setValue('equipmentId', '');
      setValue('sensorId', '');
    }
  }, [selectedZone]);
  
  useEffect(() => {
    
    if (watchedValues.equipmentId) {

      const foundEquipment = equipment.find(
        eq => eq.id === watchedValues.equipmentId
      );

      setSelectedEquipment(foundEquipment);

      if (foundEquipment) {
        const sensors = getSensorsByEquipment(foundEquipment.id);
        setAvailableSensors(sensors);
        setSelectedSensor(null);
        setValue('sensorId', '');
      }
    }
  }, [watchedValues.equipmentId]);

  // useEffect(() => {
  //   if (selectedEquipment) {
  //     console.log("✅ selectedEquipment mis à jour :", selectedEquipment);
  //   }
  // }, [selectedEquipment]);

  useEffect(() => {
    if (watchedValues.sensorId) {
      const sensor = availableSensors.find(s => s.id === watchedValues.sensorId);
      setSelectedSensor(sensor);
    }

    console.log(selectedSensor)
  }, [watchedValues.sensorId, availableSensors]);

  const onSubmit = async (data: RequestFormData) => {
    try {
      // Transformer les chaînes vides en null pour les champs optionnels
      const submitData = {
        ...data,
        contingencyPlan: data.contingencyPlan && data.contingencyPlan.trim() !== '' ? data.contingencyPlan : null,
        maintenanceWorkOrder: data.maintenanceWorkOrder && data.maintenanceWorkOrder.trim() !== '' ? data.maintenanceWorkOrder : null,
      };
      
      await api({
        method: 'post',
        url: `/requests`,
        data: submitData
      });
      toast.success("Demande de Bypass Soumis avec Succes");
      reset();
      setSelectedZone('');
      setSelectedEquipment(null);
      setSelectedSensor(null);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      toast.error("Erreur lors de la soumission de la demande");
    }
  };

  const reasonLabels: Record<BypassReason, string> = {
    preventive_maintenance: 'Maintenance préventive',
    corrective_maintenance: 'Maintenance corrective',
    calibration: 'Étalonnage',
    testing: 'Tests',
    emergency_repair: 'Réparation d\'urgence',
    system_upgrade: 'Mise à niveau système',
    investigation: 'Investigation',
    other: 'Autre'
  };

  function getMaintenanceLabel(key: string): string {
    return reasonLabels[key] ?? key; // si pas trouvé, on retourne la clé brute
  }

  const urgencyLabels: Record<UrgencyLevel, string> = {
    low: 'Faible',
    normal: 'Normale',
    high: 'Élevée',
    critical: 'Critique',
    emergency: 'Urgence'
  };

  const riskLabels: Record<RiskLevel, string> = {
    very_low: 'Très faible',
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    very_high: 'Très élevé'
  };

  const mitigationOptions = [
    'Surveillance manuelle renforcée',
    'Rondes de sécurité supplémentaires',
    'Activation des systèmes de sauvegarde',
    'Notification des équipes d\'intervention',
    'Mise en place de capteurs temporaires',
    'Réduction de la cadence de production',
    'Personnel de sécurité dédié',
    'Communication radio continue'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <FileText className="h-6 w-6 mr-2" />
          Nouvelle Demande de Bypass
        </CardTitle>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <span>Initiateur: {user.full_name}</span>
          <Separator orientation="vertical" className="hidden sm:block h-4" />
          <span>Username: {user.username}</span>
          <Separator orientation="vertical" className="hidden sm:block h-4" />
          <span>Role: {user.role}</span>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sélection Équipement et Capteur */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Équipement et Capteur
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone">Zone d'opération</Label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map(zone => (
                      <SelectItem key={zone.id} value={zone.name}>{zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipmentId">Équipement</Label>
                <Select
                  value={watchedValues.equipmentId || ''}
                  onValueChange={(value) => setValue('equipmentId', Number(value))}
                  disabled={!selectedZone}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un équipement" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map(equipment => (
                      <SelectItem key={equipment.id} value={equipment.id} disabled={equipment.status !== 'operational'}>
                        <div className="flex items-center space-x-2">
                          <span>{equipment.name}</span>
                          <Badge variant="outline">{equipment.code}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipmentId && (
                  <p className="text-sm text-red-500">{errors.equipmentId.message}</p>
                )}
              </div>
            </div>

            {selectedEquipment && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Informations Équipement</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{selectedEquipment.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Criticité:</span>
                    <Badge variant={selectedEquipment.criticite === 'critical' ? 'destructive' : 'secondary'}>
                      {selectedEquipment.criticite}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut:</span>
                    <p className="font-medium">{selectedEquipment.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fabricant:</span>
                    <p className="font-medium">{selectedEquipment.fabricant}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sensorId">Capteur</Label>
              <Select
                value={watchedValues.sensorId || ''}
                onValueChange={(value) => setValue('sensorId', Number(value))}
                disabled={!selectedEquipment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un capteur" />
                </SelectTrigger>
                <SelectContent>
                  {availableSensors.map(sensor => (
                    <SelectItem key={sensor.id} value={sensor.id} disabled={sensor.status !== 'active'}>
                      <div className="flex items-center space-x-2">
                        <span>{sensor.name}</span>
                        <Badge variant="outline">{sensor.code}</Badge>
                        <Badge variant={sensor.status === 'active' ? 'default' : 'secondary'}>
                          {sensor.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sensorId && (
                <p className="text-sm text-red-500">{errors.sensorId.message}</p>
              )}
            </div>

            {selectedSensor && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Informations Capteur</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{selectedSensor.type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Unité:</span>
                    <p className="font-medium">{selectedSensor.unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Seuil critique:</span>
                    <p className="font-medium">{selectedSensor.criticalThreshold} {selectedSensor.unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dernier étalonnage:</span>
                    <p className="font-medium">
                      {selectedSensor.lastCalibration?.toLocaleDateString() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Planification */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Planification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plannedStartDate">Date et heure de début prévue</Label>
                <Input
                  id="plannedStartDate"
                  type="datetime-local"
                  {...register('plannedStartDate')}
                />
                {errors.plannedStartDate && (
                  <p className="text-sm text-red-500">{errors.plannedStartDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedDuration">Durée estimée (heures)</Label>
                <Input
                  id="estimatedDuration"
                  type="number"
                  min="1"
                  max="168"
                  {...register('estimatedDuration', { valueAsNumber: true })}
                />
                {errors.estimatedDuration && (
                  <p className="text-sm text-red-500">{errors.estimatedDuration.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Justification Métier</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Motif du bypass</Label>
                <Select
                  value={watchedValues.reason || ''}
                  onValueChange={(value) => setValue('reason', value as BypassReason)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reasonLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.reason && (
                  <p className="text-sm text-red-500">{errors.reason.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgencyLevel">Niveau d'urgence</Label>
                <Select
                  value={watchedValues.urgencyLevel || ''}
                  onValueChange={(value) => setValue('urgencyLevel', value as UrgencyLevel)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(urgencyLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.urgencyLevel && (
                  <p className="text-sm text-red-500">{errors.urgencyLevel.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detailedJustification">Justification détaillée</Label>
              <Textarea
                id="detailedJustification"
                placeholder="Décrivez en détail la raison du bypass, les travaux à effectuer, et l'impact attendu..."
                rows={4}
                {...register('detailedJustification')}
              />
              {errors.detailedJustification && (
                <p className="text-sm text-red-500">{errors.detailedJustification.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceWorkOrder">Bon de travail (optionnel)</Label>
              <Input
                id="maintenanceWorkOrder"
                placeholder="BT-2024-XXXX"
                {...register('maintenanceWorkOrder')}
              />
            </div>
          </div>

          {/* Évaluation des Risques */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Évaluation des Risques
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="safetyImpact">Impact sécurité</Label>
                <Select
                  value={watchedValues.safetyImpact || ''}
                  onValueChange={(value) => setValue('safetyImpact', value as RiskLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(riskLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operationalImpact">Impact opérationnel</Label>
                <Select
                  value={watchedValues.operationalImpact || ''}
                  onValueChange={(value) => setValue('operationalImpact', value as RiskLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(riskLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="environmentalImpact">Impact environnemental</Label>
                <Select
                  value={watchedValues.environmentalImpact || ''}
                  onValueChange={(value) => setValue('environmentalImpact', value as RiskLevel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(riskLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Mesures d'atténuation (sélectionner au moins une)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mitigationOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={watchedValues.mitigationMeasures?.includes(option)}
                      onCheckedChange={(checked) => {
                        const current = watchedValues.mitigationMeasures || [];
                        if (checked) {
                          setValue('mitigationMeasures', [...current, option]);
                        } else {
                          setValue('mitigationMeasures', current.filter(m => m !== option));
                        }
                      }}
                    />
                    <Label htmlFor={option} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
              {errors.mitigationMeasures && (
                <p className="text-sm text-red-500">{errors.mitigationMeasures.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contingencyPlan">Plan de contingence (optionnel)</Label>
              <Textarea
                id="contingencyPlan"
                placeholder="Décrivez les actions à prendre en cas de problème durant le bypass..."
                rows={3}
                {...register('contingencyPlan')}
              />
            </div>
          </div>

          {/* Acceptations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Acceptations Requises</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acknowledgeSafety"
                  {...register('acknowledgeSafety')}
                  checked={watchedValues.acknowledgeSafety}
                  onCheckedChange={(checked) => setValue("acknowledgeSafety", !!checked)}
                />
                <Label htmlFor="acknowledgeSafety" className="text-sm leading-5">
                  Je reconnais avoir évalué les risques de sécurité et m'engage à respecter toutes les procédures de sécurité durant le bypass.
                </Label>
              </div>
              {errors.acknowledgeSafety && (
                <p className="text-sm text-red-500">{errors.acknowledgeSafety.message}</p>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acknowledgeResponsibility"
                  {...register('acknowledgeResponsibility')}
                  checked={watchedValues.acknowledgeResponsibility}
                  onCheckedChange={(checked) => setValue("acknowledgeResponsibility", !!checked)}
                />
                <Label htmlFor="acknowledgeResponsibility" className="text-sm leading-5">
                  Je prends la responsabilité de cette demande et m'engage à surveiller l'équipement durant toute la durée du bypass.
                </Label>
              </div>
              {errors.acknowledgeResponsibility && (
                <p className="text-sm text-red-500">{errors.acknowledgeResponsibility.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setSelectedZone('');
                setSelectedEquipment(null);
                setSelectedSensor(null);
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Soumission...
                </>
              ) : (
                'Soumettre la demande'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};