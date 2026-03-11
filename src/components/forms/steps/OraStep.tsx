import { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface OraStepProps {
  form: UseFormReturn<any>;
}

const DANGER_OPTIONS = [
  { id: 'perte_detection_gaz', label: 'Perte de détection gaz' },
  { id: 'perte_protection_incendie', label: 'Perte de protection incendie' },
  { id: 'perte_arret_urgence', label: 'Perte d\'arrêt d\'urgence' },
  { id: 'perte_controle_pression', label: 'Perte de contrôle de pression' },
  { id: 'perte_controle_temperature', label: 'Perte de contrôle de température' },
  { id: 'perte_controle_niveau', label: 'Perte de contrôle de niveau' },
  { id: 'risque_fuite_produit', label: 'Risque de fuite de produit dangereux' },
  { id: 'risque_explosion', label: 'Risque d\'explosion' },
  { id: 'risque_electrique', label: 'Risque électrique' },
  { id: 'risque_environnemental', label: 'Risque environnemental' },
];

const MESURE_OPTIONS = [
  { id: 'ronde_supplementaire', label: 'Ronde de surveillance supplémentaire' },
  { id: 'detecteur_portable', label: 'Détecteur portable en service' },
  { id: 'surveillance_continue', label: 'Surveillance opérateur continue' },
  { id: 'alarme_temporaire', label: 'Alarme temporaire mise en place' },
  { id: 'procedure_urgence', label: 'Procédure d\'urgence communiquée' },
  { id: 'restriction_acces', label: 'Restriction d\'accès à la zone' },
  { id: 'extincteur_supplementaire', label: 'Extincteur supplémentaire positionné' },
  { id: 'communication_equipe', label: 'Communication renforcée avec l\'équipe' },
  { id: 'backup_manuel', label: 'Contrôle manuel de secours activé' },
  { id: 'reduction_charge', label: 'Réduction de charge / débit' },
];

export function OraStep({ form }: OraStepProps) {
  const selectedDangers: string[] = form.watch("oraDangersIdentifies") || [];
  const selectedMesures: string[] = form.watch("oraMesuresCompensatoires") || [];

  const toggleDanger = (dangerId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedDangers, dangerId]
      : selectedDangers.filter((d: string) => d !== dangerId);
    form.setValue("oraDangersIdentifies", updated, { shouldValidate: true });
  };

  const toggleMesure = (mesureId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedMesures, mesureId]
      : selectedMesures.filter((m: string) => m !== mesureId);
    form.setValue("oraMesuresCompensatoires", updated, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="destructive">ORA Requise</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Cet équipement est classé comme système de sécurité (SIL).
          Une Operational Risk Assessment (ORA) est obligatoire avant approbation.
        </p>
      </div>

      {/* Dangers - Multi-select checkboxes */}
      <FormField
        control={form.control}
        name="oraDangersIdentifies"
        render={() => (
          <FormItem>
            <FormLabel>Dangers identifiés</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {DANGER_OPTIONS.map(danger => (
                <label
                  key={danger.id}
                  className="flex items-center gap-2 p-2.5 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:bg-destructive/5 has-[:checked]:border-destructive/30"
                >
                  <Checkbox
                    checked={selectedDangers.includes(danger.id)}
                    onCheckedChange={(checked) => toggleDanger(danger.id, !!checked)}
                  />
                  <span className="text-sm">{danger.label}</span>
                </label>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Autre danger (free text) */}
      <FormField
        control={form.control}
        name="oraDangersAutre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Autre danger (optionnel)</FormLabel>
            <FormControl>
              <Input
                placeholder="Décrivez un danger non listé ci-dessus..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Mesures compensatoires - Multi-select checkboxes */}
      <FormField
        control={form.control}
        name="oraMesuresCompensatoires"
        render={() => (
          <FormItem>
            <FormLabel>Mesures compensatoires</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {MESURE_OPTIONS.map(mesure => (
                <label
                  key={mesure.id}
                  className="flex items-center gap-2 p-2.5 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:border-primary/30"
                >
                  <Checkbox
                    checked={selectedMesures.includes(mesure.id)}
                    onCheckedChange={(checked) => toggleMesure(mesure.id, !!checked)}
                  />
                  <span className="text-sm">{mesure.label}</span>
                </label>
              ))}
            </div>
            {selectedMesures.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Au moins une mesure compensatoire est requise.</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Autre mesure (free text) */}
      <FormField
        control={form.control}
        name="oraMesuresAutre"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Autre mesure compensatoire (optionnel)</FormLabel>
            <FormControl>
              <Input
                placeholder="Décrivez une mesure non listée ci-dessus..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="oraIplAffectees"
        render={({ field }) => (
          <FormItem>
            <FormLabel>IPL affectées (optionnel)</FormLabel>
            <FormControl>
              <Textarea
                rows={2}
                placeholder="Listez les Independent Protection Layers affectées..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
