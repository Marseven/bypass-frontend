import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import api from '../axios';

const forgotSchema = z.object({
  email: z.string({ required_error: "L'email est requis" }).email("Adresse email invalide"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSubmitted(true);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern p-6 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Card variant="glass" className="w-full max-w-md border-border/30 relative">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center w-16 h-18 mx-auto mb-4">
            <img src="/logo.png" alt="Logo ByPass Guard" className="dark:brightness-0 dark:invert" />
          </div>
          <CardTitle className="text-2xl font-display font-bold text-gradient-primary">
            Mot de passe oublie
          </CardTitle>
          <CardDescription>
            {submitted
              ? "Verifiez votre boite mail"
              : "Entrez votre adresse email pour recevoir un lien de reinitialisation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Si cette adresse email est associee a un compte, vous recevrez un lien de reinitialisation dans quelques minutes.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full mt-2">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour a la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="votre@email.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full font-display tracking-wide"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Envoyer le lien
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link to="/login" className="text-sm text-primary hover:underline">
                    <ArrowLeft className="inline mr-1 h-3 w-3" />
                    Retour a la connexion
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
