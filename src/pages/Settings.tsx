import React, { useState, useEffect } from 'react';
import { Save, Shield, Settings as SettingsIcon, ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import api from '../axios';

const Settings = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [generalSettings, setGeneralSettings] = useState({
    app_name: 'MineSafe OS',
    app_tagline: 'Gestion des bypass',
    max_pending_requests_per_user: '5',
    auto_escalation_hours: '24',
    notification_email: 'notifications@bypassguard.com',
    default_priority: 'medium',
  });

  useEffect(() => {
    api.get('/admin/settings')
      .then(response => {
        if (response.data) {
          setGeneralSettings(prev => ({ ...prev, ...response.data }));
        }
      })
      .catch(() => {
        // Keep defaults if fetch fails
      });
  }, []);

  const handleSaveGeneralSettings = async () => {
    setIsLoading(true);
    try {
      await api.put('/admin/settings', { settings: generalSettings });
      toast({
        title: "Paramètres sauvegardés",
        description: "Les paramètres généraux ont été mis à jour avec succès.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
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
              <Label htmlFor="app_name">Nom de l'application</Label>
              <Input
                id="app_name"
                value={generalSettings.app_name}
                onChange={(e) => setGeneralSettings({...generalSettings, app_name: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="app_tagline">Sous-titre</Label>
              <Input
                id="app_tagline"
                value={generalSettings.app_tagline}
                onChange={(e) => setGeneralSettings({...generalSettings, app_tagline: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="notification_email">Email de notification</Label>
              <Input
                id="notification_email"
                type="email"
                value={generalSettings.notification_email}
                onChange={(e) => setGeneralSettings({...generalSettings, notification_email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="auto_escalation_hours">Escalade auto (heures)</Label>
              <Input
                id="auto_escalation_hours"
                type="number"
                value={generalSettings.auto_escalation_hours}
                onChange={(e) => setGeneralSettings({...generalSettings, auto_escalation_hours: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label htmlFor="default_priority">Priorité par défaut</Label>
              <Input
                id="default_priority"
                value={generalSettings.default_priority}
                onChange={(e) => setGeneralSettings({...generalSettings, default_priority: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="max_pending_requests_per_user">Max demandes en attente / utilisateur</Label>
              <Input
                id="max_pending_requests_per_user"
                type="number"
                value={generalSettings.max_pending_requests_per_user}
                onChange={(e) => setGeneralSettings({...generalSettings, max_pending_requests_per_user: e.target.value})}
              />
            </div>
          </div>

          <Button onClick={handleSaveGeneralSettings} className="gap-2" disabled={isLoading}>
            <Save className="w-4 h-4" />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </CardContent>
      </Card>

      {/* Section Préférences notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Préférences de notifications
          </CardTitle>
          <CardDescription>
            Configurez vos canaux de notification par type d'événement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Choisissez quels canaux de notification activer pour chaque type d'événement.
          </p>
          <Button asChild>
            <Link to="/notification-preferences">
              <Bell className="w-4 h-4 mr-2" />
              Gérer les préférences
            </Link>
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
