import React, { useState } from 'react';
import { Save, Shield, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const Settings = () => {
  const { toast } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    companyName: 'Bypass Guard Industries',
    maxBypassDuration: 72, // hours
    notificationEmail: 'admin@bypassguard.com',
    autoApprovalThreshold: 4, // hours
    emergencyContact: '+33 1 23 45 67 89'
  });

  const handleSaveGeneralSettings = () => {
    toast({
      title: "Paramètres sauvegardés",
      description: "Les paramètres généraux ont été mis à jour avec succès.",
    });
  };


  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Paramètres</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Configurez les paramètres du système</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Paramètres</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            {/* Bouton retour */}
            <Button variant="outline" size="icon" className="flex-shrink-0 rounded-full w-10 h-10" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres généraux</CardTitle>
          <CardDescription>
            Configurez les paramètres de base du système
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                value={generalSettings.companyName}
                onChange={(e) => setGeneralSettings({...generalSettings, companyName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="maxBypassDuration">Durée max de bypass (heures)</Label>
              <Input
                id="maxBypassDuration"
                type="number"
                value={generalSettings.maxBypassDuration}
                onChange={(e) => setGeneralSettings({...generalSettings, maxBypassDuration: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="notificationEmail">Email de notification</Label>
              <Input
                id="notificationEmail"
                type="email"
                value={generalSettings.notificationEmail}
                onChange={(e) => setGeneralSettings({...generalSettings, notificationEmail: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="autoApprovalThreshold">Seuil d'approbation auto (heures)</Label>
              <Input
                id="autoApprovalThreshold"
                type="number"
                value={generalSettings.autoApprovalThreshold}
                onChange={(e) => setGeneralSettings({...generalSettings, autoApprovalThreshold: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="emergencyContact">Contact d'urgence</Label>
            <Input
              id="emergencyContact"
              value={generalSettings.emergencyContact}
              onChange={(e) => setGeneralSettings({...generalSettings, emergencyContact: e.target.value})}
            />
          </div>

          <Button onClick={handleSaveGeneralSettings} className="gap-2">
            <Save className="w-4 h-4" />
            Sauvegarder les paramètres
          </Button>
        </CardContent>
      </Card>

      {/* Section Rôles et Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Rôles et Permissions
          </CardTitle>
          <CardDescription>
            Gérez les rôles et leurs permissions associées
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Configurez les rôles utilisateurs et définissez les permissions pour chaque rôle.
          </p>
          <Button asChild>
            <Link to="/roles-permissions">
              <Shield className="w-4 h-4 mr-2" />
              Gérer les rôles et permissions
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;