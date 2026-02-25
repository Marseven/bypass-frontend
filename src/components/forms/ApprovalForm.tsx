import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  ArrowUp, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  Shield,
  User
} from 'lucide-react';
import { BypassRequest, ApprovalDecision } from '@/types/request';
import { getCurrentUser } from '@/data/mockUsers';

const approvalSchema = z.object({
  decision: z.enum(['approved', 'rejected', 'approved_with_conditions', 'escalated']),
  comments: z.string().min(10, 'Commentaires requis (minimum 10 caractères)'),
  conditions: z.string().optional()
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface ApprovalFormProps {
  request: Partial<BypassRequest>;
  level: 1 | 2 | 3;
  onSubmit: (data: ApprovalFormData) => void;
  onCancel: () => void;
}

export const ApprovalForm = ({ request, level, onSubmit, onCancel }: ApprovalFormProps) => {
  const [selectedDecision, setSelectedDecision] = useState<'approved' | 'rejected' | 'approved_with_conditions' | 'escalated' | null>(null);
  const currentUser = getCurrentUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema)
  });

  const watchedComments = watch('comments');
  const watchedConditions = watch('conditions');

  const handleDecisionChange = (decision: 'approved' | 'rejected' | 'approved_with_conditions' | 'escalated') => {
    setSelectedDecision(decision);
    setValue('decision', decision);
  };

  const submitApproval = (data: ApprovalFormData) => {
    onSubmit(data);
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30';
      case 'approved_with_conditions':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300';
      case 'escalated':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300';
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'approved_with_conditions':
        return <AlertTriangle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'escalated':
        return <ArrowUp className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getDecisionLabel = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'Approuver';
      case 'approved_with_conditions':
        return 'Approuver avec conditions';
      case 'rejected':
        return 'Rejeter';
      case 'escalated':
        return 'Escalader au niveau supérieur';
      default:
        return decision;
    }
  };

  const decisions = level === 1 
    ? ['approved', 'approved_with_conditions', 'rejected', 'escalated'] as const
    : ['approved', 'approved_with_conditions', 'rejected'] as const;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <Shield className="h-6 w-6 mr-2" />
          Validation de Demande - Niveau {level}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <span className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {currentUser.firstName} {currentUser.lastName}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span>Demande: {request.requestNumber}</span>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="outline">
            {request.urgencyLevel === 'critical' ? 'Critique' : 
             request.urgencyLevel === 'high' ? 'Élevée' : 
             request.urgencyLevel === 'emergency' ? 'Urgence' : 'Normale'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Résumé de la demande */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h3 className="font-medium mb-3">Résumé de la demande</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Équipement:</span>
              <p className="font-medium">{request.equipmentName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Capteur:</span>
              <p className="font-medium">{request.sensorName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Initiateur:</span>
              <p className="font-medium">{request.initiatorName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Durée estimée:</span>
              <p className="font-medium">{request.estimatedDuration}h</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date prévue:</span>
              <p className="font-medium">
                {request.plannedStartDate?.toLocaleDateString()} {request.plannedStartDate?.toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Motif:</span>
              <p className="font-medium">{request.reason}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <span className="text-muted-foreground">Justification:</span>
            <p className="mt-1 text-sm">{request.detailedJustification}</p>
          </div>
        </div>

        {/* Évaluation des risques */}
        {request.riskAssessment && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Évaluation des risques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Impact sécurité:</span>
                <Badge variant={request.riskAssessment.safetyImpact === 'high' ? 'destructive' : 'secondary'}>
                  {request.riskAssessment.safetyImpact}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Impact opérationnel:</span>
                <Badge variant={request.riskAssessment.operationalImpact === 'high' ? 'destructive' : 'secondary'}>
                  {request.riskAssessment.operationalImpact}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Impact environnemental:</span>
                <Badge variant={request.riskAssessment.environmentalImpact === 'high' ? 'destructive' : 'secondary'}>
                  {request.riskAssessment.environmentalImpact}
                </Badge>
              </div>
            </div>
            
            {request.riskAssessment.mitigationMeasures && request.riskAssessment.mitigationMeasures.length > 0 && (
              <div className="mt-4">
                <span className="text-muted-foreground">Mesures d'atténuation:</span>
                <ul className="mt-2 text-sm space-y-1">
                  {request.riskAssessment.mitigationMeasures.map((measure, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-primary" />
                      {measure}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Historique des approbations */}
        {request.approvals && request.approvals.length > 0 && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-3">Historique des validations</h3>
            <div className="space-y-3">
              {request.approvals.map((approval, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-background rounded border">
                  <div>
                    <p className="font-medium">{approval.approverName}</p>
                    <p className="text-sm text-muted-foreground">Niveau {approval.level}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={approval.decision === 'approved' ? 'default' : 'destructive'}>
                      {approval.decision}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {approval.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire de décision */}
        <form onSubmit={handleSubmit(submitApproval)} className="space-y-6">
          {/* Sélection de la décision */}
          <div className="space-y-4">
            <h3 className="font-medium">Décision</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {decisions.map((decision) => (
                <button
                  key={decision}
                  type="button"
                  onClick={() => handleDecisionChange(decision)}
                  className={`p-4 border-2 rounded-lg transition-colors text-left ${
                    selectedDecision === decision 
                      ? getDecisionColor(decision)
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {getDecisionIcon(decision)}
                    <span className="font-medium">{getDecisionLabel(decision)}</span>
                  </div>
                </button>
              ))}
            </div>
            {errors.decision && (
              <p className="text-sm text-red-500">Veuillez sélectionner une décision</p>
            )}
          </div>

          {/* Commentaires */}
          <div className="space-y-2">
            <Label htmlFor="comments">
              Commentaires * 
              <span className="text-muted-foreground text-sm ml-2">
                ({watchedComments?.length || 0} caractères)
              </span>
            </Label>
            <Textarea
              id="comments"
              placeholder="Expliquez votre décision, mentionnez les points d'attention, conditions particulières..."
              rows={4}
              {...register('comments')}
            />
            {errors.comments && (
              <p className="text-sm text-red-500">{errors.comments.message}</p>
            )}
          </div>

          {/* Conditions (si approbation avec conditions) */}
          {selectedDecision === 'approved_with_conditions' && (
            <div className="space-y-2">
              <Label htmlFor="conditions">
                Conditions d'approbation *
                <span className="text-muted-foreground text-sm ml-2">
                  ({watchedConditions?.length || 0} caractères)
                </span>
              </Label>
              <Textarea
                id="conditions"
                placeholder="Spécifiez les conditions particulières qui doivent être respectées..."
                rows={3}
                {...register('conditions')}
              />
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Les conditions spécifiées seront obligatoires pour l'exécution du bypass.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Informations sur l'escalade */}
          {selectedDecision === 'escalated' && level === 1 && (
            <Alert>
              <ArrowUp className="h-4 w-4" />
              <AlertDescription>
                Cette demande sera transmise au niveau d'approbation 2 pour révision supplémentaire.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedDecision}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Traitement...' : 'Confirmer la décision'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};