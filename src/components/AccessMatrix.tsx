import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockUsers, getUserPermissions } from '@/data/mockUsers';
import { Check, X, Shield, Users, Crown, Wrench } from 'lucide-react';

const permissions = [
  { key: 'canSubmitRequest', label: 'Soumettre des demandes' },
  { key: 'canApproveLevel1', label: 'Approbation niveau 1' },
  { key: 'canApproveLevel2', label: 'Approbation niveau 2' },
  { key: 'canViewAllRequests', label: 'Consulter toutes les demandes' },
  { key: 'canExportData', label: 'Exporter les données' },
  { key: 'canViewAuditLog', label: 'Journal d\'audit' },
  { key: 'canReceiveNotifications', label: 'Recevoir les notifications' },
  { key: 'canManageSettings', label: 'Gérer les paramètres' },
  { key: 'canRejectRequest', label: 'Rejeter des demandes' },
  { key: 'canCancelRequest', label: 'Annuler des demandes' },
  { key: 'canViewDashboard', label: 'Voir le tableau de bord' },
  { key: 'canManageRoles', label: 'Gérer les rôles' },
  { key: 'canViewEquipment', label: 'Voir les équipements' },
  { key: 'canCreateEquipment', label: 'Créer des équipements' },
  { key: 'canUpdateEquipment', label: 'Modifier des équipements' },
  { key: 'canDeleteEquipment', label: 'Supprimer des équipements' },
  { key: 'canViewUser', label: 'Voir les utilisateurs' },
  { key: 'canCreateUser', label: 'Créer des utilisateurs' },
  { key: 'canUpdateUser', label: 'Modifier des utilisateurs' },
  { key: 'canDeleteUser', label: 'Supprimer des utilisateurs' },
  { key: 'canViewZone', label: 'Voir les zones' },
  { key: 'canCreateZone', label: 'Créer des zones' },
  { key: 'canUpdateZone', label: 'Modifier des zones' },
  { key: 'canDeleteZone', label: 'Supprimer des zones' },
  { key: 'canViewSensor', label: 'Voir les capteurs' },
  { key: 'canCreateSensor', label: 'Créer des capteurs' },
  { key: 'canUpdateSensor', label: 'Modifier des capteurs' },
  { key: 'canDeleteSensor', label: 'Supprimer des capteurs' },
];

const roles = [
  { key: 'initiator', label: 'Initiateur', icon: Wrench, color: 'bg-blue-100 text-blue-800' },
  { key: 'approver_level_1', label: 'Approbateur Niv. 1', icon: Shield, color: 'bg-orange-100 text-orange-800' },
  { key: 'approver_level_2', label: 'Approbateur Niv. 2', icon: Users, color: 'bg-green-100 text-green-800' },
  { key: 'director', label: 'Directeur', icon: Crown, color: 'bg-purple-100 text-purple-800' },
];

export const AccessMatrix = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Matrice des accès par rôle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-3 border-b font-medium">Permissions</th>
                {roles.map((role) => (
                  <th key={role.key} className="text-center p-3 border-b">
                    <div className="flex flex-col items-center space-y-2">
                      <role.icon className="h-4 w-4" />
                      <Badge className={role.color}>
                        {role.label}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.key} className="hover:bg-muted/50">
                  <td className="p-3 border-b font-medium text-sm">
                    {permission.label}
                  </td>
                  {roles.map((role) => {
                    const rolePermissions = getUserPermissions(role.key as any);
                    const hasPermission = rolePermissions[permission.key as keyof typeof rolePermissions];
                    
                    return (
                      <td key={`${role.key}-${permission.key}`} className="p-3 border-b text-center">
                        {hasPermission ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-400 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};