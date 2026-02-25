import { useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SIL_LABELS, SYSTEM_TYPE_LABELS } from "@/utils/roles";
import api from "@/axios";
import type { Site } from "@/types/site";

interface EquipmentStepProps {
  form: UseFormReturn<any>;
}

export function EquipmentStep({ form }: EquipmentStepProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);

  const watchSiteId = form.watch("siteId");
  const watchZoneId = form.watch("zoneId");
  const watchEquipmentId = form.watch("equipmentId");
  const watchSensorId = form.watch("sensorId");

  useEffect(() => {
    api.get('/sites').then(res => {
      setSites(res.data.data || []);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (watchSiteId) {
      api.get(`/zones?site_id=${watchSiteId}`).then(res => {
        setZones(res.data.data || []);
      }).catch(console.error);
      form.setValue("zoneId", "");
      form.setValue("equipmentId", "");
      form.setValue("sensorId", "");
      setEquipment([]);
      setSensors([]);
    }
  }, [watchSiteId]);

  useEffect(() => {
    if (watchZoneId) {
      api.get(`/zones/${watchZoneId}/equipements`).then(res => {
        setEquipment(res.data || []);
      }).catch(console.error);
      form.setValue("equipmentId", "");
      form.setValue("sensorId", "");
      setSensors([]);
    }
  }, [watchZoneId]);

  useEffect(() => {
    if (watchEquipmentId) {
      const eq = equipment.find((e: any) => String(e.id) === String(watchEquipmentId));
      setSelectedEquipment(eq);
      if (eq) {
        api.get(`/equipment/${eq.id}/sensors`).then(res => {
          setSensors(res.data.data || []);
        }).catch(console.error);
      }
      form.setValue("sensorId", "");
    }
  }, [watchEquipmentId, equipment]);

  useEffect(() => {
    if (watchSensorId) {
      const s = sensors.find((s: any) => String(s.id) === String(watchSensorId));
      setSelectedSensor(s);
    }
  }, [watchSensorId, sensors]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="siteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un site" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={String(site.id)}>
                      {site.code} - {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="zoneId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!watchSiteId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une zone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {zones.map((zone: any) => (
                    <SelectItem key={zone.id} value={String(zone.id)}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipmentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipement</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!watchZoneId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un équipement" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {equipment.map((eq: any) => (
                    <SelectItem key={eq.id} value={String(eq.id)}>
                      {eq.name} ({eq.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sensorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capteur</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!watchEquipmentId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un capteur" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sensors.map((sensor: any) => (
                    <SelectItem key={sensor.id} value={String(sensor.id)}>
                      {sensor.name} ({sensor.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {selectedEquipment && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Informations de l'équipement</h4>
              {selectedEquipment.niveau_sil && selectedEquipment.niveau_sil !== 'na' && (
                <Badge variant="destructive">
                  {SIL_LABELS[selectedEquipment.niveau_sil] || selectedEquipment.niveau_sil}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                {selectedEquipment.type}
              </div>
              <div>
                <span className="text-muted-foreground">Criticité:</span>{" "}
                {selectedEquipment.criticite}
              </div>
              <div>
                <span className="text-muted-foreground">Système:</span>{" "}
                {SYSTEM_TYPE_LABELS[selectedEquipment.type_systeme] || selectedEquipment.type_systeme || 'Process'}
              </div>
              <div>
                <span className="text-muted-foreground">Fabricant:</span>{" "}
                {selectedEquipment.fabricant}
              </div>
            </div>
            {selectedEquipment.fonction_securite && (
              <div className="mt-2 text-sm">
                <span className="text-muted-foreground">Fonction sécurité:</span>{" "}
                {selectedEquipment.fonction_securite}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedSensor && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="font-medium mb-2">Informations du capteur</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>{" "}
                {selectedSensor.type}
              </div>
              <div>
                <span className="text-muted-foreground">Unité:</span>{" "}
                {selectedSensor.unit}
              </div>
              <div>
                <span className="text-muted-foreground">Statut:</span>{" "}
                {selectedSensor.status}
              </div>
              {selectedSensor.critical_threshold && (
                <div>
                  <span className="text-muted-foreground">Seuil critique:</span>{" "}
                  {selectedSensor.critical_threshold}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
