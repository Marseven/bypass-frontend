import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { User, Mail, Phone, Shield, Calendar, Eye, EyeOff, Save, Edit, Lock, UserCircle, ArrowLeft, Smartphone, Copy, Check, ShieldCheck, ShieldOff } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import api from '../axios';
import { Link } from 'react-router-dom';
import { PhoneInputField } from '@/components/ui/phone-input';
import QRCode from 'qrcode';

// Extraire firstName et lastName depuis full_name
const extractNames = (fullName: string | undefined) => {
  if (!fullName) return { firstName: '', lastName: '' };
  const nameParts = fullName.trim().split(/\s+/);
  return {
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || ''
  };
};

const Profile: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: extractNames(user?.full_name).firstName,
    lastName: extractNames(user?.full_name).lastName,
    email: user?.email || '',
    phone: user?.phone || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // 2FA state
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAQrDataUrl, setTwoFAQrDataUrl] = useState('');
  const [twoFAOtpCode, setTwoFAOtpCode] = useState('');
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([]);
  const [twoFADisablePassword, setTwoFADisablePassword] = useState('');
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Mettre à jour formData quand user change
  useEffect(() => {
    if (user) {
      const names = extractNames(user.full_name);
      setFormData(prev => ({
        ...prev,
        firstName: names.firstName,
        lastName: names.lastName,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return 'Approbateur N2';
      case 'supervisor': return 'Approbateur N1';
      case 'user': return 'Demandeur';
      case 'administrator': return 'Administrateur';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrator': return 'destructive';
      case 'supervisor': return 'default';
      case 'director': return 'secondary';
      case 'user': return 'outline';
      default: return 'outline';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Vérifier que les mots de passe correspondent si un nouveau mot de passe est fourni
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        toast.error('Les mots de passe ne correspondent pas');
        setIsLoading(false);
        return;
      }

      // Préparer les données à envoyer
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      const updateData: any = {
        full_name: fullName,
        email: formData.email,
      };

      if (formData.phone) {
        updateData.phone = formData.phone;
      }

      // Si un nouveau mot de passe est fourni, inclure le mot de passe
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      // Appel API pour mettre à jour le profil
      const response = await api.put(`/users/${user?.id}`, updateData);
      
      if (response.data) {
        // Mettre à jour le store Redux avec les nouvelles informations
        updateUser({
          full_name: fullName,
          email: formData.email,
          phone: formData.phone || user?.phone || ''
        });
        toast.success('Profil mis à jour avec succès');
        setIsEditing(false);
        // Réinitialiser les champs de mot de passe
        setFormData({
          ...formData,
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        toast.error('Erreur lors de la mise à jour du profil');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    const names = extractNames(user?.full_name);
    setFormData({
      firstName: names.firstName,
      lastName: names.lastName,
      email: user?.email || '',
      phone: user?.phone || '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    try {
      const res = await api.post('/auth/2fa/setup');
      setTwoFASecret(res.data.secret);
      const dataUrl = await QRCode.toDataURL(res.data.otpauth_url, { width: 256, margin: 2 });
      setTwoFAQrDataUrl(dataUrl);
      setShowSetupDialog(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la configuration 2FA');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (twoFAOtpCode.length !== 6) return;
    setTwoFALoading(true);
    try {
      const res = await api.post('/auth/2fa/enable', { code: twoFAOtpCode });
      setTwoFABackupCodes(res.data.backup_codes);
      setShowSetupDialog(false);
      setShowBackupCodesDialog(true);
      updateUser({ two_fa_enabled: true } as any);
      setTwoFAOtpCode('');
      toast.success('2FA activee avec succes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Code OTP invalide');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!twoFADisablePassword) return;
    setTwoFALoading(true);
    try {
      await api.post('/auth/2fa/disable', { password: twoFADisablePassword });
      updateUser({ two_fa_enabled: false } as any);
      setShowDisableDialog(false);
      setTwoFADisablePassword('');
      toast.success('2FA desactivee avec succes');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mot de passe incorrect');
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleCopyBackupCodes = async () => {
    try {
      await navigator.clipboard.writeText(twoFABackupCodes.join('\n'));
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2000);
      toast.success('Codes copies dans le presse-papiers');
    } catch {
      toast.error('Impossible de copier les codes');
    }
  };

  if (!user) {
    return (
      <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
        {/* Header avec breadcrumb */}
        <Card className="bg-card rounded-lg border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Icône */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-white" />
                </div>
                {/* Titre, description et breadcrumb */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Mon Profil</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Gérez vos informations personnelles</p>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link to="/">Tableau de bord</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Mon Profil</BreadcrumbPage>
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
        <Card className="w-full min-w-0 box-border">
          <CardContent className="p-6 sm:p-12 text-center">
            <p className="text-sm sm:text-base text-muted-foreground">Aucune information utilisateur disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden box-border">
      {/* Header avec breadcrumb */}
      <Card className="bg-card rounded-lg border">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icône */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              {/* Titre, description et breadcrumb */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words mb-1">Mon Profil</h1>
                <p className="text-xs sm:text-sm text-muted-foreground break-words mb-2">Gérez vos informations personnelles</p>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Tableau de bord</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Mon Profil</BreadcrumbPage>
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

        {/* Bouton modifier */}
        {!isEditing && (
          <div className="flex justify-end mr-2">
            <Button onClick={() => setIsEditing(true)} className="gap-2 text-sm">
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Modifier le profil</span>
              <span className="sm:hidden">Modifier</span>
            </Button>
          </div>
        )}

      {/* Contenu principal dans une seule Card */}
      <Card className="w-full min-w-0 box-border">
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Section 1: Informations personnelles */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Informations personnelles</h2>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="firstName" className="text-xs sm:text-sm">Prénom</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Prénom"
                    className="w-full min-w-0 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{formData.firstName || '-'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="lastName" className="text-xs sm:text-sm">Nom</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Nom"
                    className="w-full min-w-0 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{formData.lastName || '-'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email"
                    className="w-full min-w-0 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{user.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Téléphone</Label>
                {isEditing ? (
                  <PhoneInputField
                    id="phone"
                    value={formData.phone}
                    onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                    placeholder="Numéro de téléphone"
                    className="w-full min-w-0 text-sm"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs sm:text-sm truncate">{user.phone || formData.phone || 'Non renseigné'}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 w-full min-w-0">
                <Label htmlFor="username" className="text-xs sm:text-sm">Nom d'utilisateur</Label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{user.username}</span>
                </div>
                <p className="text-xs text-muted-foreground">Le nom d'utilisateur ne peut pas être modifié</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2: Informations de compte */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Informations de compte</h2>
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2 w-full min-w-0">
                <Label className="text-xs sm:text-sm">Rôle</Label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs sm:text-sm">
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Le rôle ne peut pas être modifié</p>
              </div>

              <div className="space-y-2 w-full min-w-0">
                <Label className="text-xs sm:text-sm">Statut</Label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted min-w-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <Badge variant={user.is_active ? "default" : "secondary"} className="text-xs sm:text-sm">
                    {user.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section 2b: Authentification a deux facteurs */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Authentification a deux facteurs</h2>
            </div>
            {user.two_fa_enabled ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-md bg-muted">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">2FA activee</p>
                    <p className="text-xs text-muted-foreground">Votre compte est protege par l'authentification a deux facteurs.</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                  className="w-full sm:w-auto"
                >
                  <ShieldOff className="w-4 h-4 mr-2" />
                  Desactiver
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-md bg-muted">
                <div>
                  <p className="text-sm font-medium">2FA desactivee</p>
                  <p className="text-xs text-muted-foreground">Ajoutez une couche de securite supplementaire a votre compte avec Google Authenticator.</p>
                </div>
                <Button
                  size="sm"
                  onClick={handleSetup2FA}
                  disabled={twoFALoading}
                  className="w-full sm:w-auto"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Activer la 2FA
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Section 3: Modification du mot de passe */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">Modification du mot de passe</h2>
            </div>
            {isEditing ? (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="newPassword" className="text-xs sm:text-sm">Nouveau mot de passe</Label>
                  <div className="relative w-full min-w-0">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Nouveau mot de passe"
                      className="w-full min-w-0 pr-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 w-full min-w-0">
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirmer le nouveau mot de passe"
                    className="w-full min-w-0 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 sm:p-4 rounded-md bg-muted">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Cliquez sur "Modifier le profil" pour changer votre mot de passe.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {isEditing && (
            <>
              <Separator />
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                <Button variant="outline" onClick={handleCancel} disabled={isLoading} className="w-full sm:w-auto text-sm">
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto text-sm">
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  {isLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 2FA Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={(open) => { if (!open) { setShowSetupDialog(false); setTwoFAOtpCode(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurer la 2FA</DialogTitle>
            <DialogDescription>
              Scannez le QR code avec Google Authenticator ou une application compatible, puis saisissez le code a 6 chiffres.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {twoFAQrDataUrl && (
              <img src={twoFAQrDataUrl} alt="QR Code 2FA" className="w-48 h-48 rounded-lg border p-2 bg-white" />
            )}
            <div className="text-center space-y-1">
              <p className="text-xs text-muted-foreground">Ou saisissez ce code manuellement :</p>
              <code className="text-sm font-mono bg-muted px-3 py-1 rounded select-all">{twoFASecret}</code>
            </div>
            <div className="w-full space-y-2">
              <Label className="text-sm">Code de verification</Label>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={twoFAOtpCode} onChange={setTwoFAOtpCode} disabled={twoFALoading}>
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
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowSetupDialog(false); setTwoFAOtpCode(''); }}>
              Annuler
            </Button>
            <Button onClick={handleEnable2FA} disabled={twoFALoading || twoFAOtpCode.length !== 6}>
              {twoFALoading ? 'Verification...' : 'Verifier et activer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={(open) => { if (!open) { setShowBackupCodesDialog(false); setTwoFABackupCodes([]); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Codes de secours</DialogTitle>
            <DialogDescription>
              Conservez ces codes en lieu sur. Chaque code ne peut etre utilise qu'une seule fois pour vous connecter si vous n'avez pas acces a votre application d'authentification.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {twoFABackupCodes.map((code, i) => (
                <div key={i} className="text-center py-1">{code}</div>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyBackupCodes} className="w-full sm:w-auto">
              {copiedCodes ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copiedCodes ? 'Copie !' : 'Copier les codes'}
            </Button>
            <Button onClick={() => { setShowBackupCodesDialog(false); setTwoFABackupCodes([]); }} className="w-full sm:w-auto">
              J'ai sauvegarde mes codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={(open) => { if (!open) { setShowDisableDialog(false); setTwoFADisablePassword(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactiver la 2FA</DialogTitle>
            <DialogDescription>
              Saisissez votre mot de passe pour confirmer la desactivation de l'authentification a deux facteurs.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="disable2faPassword">Mot de passe</Label>
            <Input
              id="disable2faPassword"
              type="password"
              value={twoFADisablePassword}
              onChange={(e) => setTwoFADisablePassword(e.target.value)}
              placeholder="Votre mot de passe"
              disabled={twoFALoading}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDisableDialog(false); setTwoFADisablePassword(''); }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={twoFALoading || !twoFADisablePassword}>
              {twoFALoading ? 'Desactivation...' : 'Desactiver la 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;

