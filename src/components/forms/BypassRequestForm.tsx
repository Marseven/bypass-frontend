import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Loader2, Save, Send } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { FormStepper } from './FormStepper';
import { EquipmentStep } from './steps/EquipmentStep';
import { DetailsStep } from './steps/DetailsStep';
import { OraStep } from './steps/OraStep';
import { RecapStep } from './steps/RecapStep';
import api from '../../axios';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const requestSchema = z.object({
  // Step 1: Equipment
  siteId: z.string().min(1, 'Veuillez sélectionner un site'),
  zoneId: z.string().min(1, 'Veuillez sélectionner une zone'),
  equipmentId: z.string().min(1, 'Veuillez sélectionner un équipement'),
  sensorId: z.string().min(1, 'Veuillez sélectionner un capteur'),

  // Step 2: Details
  bypassType: z.enum(['maintenance', 'operationnel', 'permissif']),
  reason: z.enum(['preventive_maintenance', 'corrective_maintenance', 'calibration', 'testing', 'emergency_repair', 'system_upgrade', 'investigation', 'other']),
  urgencyLevel: z.enum(['low', 'normal', 'high', 'critical', 'emergency']),
  plannedStartDate: z.string().min(1, 'Date de début requise'),
  estimatedDuration: z.string().min(1, 'Durée requise'),
  detailedJustification: z.string().min(20, 'Justification minimale: 20 caractères'),
  safetyImpact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  operationalImpact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  environmentalImpact: z.enum(['very_low', 'low', 'medium', 'high', 'very_high']),
  mitigationMeasures: z.array(z.string()).min(1, 'Au moins une mesure d\'atténuation requise'),
  contingencyPlan: z.string().optional(),

  // Step 3: ORA (conditional)
  oraDangersIdentifies: z.string().optional(),
  oraMesuresCompensatoires: z.array(z.string()).optional(),
  oraIplAffectees: z.string().optional(),

  // Step 4: Recap
  safetyAck1: z.boolean().refine(val => val === true, 'Requis'),
  safetyAck2: z.boolean().refine(val => val === true, 'Requis'),

  // Auto-calculated (not displayed in form)
  criticite: z.string().optional(),
  dureeType: z.string().optional(),
});

type RequestFormData = z.infer<typeof requestSchema>;

export const BypassRequestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipmentInfo, setEquipmentInfo] = useState<any>(null);

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      siteId: '',
      zoneId: '',
      equipmentId: '',
      sensorId: '',
      bypassType: undefined,
      reason: undefined,
      urgencyLevel: undefined,
      plannedStartDate: '',
      estimatedDuration: '',
      detailedJustification: '',
      safetyImpact: undefined,
      operationalImpact: undefined,
      environmentalImpact: undefined,
      mitigationMeasures: [],
      contingencyPlan: '',
      oraDangersIdentifies: '',
      oraMesuresCompensatoires: [],
      oraIplAffectees: '',
      safetyAck1: false,
      safetyAck2: false,
      criticite: '',
      dureeType: '',
    },
  });

  const watchEquipmentId = form.watch('equipmentId');
  const watchDuration = form.watch('estimatedDuration');

  // Auto-calculate criticite from equipment SIL
  useEffect(() => {
    if (watchEquipmentId) {
      api.get(`/equipment/${watchEquipmentId}`).then(res => {
        const eq = res.data.data || res.data;
        setEquipmentInfo(eq);
        const criticite = eq.is_security_equipment ? 'securite' : 'process';
        form.setValue('criticite', criticite);
      }).catch(console.error);
    }
  }, [watchEquipmentId]);

  // Auto-calculate dureeType from duration
  useEffect(() => {
    const hours = parseInt(String(watchDuration));
    if (!isNaN(hours) && hours > 0) {
      form.setValue('dureeType', hours < 48 ? 'court_terme' : 'long_terme');
    }
  }, [watchDuration]);

  const criticite = form.watch('criticite');
  const dureeType = form.watch('dureeType');
  const requiresOra = criticite === 'securite';

  // Dynamic steps based on whether ORA is needed
  const steps = useMemo(() => {
    const baseSteps = [
      { id: 1, title: 'Équipement' },
      { id: 2, title: 'Détails' },
    ];
    if (requiresOra) {
      baseSteps.push({ id: 3, title: 'ORA' });
      baseSteps.push({ id: 4, title: 'Récapitulatif' });
    } else {
      baseSteps.push({ id: 3, title: 'Récapitulatif' });
    }
    return baseSteps;
  }, [requiresOra]);

  const totalSteps = steps.length;
  const recapStep = requiresOra ? 4 : 3;

  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof RequestFormData)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['siteId', 'zoneId', 'equipmentId', 'sensorId'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['bypassType', 'reason', 'urgencyLevel', 'plannedStartDate', 'estimatedDuration', 'detailedJustification', 'safetyImpact', 'operationalImpact', 'environmentalImpact', 'mitigationMeasures'];
    } else if (currentStep === 3 && requiresOra) {
      // ORA step - custom validation
      const dangers = form.getValues('oraDangersIdentifies');
      const mesures = form.getValues('oraMesuresCompensatoires');
      if (!dangers || dangers.trim().length === 0) {
        form.setError('oraDangersIdentifies', { message: 'Les dangers doivent être identifiés' });
        return false;
      }
      if (!mesures || mesures.length === 0) {
        toast.error('Au moins une mesure compensatoire est requise');
        return false;
      }
      return true;
    }

    if (fieldsToValidate.length > 0) {
      const result = await form.trigger(fieldsToValidate);
      return result;
    }

    return true;
  };

  const handleNext = async () => {
    const valid = await validateCurrentStep();
    if (valid) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitForm = async (isDraft: boolean) => {
    if (!isDraft) {
      const valid = await form.trigger(['safetyAck1', 'safetyAck2']);
      if (!valid) return;
    }

    setIsSubmitting(true);

    try {
      const values = form.getValues();

      const payload: any = {
        reason: values.reason,
        detailedJustification: values.detailedJustification,
        urgencyLevel: values.urgencyLevel,
        equipmentId: parseInt(values.equipmentId),
        sensorId: parseInt(values.sensorId),
        plannedStartDate: values.plannedStartDate,
        estimatedDuration: parseInt(values.estimatedDuration),
        safetyImpact: values.safetyImpact,
        operationalImpact: values.operationalImpact,
        environmentalImpact: values.environmentalImpact,
        mitigationMeasures: values.mitigationMeasures,
        contingencyPlan: values.contingencyPlan || undefined,
        bypassType: values.bypassType,
        isDraft,
      };

      const response = await api.post('/requests', payload);

      // If ORA is needed, create it after the request
      if (requiresOra && values.oraDangersIdentifies && !isDraft) {
        const requestId = response.data.data?.id || response.data.id;
        await api.post(`/requests/${requestId}/ora`, {
          dangers_identifies: values.oraDangersIdentifies,
          mesures_compensatoires: values.oraMesuresCompensatoires,
          ipl_affectees: values.oraIplAffectees || undefined,
        });
      }

      toast.success(isDraft ? 'Brouillon sauvegardé' : 'Demande de bypass soumise avec succès');
      navigate('/requests');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la soumission';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouvelle demande de bypass</CardTitle>
      </CardHeader>
      <CardContent>
        <FormStepper
          steps={steps}
          currentStep={currentStep}
          onStepClick={(step) => {
            if (step < currentStep) setCurrentStep(step);
          }}
        />

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Step 1: Equipment */}
            {currentStep === 1 && (
              <EquipmentStep form={form} />
            )}

            {/* Step 2: Details */}
            {currentStep === 2 && (
              <DetailsStep
                form={form}
                autoCalculatedCriticite={criticite}
                autoCalculatedDureeType={dureeType}
              />
            )}

            {/* Step 3: ORA (conditional) or Recap */}
            {currentStep === 3 && requiresOra && (
              <OraStep form={form} />
            )}

            {/* Recap step */}
            {currentStep === recapStep && (
              <RecapStep
                form={form}
                equipmentName={equipmentInfo?.name}
                sensorName={undefined}
                showOra={requiresOra}
              />
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Précédent
              </Button>

              <div className="flex gap-2">
                {currentStep === recapStep && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => submitForm(true)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Sauvegarder brouillon
                    </Button>
                    <Button
                      type="button"
                      onClick={() => submitForm(false)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      Soumettre
                    </Button>
                  </>
                )}

                {currentStep < totalSteps && (
                  <Button type="button" onClick={handleNext}>
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
