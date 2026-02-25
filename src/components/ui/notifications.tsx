import { useEffect, useState, Fragment } from "react"
import { Link } from "react-router-dom"
import echo from "../../utils/echo"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, ChevronDown, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import api from "../../axios"

type BypassReason = 
  | 'preventive_maintenance'
  | 'corrective_maintenance'
  | 'calibration'
  | 'testing'
  | 'emergency_repair'
  | 'system_upgrade'
  | 'investigation'
  | 'other';

export default function Tinting({ userId, notification, onNotificationUpdate }) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState([])
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    setNotifications(notification || [])
  }, [notification])

  // Gestion des notifications : polling en local, temps réel avec Pusher en production
  useEffect(() => {
    if (!userId) {
      return;
    }

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY || process.env.VITE_PUSHER_APP_KEY;
    const usePolling = isLocal && !pusherKey;
    
    // Si on est en local et que Pusher n'est pas configuré, utiliser le polling
    if (usePolling) {
      console.log('Mode local détecté - utilisation du polling pour les notifications');
      
      const fetchNotifications = async () => {
        try {
          const response = await api.get('/notifications');
          if (response.data && Array.isArray(response.data)) {
            setNotifications(response.data);
          }
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };

      // Récupérer immédiatement
      fetchNotifications();

      // Puis toutes les 5 secondes
      const interval = setInterval(fetchNotifications, 5000);

      return () => clearInterval(interval);
    } else if (echo) {
      // Sinon, utiliser Echo pour les notifications temps réel
      console.log('Utilisation de Pusher pour les notifications temps réel');
      
      try {
        const channel = echo.private(`App.Models.User.${userId}`);
        
        channel.notification((notification) => {
          console.log("Notif temps réel reçue:", notification);
          
          // Laravel envoie les notifications broadcast avec une structure spécifique
          // Le payload est dans notification.data ou directement dans notification
          const notificationData = notification.data || notification;
          
          // Formater la notification pour correspondre au format attendu
          const formattedNotification = {
            id: notificationData.id || notification.id || Date.now(),
            data: notificationData,
            read_at: null,
            created_at: notificationData.created_at || new Date().toISOString(),
          };
          
          setNotifications((prev) => {
            // Vérifier si la notification existe déjà pour éviter les doublons
            const exists = prev.some(n => 
              (n.id === formattedNotification.id) || 
              (n.data?.request_id === notificationData.request_id && n.data?.request_id)
            );
            
            if (exists) {
              return prev;
            }
            
            return [formattedNotification, ...prev];
          });
          
          // Afficher un toast pour les nouvelles notifications
          toast({
            title: "Nouvelle notification",
            description: notificationData.description || notificationData.title || "Vous avez une nouvelle notification",
          });
        });

        // Gestion des erreurs de connexion
        channel.error((error) => {
          console.error("Erreur de connexion Pusher:", error);
        });

        // Nettoyage lors du démontage
        return () => {
          try {
            echo.leave(`App.Models.User.${userId}`);
          } catch (error) {
            console.warn('Error leaving channel:', error);
          }
        };
      } catch (error) {
        console.error('Error setting up Echo channel:', error);
      }
    }
  }, [userId, toast])

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

  function getMaintenanceLabel(key: string): string {
    return reasonLabels[key] ?? key; // si pas trouvé, on retourne la clé brute
  }

  // Trier les notifications uniquement par date (plus récentes en premier) pour garder l'ordre chronologique
  const sortedNotifications = [...notifications].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleNotificationClick = async (notification) => {
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
        
        // Notifier le parent si callback fourni
        if (onNotificationUpdate) {
          const updatedNotifications = notifications.map(n => 
            n.id === notification.id 
              ? (response.data?.notification || { ...n, read_at: new Date().toISOString() })
              : n
          );
          onNotificationUpdate(updatedNotifications);
        }
        
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {notifications?.filter(n => !n.read_at).length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notifications?.filter(n => !n.read_at).length}
            </Badge>
          )}
          {/* <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" /> */}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[350px] p-0">
        <DropdownMenuLabel className="flex items-center justify-between w-full">
          <span>Notifications</span>
          {notifications?.filter(n => !n.read_at).length > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {notifications.filter(n => !n.read_at).length}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications?.length > 0 ? (
          <>
            <ScrollArea className="h-64">
              {sortedNotifications.slice(0, 20).map((n, index) => (
                  <div key={n.id ?? `${n.created_at}-${index}`}>
                      <DropdownMenuItem
                          onClick={() => handleNotificationClick(n)}
                          className={`flex flex-col items-start p-3 mx-2 rounded-lg transition-all cursor-pointer
                          ${
                          !n.read_at
                              ? "bg-primary/10 border-l-2 border-primary hover:bg-primary/20"
                              : "bg-muted/30 hover:bg-muted/50 opacity-75"
                          }`}
                      >
                          <div className="flex items-center gap-2 w-full">
                              <p className={`font-medium flex-1 ${
                                !n.read_at ? "text-foreground font-semibold" : "text-black"
                              }`}>
                                {getMaintenanceLabel(n.data.title)}
                              </p>
                              {!n.read_at && (
                                  <Badge variant="default" className="h-2 w-2 p-0 rounded-full flex-shrink-0" />
                              )}
                          </div>
                          <p className={`text-xs mt-1 ${
                            !n.read_at ? "text-foreground" : "text-black"
                          }`}>
                            {n.data.description}
                          </p>
                          {/* <p className="text-xs text-muted-foreground">
                          par {n.created_by}
                          </p> */}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                  </div>
              ))}
            </ScrollArea>
            {notifications.length > 3 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link 
                    to="/notifications" 
                    className="flex items-center justify-center gap-2 w-full p-3 text-sm text-primary hover:text-primary/80"
                  >
                    <span>Voir toutes les notifications</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">
            Aucune notification pour l'instant.
          </div>
        )}
      </DropdownMenuContent>

      {/* Dialog pour afficher le contenu complet */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[75%] max-h-[90vh] overflow-y-auto">
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

    </DropdownMenu>
  )
}
