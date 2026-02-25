import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/types/user';
import { getUserPermissions } from '@/data/mockUsers';
import { 
  Shield, 
  Users, 
  Settings, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Crown,
  Wrench
} from 'lucide-react';

interface ProfileCardProps {
  user: User;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'initiator':
      return <Wrench className="h-5 w-5" />;
    case 'approver_level_1':
      return <Shield className="h-5 w-5" />;
    case 'approver_level_2':
      return <CheckCircle className="h-5 w-5" />;
    case 'director':
      return <Crown className="h-5 w-5" />;
    default:
      return <Users className="h-5 w-5" />;
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'initiator':
      return 'Initiateur';
    case 'approver_level_1':
      return 'Approbateur Niv. 1';
    case 'approver_level_2':
      return 'Approbateur Niv. 2';
    case 'director':
      return 'Directeur';
    default:
      return role;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'initiator':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'approver_level_1':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'approver_level_2':
      return 'bg-primary/10 text-primary hover:bg-primary/20';
    case 'director':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

export const ProfileCard = ({ user }: ProfileCardProps) => {
  const permissions = getUserPermissions(user.role);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              {getRoleIcon(user.role)}
            </div>
            <div>
              <CardTitle className="text-lg">{user.firstName} {user.lastName}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.department}</p>
            </div>
          </div>
          <Badge className={getRoleBadgeColor(user.role)}>
            {getRoleLabel(user.role)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">ID Employé</p>
            <p className="font-mono">{user.employeeId}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Zone</p>
            <p>{user.zone}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Email</p>
            <p className="truncate">{user.email}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Téléphone</p>
            <p>{user.phone || 'Non défini'}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Permissions d'accès
          </h4>
          <div className="space-y-2">
            {permissions.canSubmitRequest && (
              <div className="flex items-center text-sm text-primary bg-primary/5 px-2 py-1 rounded">
                <CheckCircle className="h-3 w-3 mr-2" />
                Soumettre des demandes
              </div>
            )}
            {permissions.canApproveLevel1 && (
              <div className="flex items-center text-sm text-orange-700 bg-orange-50 px-2 py-1 rounded">
                <Shield className="h-3 w-3 mr-2" />
                Approbation niveau 1
              </div>
            )}
            {permissions.canApproveLevel2 && (
              <div className="flex items-center text-sm text-primary bg-primary/5 px-2 py-1 rounded">
                <CheckCircle className="h-3 w-3 mr-2" />
                Approbation niveau 2
              </div>
            )}
            {permissions.canViewAllRequests && (
              <div className="flex items-center text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                <FileText className="h-3 w-3 mr-2" />
                Consulter toutes les demandes
              </div>
            )}
            {permissions.canExportData && (
              <div className="flex items-center text-sm text-purple-700 bg-purple-50 px-2 py-1 rounded">
                <FileText className="h-3 w-3 mr-2" />
                Exporter les données
              </div>
            )}
            {permissions.canViewAuditLog && (
              <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">
                <FileText className="h-3 w-3 mr-2" />
                Journal d'audit
              </div>
            )}
            {(permissions.canViewEquipment || permissions.canCreateEquipment || permissions.canUpdateEquipment || permissions.canDeleteEquipment) && (
              <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                <Settings className="h-3 w-3 mr-2" />
                Équipements ({[
                  permissions.canViewEquipment && 'Voir',
                  permissions.canCreateEquipment && 'Créer',
                  permissions.canUpdateEquipment && 'Modifier',
                  permissions.canDeleteEquipment && 'Supprimer'
                ].filter(Boolean).join(', ')})
              </div>
            )}
            {(permissions.canViewUser || permissions.canCreateUser || permissions.canUpdateUser || permissions.canDeleteUser) && (
              <div className="flex items-center text-sm text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                <Users className="h-3 w-3 mr-2" />
                Utilisateurs ({[
                  permissions.canViewUser && 'Voir',
                  permissions.canCreateUser && 'Créer',
                  permissions.canUpdateUser && 'Modifier',
                  permissions.canDeleteUser && 'Supprimer'
                ].filter(Boolean).join(', ')})
              </div>
            )}
            {(permissions.canViewZone || permissions.canCreateZone || permissions.canUpdateZone || permissions.canDeleteZone) && (
              <div className="flex items-center text-sm text-teal-700 bg-teal-50 px-2 py-1 rounded">
                <Settings className="h-3 w-3 mr-2" />
                Zones ({[
                  permissions.canViewZone && 'Voir',
                  permissions.canCreateZone && 'Créer',
                  permissions.canUpdateZone && 'Modifier',
                  permissions.canDeleteZone && 'Supprimer'
                ].filter(Boolean).join(', ')})
              </div>
            )}
            {(permissions.canViewSensor || permissions.canCreateSensor || permissions.canUpdateSensor || permissions.canDeleteSensor) && (
              <div className="flex items-center text-sm text-cyan-700 bg-cyan-50 px-2 py-1 rounded">
                <Settings className="h-3 w-3 mr-2" />
                Capteurs ({[
                  permissions.canViewSensor && 'Voir',
                  permissions.canCreateSensor && 'Créer',
                  permissions.canUpdateSensor && 'Modifier',
                  permissions.canDeleteSensor && 'Supprimer'
                ].filter(Boolean).join(', ')})
              </div>
            )}
            {permissions.canManageSettings && (
              <div className="flex items-center text-sm text-pink-700 bg-pink-50 px-2 py-1 rounded">
                <Settings className="h-3 w-3 mr-2" />
                Gérer les paramètres
              </div>
            )}
            {permissions.canRejectRequest && (
              <div className="flex items-center text-sm text-red-700 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3 mr-2" />
                Rejeter des demandes
              </div>
            )}
            {permissions.canCancelRequest && (
              <div className="flex items-center text-sm text-red-700 bg-red-50 px-2 py-1 rounded">
                <AlertTriangle className="h-3 w-3 mr-2" />
                Annuler des demandes
              </div>
            )}
            {permissions.canViewDashboard && (
              <div className="flex items-center text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                <FileText className="h-3 w-3 mr-2" />
                Voir le tableau de bord
              </div>
            )}
            {permissions.canManageRoles && (
              <div className="flex items-center text-sm text-violet-700 bg-violet-50 px-2 py-1 rounded">
                <Shield className="h-3 w-3 mr-2" />
                Gérer les rôles
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};