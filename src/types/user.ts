export type UserRole =
  | 'operateur'
  | 'technicien'
  | 'instrumentiste'
  | 'chef_de_quart'
  | 'responsable_hse'
  | 'resp_exploitation'
  | 'directeur'
  | 'administrateur'
  // Legacy roles (backward compatibility)
  | 'user'
  | 'supervisor'
  | 'director'
  | 'administrator';

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
  username?: string;
  email: string;
  role: UserRole;
  department?: string;
  zone?: string;
  phone?: string;
  employeeId?: string;
  isActive: boolean;
  lastLogin?: Date;
  spatie_roles?: string[];
  spatie_permissions?: string[];
}

export interface UserPermissions {
  canSubmitRequest: boolean;
  canApproveLevel1: boolean;
  canApproveLevel2: boolean;
  canViewAllRequests: boolean;
  canExportData: boolean;
  canViewAuditLog: boolean;
  canReceiveNotifications: boolean;
  canManageSettings: boolean;
  canRejectRequest: boolean;
  canCancelRequest: boolean;
  canViewDashboard: boolean;
  canManageRoles: boolean;
  canViewEquipment: boolean;
  canCreateEquipment: boolean;
  canUpdateEquipment: boolean;
  canDeleteEquipment: boolean;
  canViewUser: boolean;
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canViewZone: boolean;
  canCreateZone: boolean;
  canUpdateZone: boolean;
  canDeleteZone: boolean;
  canViewSensor: boolean;
  canCreateSensor: boolean;
  canUpdateSensor: boolean;
  canDeleteSensor: boolean;
}

export interface BypassRequest {
  id: string;
  equipmentId: string;
  sensorId: string;
  initiatorId: string;
  reason: string;
  duration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'level1_review' | 'level2_review' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  approvals: Approval[];
  comments: Comment[];
}

export interface Approval {
  id: string;
  approverId: string;
  level: 1 | 2 | 3;
  decision: 'approved' | 'rejected' | 'pending';
  comment?: string;
  timestamp: Date;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
}
