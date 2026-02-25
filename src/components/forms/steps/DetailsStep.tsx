import { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { BYPASS_TYPE_LABELS, CRITICALITY_LABELS, DUREE_TYPE_LABELS } from "@/utils/roles";

interface DetailsStepProps {
  form: UseFormReturn<any>;
  autoCalculatedCriticite?: string;
  autoCalculatedDureeType?: string;
}

const REASONS = [
  { value: 'preventive_maintenance', label: 'Maintenance préventive' },
  { value: 'corrective_maintenance', label: 'Maintenance corrective' },
  { value: 'calibration', label: 'Étalonnage capteur' },
  { value: 'testing', label: 'Test de fonctionnement' },
  { value: 'emergency_repair', label: 'Réparation urgente' },
  { value: 'system_upgrade', label: 'Mise à niveau système' },
  { value: 'investigation', label: 'Investigation' },
  { value: 'other', label: 'Autre' },
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Faible' },
  { value: 'normal', label: 'Normale' },
  { value: 'high', label: 'Élevée' },
  { value: 'critical', label: 'Critique' },
  { value: 'emergency', label: 'Urgence' },
];

const IMPACT_LEVELS = [
  { value: 'very_low', label: 'Très faible' },
  { value: 'low', label: 'Faible' },
  { value: 'medium', label: 'Moyen' },
  { value: 'high', label: 'Élevé' },
  { value: 'very_high', label: 'Très élevé' },
];

const MITIGATION_OPTIONS = [
  { id: 'visual_inspection', label: 'Inspection visuelle renforcée' },
  { id: 'portable_detector', label: 'Détecteur portable en place' },
  { id: 'manual_monitoring', label: 'Surveillance manuelle continue' },
  { id: 'warning_signs', label: 'Signalisation de sécurité' },
  { id: 'restricted_access', label: 'Accès restreint à la zone' },
  { id: 'backup_system', label: 'Système de secours activé' },
  { id: 'fire_watch', label: 'Ronde incendie' },
  { id: 'emergency_plan', label: 'Plan d\'urgence communiqué' },
];

export function DetailsStep({ form, autoCalculatedCriticite, autoCalculatedDureeType }: DetailsStepProps) {
  return (
    <div className="space-y-6">
      {/* Bypass Type */}
      <FormField
        control={form.control}
        name="bypassType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type de bypass</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {Object.entries(BYPASS_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-calculated badges */}
      <div className="flex gap-4 flex-wrap">
        {autoCalculatedCriticite && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Criticité:</span>
            <Badge variant={autoCalculatedCriticite === 'securite' ? 'destructive' : 'secondary'}>
              {CRITICALITY_LABELS[autoCalculatedCriticite] || autoCalculatedCriticite}
            </Badge>
          </div>
        )}
        {autoCalculatedDureeType && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Durée:</span>
            <Badge variant="outline">
              {DUREE_TYPE_LABELS[autoCalculatedDureeType] || autoCalculatedDureeType}
            </Badge>
          </div>
        )}
      </div>

      {/* Reason and Urgency */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Raison du bypass</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la raison" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="urgencyLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Niveau d'urgence</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'urgence" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {URGENCY_LEVELS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Dates and Duration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="plannedStartDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date de début prévue</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="estimatedDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée estimée (heures)</FormLabel>
              <FormControl>
                <Input type="number" min={1} max={168} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Justification */}
      <FormField
        control={form.control}
        name="detailedJustification"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Justification détaillée</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Décrivez en détail la raison du bypass..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Impacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['safetyImpact', 'operationalImpact', 'environmentalImpact'].map((name) => (
          <FormField
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {name === 'safetyImpact' ? 'Impact sécurité' :
                   name === 'operationalImpact' ? 'Impact opérationnel' :
                   'Impact environnemental'}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IMPACT_LEVELS.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      {/* Mitigation Measures */}
      <FormField
        control={form.control}
        name="mitigationMeasures"
        render={() => (
          <FormItem>
            <FormLabel>Mesures d'atténuation</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {MITIGATION_OPTIONS.map((option) => (
                <FormField
                  key={option.id}
                  control={form.control}
                  name="mitigationMeasures"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={(field.value || []).includes(option.id)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, option.id]);
                            } else {
                              field.onChange(current.filter((v: string) => v !== option.id));
                            }
                          }}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal cursor-pointer">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Contingency Plan */}
      <FormField
        control={form.control}
        name="contingencyPlan"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plan de contingence (optionnel)</FormLabel>
            <FormControl>
              <Textarea rows={2} placeholder="Décrivez le plan de contingence..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
