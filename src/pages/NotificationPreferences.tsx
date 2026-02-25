import React, { useState, useEffect } from 'react';
import { Save, Bell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import api from '../axios';

const EVENT_TYPES = [
  { key: 'request_created', label: 'Nouvelle demande' },
  { key: 'validation_result', label: 'Résultat validation' },
  { key: 'expiration_warning', label: 'Alerte expiration' },
  { key: 'reminder', label: 'Rappels' },
] as const;

const CHANNELS = [
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'in_app', label: 'In-App' },
] as const;

type PreferenceMap = Record<string, Record<string, boolean>>;

const NotificationPreferences = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<PreferenceMap>(() => {
    const initial: PreferenceMap = {};
    EVENT_TYPES.forEach(evt => {
      initial[evt.key] = {};
      CHANNELS.forEach(ch => {
        initial[evt.key][ch.key] = true;
      });
    });
    return initial;
  });

  useEffect(() => {
    api.get('/notification-preferences')
      .then(response => {
        if (Array.isArray(response.data)) {
          const updated = { ...preferences };
          response.data.forEach((pref: { event_type: string; channel: string; enabled: boolean }) => {
            if (updated[pref.event_type]) {
              updated[pref.event_type][pref.channel] = pref.enabled;
            }
          });
          setPreferences(updated);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggle = (eventType: string, channel: string) => {
    setPreferences(prev => ({
      ...prev,
      [eventType]: {
        ...prev[eventType],
        [channel]: !prev[eventType][channel],
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const prefs: { channel: string; event_type: string; enabled: boolean }[] = [];
      Object.entries(preferences).forEach(([eventType, channels]) => {
        Object.entries(channels).forEach(([channel, enabled]) => {
          prefs.push({ channel, event_type: eventType, enabled });
        });
      });

      await api.put('/notification-preferences', { preferences: prefs });
      toast({
        title: 'Préférences sauvegardées',
        description: 'Vos préférences de notifications ont été mises à jour.',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Erreur lors de la sauvegarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Préférences de notifications</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Configurez vos canaux de notification</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/settings">Paramètres</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Notifications</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>
            <Button variant="outline" size="icon" className="flex-shrink-0 rounded-full w-10 h-10" asChild>
              <Link to="/settings">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canaux par type d'événement</CardTitle>
          <CardDescription>
            Activez ou désactivez les canaux de notification pour chaque type d'événement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type d'événement</th>
                  {CHANNELS.map(ch => (
                    <th key={ch.key} className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                      {ch.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVENT_TYPES.map(evt => (
                  <tr key={evt.key} className="border-b last:border-0">
                    <td className="py-4 px-4">
                      <Label className="text-sm font-medium">{evt.label}</Label>
                    </td>
                    {CHANNELS.map(ch => (
                      <td key={ch.key} className="text-center py-4 px-4">
                        <Switch
                          checked={preferences[evt.key]?.[ch.key] ?? true}
                          onCheckedChange={() => handleToggle(evt.key, ch.key)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6">
            <Button onClick={handleSave} className="gap-2" disabled={isLoading}>
              <Save className="w-4 h-4" />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
