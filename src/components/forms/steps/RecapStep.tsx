import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { BYPASS_TYPE_LABELS, CRITICALITY_LABELS, DUREE_TYPE_LABELS } from "@/utils/roles";

interface RecapStepProps {
  form: UseFormReturn<any>;
  equipmentName?: string;
  sensorName?: string;
  siteName?: string;
  zoneName?: string;
  showOra?: boolean;
}

const REASON_LABELS: Record<string, string> = {
  preventive_maintenance: 'Maintenance préventive',
  corrective_maintenance: 'Maintenance corrective',
  calibration: 'Étalonnage capteur',
  testing: 'Test de fonctionnement',
  emergency_repair: 'Réparation urgente',
  system_upgrade: 'Mise à niveau système',
  investigation: 'Investigation',
  other: 'Autre',
};

const IMPACT_LABELS: Record<string, string> = {
  very_low: 'Très faible',
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  very_high: 'Très élevé',
};

export function RecapStep({ form, equipmentName, sensorName, siteName, zoneName, showOra }: RecapStepProps) {
  const values = form.getValues();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Équipement & Localisation</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          {siteName && <div><span className="text-muted-foreground">Site:</span> {siteName}</div>}
          {zoneName && <div><span className="text-muted-foreground">Zone:</span> {zoneName}</div>}
          <div><span className="text-muted-foreground">Équipement:</span> {equipmentName || values.equipmentId}</div>
          <div><span className="text-muted-foreground">Capteur:</span> {sensorName || values.sensorId}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Détails du bypass</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div className="flex gap-2 flex-wrap">
            {values.bypassType && (
              <Badge variant="outline">{BYPASS_TYPE_LABELS[values.bypassType] || values.bypassType}</Badge>
            )}
            {values.criticite && (
              <Badge variant={values.criticite === 'securite' ? 'destructive' : 'secondary'}>
                {CRITICALITY_LABELS[values.criticite] || values.criticite}
              </Badge>
            )}
            {values.dureeType && (
              <Badge variant="outline">{DUREE_TYPE_LABELS[values.dureeType] || values.dureeType}</Badge>
            )}
          </div>
          <div><span className="text-muted-foreground">Raison:</span> {REASON_LABELS[values.reason] || values.reason}</div>
          <div><span className="text-muted-foreground">Urgence:</span> {values.urgencyLevel}</div>
          <div><span className="text-muted-foreground">Début:</span> {values.plannedStartDate}</div>
          <div><span className="text-muted-foreground">Durée:</span> {values.estimatedDuration}h</div>
          <div><span className="text-muted-foreground">Justification:</span> {values.detailedJustification}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Impacts & Mesures</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div><span className="text-muted-foreground">Sécurité:</span> {IMPACT_LABELS[values.safetyImpact] || values.safetyImpact}</div>
          <div><span className="text-muted-foreground">Opérationnel:</span> {IMPACT_LABELS[values.operationalImpact] || values.operationalImpact}</div>
          <div><span className="text-muted-foreground">Environnemental:</span> {IMPACT_LABELS[values.environmentalImpact] || values.environmentalImpact}</div>
          {values.mitigationMeasures?.length > 0 && (
            <div>
              <span className="text-muted-foreground">Mesures d'atténuation:</span>
              <ul className="list-disc list-inside mt-1">
                {values.mitigationMeasures.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {values.contingencyPlan && (
            <div><span className="text-muted-foreground">Plan de contingence:</span> {values.contingencyPlan}</div>
          )}
        </CardContent>
      </Card>

      {showOra && values.oraDangersIdentifies && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              ORA <Badge variant="destructive">Sécurité</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="text-muted-foreground">Dangers:</span> {values.oraDangersIdentifies}</div>
            {values.oraMesuresCompensatoires?.length > 0 && (
              <div>
                <span className="text-muted-foreground">Mesures compensatoires:</span>
                <ul className="list-disc list-inside mt-1">
                  {values.oraMesuresCompensatoires.map((m: string, i: number) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {values.oraIplAffectees && (
              <div><span className="text-muted-foreground">IPL affectées:</span> {values.oraIplAffectees}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Safety acknowledgments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Engagements de sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField
            control={form.control}
            name="safetyAck1"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Je confirme que les mesures de sécurité compensatoires sont en place
                </FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="safetyAck2"
            render={({ field }) => (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Je m'engage à restaurer le bypass dès la fin des travaux
                </FormLabel>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
