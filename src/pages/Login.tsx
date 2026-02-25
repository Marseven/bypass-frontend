import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { login, logout, setUsers } from '../store/users';
import api from '../axios';

const loginSchema = z.object({
  username: z.string('Username invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  // const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading, error, user, token } = useSelector((state: RootState) => state.user);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Redirect if already authenticated
  if (token) {
    if(user.role === 'user'){
      return <Navigate to="/requests/new" replace />;
    } else{
      return <Navigate to="/" replace />;
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await api({
        method: 'post',
        url: '/auth/login',
        data: data
      });

      console.log('Success:', res.data.data);
    
      if (res.data.data.length !== 0) { 
        dispatch(login({ user: res.data.data.user, token: res.data.data.token }));
        toast({
          title: 'Connexion réussie',
          description: 'Vous êtes maintenant connecté.',
        });
        
        // Récupérer les notifications après la connexion
        try {
          const notificationsResponse = await api.get('/notifications');
          const allNotifications = notificationsResponse.data || [];
          
          // Filtrer les nouvelles notifications (non lues)
          const newNotifications = allNotifications.filter((notif: any) => !notif.read_at);
          
          // Fonction pour obtenir le label de maintenance
          const getMaintenanceLabel = (key: string): string => {
            const reasonLabels: Record<string, string> = {
              preventive_maintenance: 'Maintenance préventive',
              corrective_maintenance: 'Maintenance corrective',
              calibration: 'Étalonnage',
              testing: 'Tests',
              emergency_repair: 'Réparation d\'urgence',
              system_upgrade: 'Mise à niveau système',
              investigation: 'Investigation',
              other: 'Autre'
            };
            return reasonLabels[key] || key;
          };
          
          // Afficher chaque nouvelle notification en pop-up avec un délai entre chaque
          newNotifications.forEach((notification: any, index: number) => {
            setTimeout(() => {
              const title = notification.data?.title 
                ? getMaintenanceLabel(notification.data.title) 
                : 'Nouvelle notification';
              const description = notification.data?.description || 'Vous avez une nouvelle notification';
              
              toast({
                title: title,
                description: description,
                duration: 5000, // 5 secondes
              });
            }, index * 600); // Délai de 600ms entre chaque notification pour éviter qu'elles se chevauchent
          });
        } catch (error) {
          console.error('Error fetching notifications:', error);
          // Ne pas bloquer la connexion si la récupération des notifications échoue
        }
        
        if(res.data.data.user.role === 'user'){
          navigate('/requests/new', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        console.log('Login failed: ', res.data);
        toast({
          title: 'Échec de la connexion',
          description: 'Email ou mot de passe incorrect.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue lors de la connexion.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6 relative">
      {/* Loader Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center gap-6">
            {/* Logo avec spinner circulaire */}
            <div className="relative flex items-center justify-center w-32 h-32">
              {/* Cercle de fond statique */}
              <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
              {/* Cercle animé qui tourne */}
              <div className="absolute inset-0 border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin" style={{ animationDuration: '1s' }}></div>
              {/* Logo au centre */}
              <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-white rounded-xl p-3 shadow-lg">
                <img src="/logo.png" alt="Logo ByPass Guard" className="w-full h-full object-contain" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">Connexion en cours...</p>
              <p className="text-sm text-muted-foreground mt-1">Veuillez patienter</p>
            </div>
          </div>
        </div>
      )}
      
      <Card className={`w-full max-w-md shadow-xl border-primary/10 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center w-16 h-18 mx-auto mb-4">
            {/* <LogIn className="w-6 h-6 text-primary" /> */}
            <img src="/logo.png" alt="Logo ByPass Guard" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Connexion
          </CardTitle>
          <CardDescription>
            Connectez-vous à votre compte pour accéder au système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="administrateur"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isLoading}
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Se connecter
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Pas encore de compte ?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </div> */}

          {/* <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Comptes de test :</p>
            <p>• admin@test.com (Directeur)</p>
            <p>• approver1@test.com (Approbateur Niveau 1)</p>
            <p>• initiator@test.com (Initiateur)</p>
            <p className="mt-1 italic">Mot de passe : n'importe lequel</p>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}