export type UserRole = 'user' | 'supervisor' | 'director' | 'administrator';

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
  spatie_roles?: string[]; // Rôles Spatie assignés à l'utilisateur
  spatie_permissions?: string[]; // Permissions Spatie de l'utilisateur
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
  // Permissions pour les équipements
  canViewEquipment: boolean;
  canCreateEquipment: boolean;
  canUpdateEquipment: boolean;
  canDeleteEquipment: boolean;
  // Permissions pour les utilisateurs
  canViewUser: boolean;
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  // Permissions pour les zones
  canViewZone: boolean;
  canCreateZone: boolean;
  canUpdateZone: boolean;
  canDeleteZone: boolean;
  // Permissions pour les capteurs
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
  duration: number; // in hours
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