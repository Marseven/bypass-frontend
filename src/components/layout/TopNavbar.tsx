import { Bell, Search, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from '@/components/ui/use-toast';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import api from '../../axios'
import echo from "../../utils/echo";
import { useEffect, useState } from "react";
import Tinting from "../ui/notifications"
import { OfflineIndicator } from "./OfflineIndicator"

export function TopNavbar() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const { users, loading, error, user, logout } = useAuthStore();

  const handleLogout = () => {

    api({
      method: 'post',
      url: '/auth/logout',
    })
    .then(data => {
      console.log('Success:', data);
      if (data) {

        logout();

        toast({
          title: 'Déconnexion réussie',
          description: 'Impatient de vous revoir.',
        });
        navigate('/login');
      } else {
        toast({
          title: 'Échec de la déconnexion',
          variant: 'destructive',
        });
      }
    })
  };

  useEffect(() => {
    api.get('/notifications')
    .then(response => {
      setNotifications(response.data)
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
  }, []);

  return (
    <>
      <OfflineIndicator />
      <header className="h-16 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
        <div className="flex items-center justify-between h-full px-6 gap-4">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-8 w-8" />

            {/* Search */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-10 w-full bg-muted/50 border-0 focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Tinting
              userId={user?.id}
              notification={notifications}
              onNotificationUpdate={(updatedNotifications) => {
                setNotifications(updatedNotifications);
              }}
            />

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2 sm:px-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium truncate max-w-[120px]">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">{user?.role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  )
}
