import { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface OraStepProps {
  form: UseFormReturn<any>;
}

export function OraStep({ form }: OraStepProps) {
  const [newMesure, setNewMesure] = useState("");

  const mesures = form.watch("oraMesuresCompensatoires") || [];

  const addMesure = () => {
    if (newMesure.trim()) {
      form.setValue("oraMesuresCompensatoires", [...mesures, newMesure.trim()]);
      setNewMesure("");
    }
  };

  const removeMesure = (index: number) => {
    form.setValue("oraMesuresCompensatoires", mesures.filter((_: string, i: number) => i !== index));
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

      <FormField
        control={form.control}
        name="oraDangersIdentifies"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dangers identifiés</FormLabel>
            <FormControl>
              <Textarea
                rows={4}
                placeholder="Décrivez les dangers identifiés suite à la mise en bypass de ce système de sécurité..."
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div>
        <FormLabel>Mesures compensatoires</FormLabel>
        <div className="flex gap-2 mt-2">
          <Input
            value={newMesure}
            onChange={(e) => setNewMesure(e.target.value)}
            placeholder="Ajouter une mesure compensatoire"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMesure();
              }
            }}
          />
          <Button type="button" size="icon" onClick={addMesure}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {mesures.length > 0 && (
          <ul className="mt-3 space-y-2">
            {mesures.map((mesure: string, index: number) => (
              <li key={index} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                <span className="flex-1">{mesure}</span>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeMesure(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        {mesures.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">Au moins une mesure compensatoire est requise.</p>
        )}
      </div>

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
