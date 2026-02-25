import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle2, Circle } from 'lucide-react';
import api from '../axios';

type BypassReason = 
  | 'preventive_maintenance'
  | 'corrective_maintenance'
  | 'calibration'
  | 'testing'
  | 'emergency_repair'
  | 'system_upgrade'
  | 'investigation'
  | 'other';

interface Notification {
  id: string;
  type: string;
  data: {
    title: string;
    description: string;
  };
  read_at: string | null;
  created_at: string;
}

const Notifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(10);

  const reasonLabels: Record<BypassReason, string> = {
    preventive_maintenance: 'Maintenance préventive',
    corrective_maintenance: 'Maintenance corrective',
    calibration: 'Étalonnage',
    testing: 'Tests',
    emergency_repair: 'Réparation d\'urgence',
    system_upgrade: 'Mise à niveau système',
    investigation: 'Investigation',
    other: 'Autre'
  };

  const getMaintenanceLabel = (key: string): string => {
    return reasonLabels[key as BypassReason] ?? key;
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const readCount = notifications.filter(n => n.read_at).length;

  // Trier les notifications uniquement par date (plus récentes en premier) pour garder l'ordre chronologique
  const sortedNotifications = [...notifications].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Filtrer selon le filtre sélectionné
  const filteredNotifications = sortedNotifications.filter(n => {
    if (filter === 'unread') return !n.read_at;
    if (filter === 'read') return n.read_at;
    return true;
  });

  // Limiter l'affichage selon displayedCount
  const displayedNotifications = filteredNotifications.slice(0, displayedCount);
  const hasMore = filteredNotifications.length > displayedCount;

  // Réinitialiser le compteur quand on change de filtre
  useEffect(() => {
    setDisplayedCount(10);
  }, [filter]);

  const handleNotificationClick = async (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
    
    // Marquer comme lue si elle ne l'est pas déjà
    if (!notification.read_at) {
      try {
        const response = await api.get(`/notifications/${notification.id}/mark-as-read`);
        // Mettre à jour l'état local avec la notification retournée par l'API
        if (response.data && response.data.notification) {
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id 
                ? response.data.notification
                : n
            )
          );
        } else {
          // Fallback : mettre à jour manuellement
          setNotifications(prev => 
            prev.map(n => 
              n.id === notification.id 
                ? { ...n, read_at: new Date().toISOString() }
                : n
            )
          );
        }
        // Mettre à jour aussi la notification sélectionnée
        setSelectedNotification(prev => 
          prev && prev.id === notification.id
            ? { ...prev, read_at: response.data?.notification?.read_at || new Date().toISOString() }
            : prev
        );
        
        // Afficher un toast de confirmation
        toast({
          title: "Notification marquée comme lue",
          description: "La notification a été marquée comme lue.",
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
        toast({
          title: "Erreur",
          description: "Impossible de marquer la notification comme lue.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 min-w-0 box-border">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">Notifications</h1>
          <p className="text-xs sm:text-sm text-muted-foreground break-words">
            {unreadCount > 0 
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications'}
          </p>
        </div>
      </div>

      {/* Filtres */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="text-xs sm:text-sm"
          >
            Toutes ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="text-xs sm:text-sm"
          >
            Non lues ({unreadCount})
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
            className="text-xs sm:text-sm"
          >
            Lues ({readCount})
          </Button>
        </div>
      )}

      {isLoading ? (
        <Card className="p-6 sm:p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold mb-2">
            Aucune notification
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Vous n'avez aucune notification pour l'instant.
          </p>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Afficher toutes les notifications dans l'ordre chronologique */}
          {displayedNotifications.map((notification) => {
            const isUnread = !notification.read_at;
            return (
              <Card 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification)}
                className={`transition-colors cursor-pointer ${
                  isUnread 
                    ? "border-primary/50 bg-primary/5 hover:bg-primary/10 shadow-sm" 
                    : "bg-card/50 hover:bg-card opacity-75"
                }`}
              >
                <CardHeader className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${isUnread ? "bg-primary" : "bg-transparent"}`} />
                      <div className="min-w-0 flex-1">
                        <CardTitle className={`text-sm sm:text-base mb-1 ${isUnread ? "font-semibold text-foreground" : "text-black font-normal"}`}>
                          {getMaintenanceLabel(notification.data.title)}
                        </CardTitle>
                        <CardDescription className={`text-xs sm:text-sm mt-1 ${isUnread ? "text-foreground/80" : "text-black"}`}>
                          {notification.data.description}
                        </CardDescription>
                        <p className="text-xs text-black mt-2">
                          {new Date(notification.created_at).toLocaleString('fr-FR', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={isUnread ? "default" : "outline"} 
                      className={`text-xs flex-shrink-0 ${
                        isUnread 
                          ? "bg-primary" 
                          : "text-black border-black/30"
                      }`}
                    >
                      {isUnread ? "Non lue" : "Lue"}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            );
          })}

          {/* Message si aucun résultat après filtrage */}
          {filteredNotifications.length === 0 && (
            <Card className="p-6 sm:p-12 text-center">
              <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Aucune notification {filter === 'unread' ? 'non lue' : filter === 'read' ? 'lue' : ''}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                {filter === 'unread' 
                  ? 'Vous n\'avez aucune notification non lue.'
                  : filter === 'read'
                  ? 'Vous n\'avez aucune notification lue.'
                  : 'Aucune notification trouvée.'}
              </p>
            </Card>
          )}

          {/* Bouton "Lire plus" */}
          {hasMore && filteredNotifications.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => setDisplayedCount(prev => prev + 10)}
                className="w-full sm:w-auto"
              >
                Lire plus
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Dialog pour afficher le contenu complet */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedNotification && getMaintenanceLabel(selectedNotification.data.title)}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {selectedNotification && new Date(selectedNotification.created_at).toLocaleString('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </DialogDescription>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {selectedNotification.data.description}
                </p>
              </div>
              {selectedNotification.data.details && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">Détails</h3>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {typeof selectedNotification.data.details === 'string' 
                      ? selectedNotification.data.details 
                      : JSON.stringify(selectedNotification.data.details, null, 2)}
                  </p>
                </div>
              )}
              {selectedNotification.data.request_code && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2">Code de demande</h3>
                  <p className="text-sm text-foreground font-mono">
                    {selectedNotification.data.request_code}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t">
                <Badge variant={selectedNotification.read_at ? "outline" : "default"}>
                  {selectedNotification.read_at ? "Lue" : "Non lue"}
                </Badge>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notifications;

