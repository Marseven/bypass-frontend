import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BypassRequestForm } from './forms/BypassRequestForm';
import { ApprovalForm } from './forms/ApprovalForm';
import { BypassRequest } from '@/types/request';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield
} from 'lucide-react';

const mockRequest: Partial<BypassRequest> = {
  id: 'req-001',
  requestNumber: 'BYP-2024-0001',
  equipmentName: 'Convoyeur Principal Zone A',
  sensorName: 'Température Moteur Principal',
  initiatorName: 'Jean Dubois',
  initiatorDepartment: 'Maintenance',
  plannedStartDate: new Date('2024-02-01T14:00:00'),
  estimatedDuration: 4,
  reason: 'preventive_maintenance',
  detailedJustification: 'Maintenance préventive programmée du moteur principal. Remplacement des roulements et vérification des connexions électriques. Cette intervention est critique pour éviter une panne majeure qui pourrait arrêter toute la chaîne de production.',
  urgencyLevel: 'high',
  riskAssessment: {
    safetyImpact: 'medium',
    operationalImpact: 'high',
    environmentalImpact: 'low',
    overallRisk: 'medium',
    mitigationMeasures: [
      'Surveillance manuelle renforcée',
      'Activation des systèmes de sauvegarde',
      'Personnel de sécurité dédié'
    ]
  },
  approvals: [
    {
      id: 'app-001',
      requestId: 'req-001',
      approverId: 'user-003',
      approverName: 'Pierre Leblanc',
      approverRole: 'Approbateur Niveau 1',
      level: 1,
      decision: 'approved',
      comments: 'Demande justifiée et bien documentée. Maintenance critique approuvée.',
      timestamp: new Date('2024-01-30T10:30:00'),
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0'
    }
  ]
};

export const FormsDemo = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);

  const handleRequestSubmit = (data: any) => {
    console.log('Nouvelle demande soumise:', data);
    alert('Demande soumise avec succès!');
    setShowRequestForm(false);
  };

  const handleApprovalSubmit = (data: any) => {
    console.log('Décision d\'approbation:', data);
    alert('Décision enregistrée avec succès!');
    setShowApprovalForm(false);
  };

  const requestStats = [
    {
      title: 'Nouvelles demandes',
      value: '12',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'En validation Niv.1',
      value: '8',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'En validation Niv.2',
      value: '3',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Approuvées',
      value: '25',
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    }
  ];

  if (showRequestForm) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowRequestForm(false)}
          >
            ← Retour au tableau de bord
          </Button>
        </div>
        <BypassRequestForm />
      </div>
    );
  }

  if (showApprovalForm) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowApprovalForm(false)}
          >
            ← Retour au tableau de bord
          </Button>
        </div>
        <ApprovalForm
          request={mockRequest}
          level={2}
          onSubmit={handleApprovalSubmit}
          onCancel={() => setShowApprovalForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques des demandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {requestStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions et Formulaires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Gestion des Demandes de Bypass
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="request">Nouvelle Demande</TabsTrigger>
              <TabsTrigger value="approval">Validation</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
            </TabsList>

            <TabsContent value="request" className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Créer une nouvelle demande</h3>
                <p className="text-muted-foreground mb-4">
                  Soumettez une demande de bypass pour un capteur spécifique
                </p>
                <Button
                  onClick={() => setShowRequestForm(true)}
                  className="flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Nouvelle Demande
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Informations requises</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Sélection équipement et capteur</li>
                      <li>• Justification détaillée</li>
                      <li>• Évaluation des risques</li>
                      <li>• Durée et planification</li>
                      <li>• Mesures d'atténuation</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Processus de validation</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Validation automatique niveau 1</li>
                      <li>• Escalade si criticité élevée</li>
                      <li>• Notification des décisions</li>
                      <li>• Suivi en temps réel</li>
                      <li>• Journal d'audit complet</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="approval" className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Interface de validation</h3>
                <p className="text-muted-foreground mb-4">
                  Simuler la validation d'une demande de bypass
                </p>
                <Button
                  onClick={() => setShowApprovalForm(true)}
                  variant="outline"
                  className="flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Voir Formulaire de Validation
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Demande en attente - Exemple</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Numéro:</span>
                      <p className="font-medium">{mockRequest.requestNumber}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Équipement:</span>
                      <p className="font-medium">{mockRequest.equipmentName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Capteur:</span>
                      <p className="font-medium">{mockRequest.sensorName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Urgence:</span>
                      <Badge variant="outline" className="text-orange-700">
                        {mockRequest.urgencyLevel}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-muted-foreground text-sm">Justification:</span>
                    <p className="text-sm mt-1">{mockRequest.detailedJustification}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Historique des demandes</h3>
                <p className="text-muted-foreground mb-4">
                  Journal complet et exportable de toutes les demandes
                </p>
                <div className="flex justify-center space-x-4">
                  <Button variant="outline">
                    Consulter l'historique
                  </Button>
                  <Button variant="outline">
                    Exporter les données
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-primary">156</div>
                    <div className="text-sm text-muted-foreground">Demandes approuvées</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">23</div>
                    <div className="text-sm text-muted-foreground">Demandes rejetées</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">2.3h</div>
                    <div className="text-sm text-muted-foreground">Temps moyen validation</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};