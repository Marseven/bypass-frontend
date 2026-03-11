import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import axios from 'axios';

export default function Verify2FA() {
  const navigate = useNavigate();
  const { tempToken, awaiting2FA, login, set2FAState } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  // Redirect if no temp token
  if (!awaiting2FA || !tempToken) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = async () => {
    const code = useBackupCode ? backupCode.trim() : otpCode;
    if (!code) return;

    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://bypass-api.jobs-conseil.host/api/v1';
      const res = await axios.post(
        `${baseUrl}/auth/2fa/verify-login`,
        { code },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${tempToken}`,
          },
        }
      );

      login(res.data.data.user, res.data.data.token);
      set2FAState(false, null);

      toast.success('Connexion reussie', {
        description: 'Verification 2FA reussie.',
      });

      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error('Erreur de verification', {
        description: error.response?.data?.message || 'Code invalide. Veuillez reessayer.',
      });
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    set2FAState(false, null);
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern p-6 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Card variant="glass" className="w-full max-w-md border-border/30 relative">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display font-bold">
            Verification 2FA
          </CardTitle>
          <CardDescription>
            {useBackupCode
              ? 'Saisissez un code de secours pour vous connecter.'
              : 'Saisissez le code a 6 chiffres de votre application d\'authentification.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {useBackupCode ? (
            <div className="flex flex-col items-center gap-4">
              <KeyRound className="w-10 h-10 text-muted-foreground" />
              <Input
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                placeholder="Code de secours"
                className="text-center text-lg tracking-widest"
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                disabled={isLoading}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <span className="mx-2 text-muted-foreground">-</span>
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}

          <Button
            className="w-full font-display tracking-wide"
            disabled={isLoading || (useBackupCode ? !backupCode.trim() : otpCode.length !== 6)}
            onClick={handleVerify}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verification en cours...
              </>
            ) : (
              'Verifier'
            )}
          </Button>

          <div className="flex flex-col gap-2 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
              onClick={() => {
                setUseBackupCode(!useBackupCode);
                setOtpCode('');
                setBackupCode('');
              }}
              disabled={isLoading}
            >
              {useBackupCode ? 'Utiliser le code OTP' : 'Utiliser un code de secours'}
            </button>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Retour a la connexion
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
