import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserSelectionDemo } from '@/components/UserSelectionDemo';
import { AccessMatrix } from '@/components/AccessMatrix';
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Settings
} from 'lucide-react';
import { FormsDemo } from '@/components/FormsDemo';

const Index = () => {
  const stats = [
    {
      title: 'Demandes actives',
      value: '24',
      change: '+12%',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'En attente validation',
      value: '8',
      change: '+3',
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Approuvées aujourd\'hui',
      value: '15',
      change: '+25%',
      icon: CheckCircle,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      title: 'Utilisateurs connectés',
      value: '42',
      change: '+5',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                Bypass Guard
              </h1>
              <p className="text-primary-foreground/90 mt-2">
                Système de gestion des demandes de bypass de capteurs
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                Environnement Minier
              </Badge>
              <p className="text-sm text-primary-foreground/80 mt-2">
                Site minier - Toutes zones
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-primary">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Nouvelle demande</h3>
                    <p className="text-sm text-muted-foreground">Créer une demande de bypass</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Validations en attente</h3>
                    <p className="text-sm text-muted-foreground">8 demandes à traiter</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Journal d'audit</h3>
                    <p className="text-sm text-muted-foreground">Consulter l'historique</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaires et Gestion des Demandes */}
        <FormsDemo />

        {/* User Selection Demo */}
        <UserSelectionDemo />

        {/* Access Matrix */}
        <AccessMatrix />

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations système</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">Équipements surveillés</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Convoyeurs (12 actifs)</li>
                  <li>• Broyeurs (4 actifs)</li>
                  <li>• Pompes (8 actives)</li>
                  <li>• Ventilateurs (6 actifs)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Capteurs critiques</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Température (45 capteurs)</li>
                  <li>• Vibration (32 capteurs)</li>
                  <li>• Pression (28 capteurs)</li>
                  <li>• Débit (18 capteurs)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Zones d'opération</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Zone A - Extraction</li>
                  <li>• Zone B - Traitement</li>
                  <li>• Zone C - Transport</li>
                  <li>• Zone D - Stockage</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
