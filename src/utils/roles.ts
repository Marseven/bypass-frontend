import type { UserRole } from '@/types/user';

export const ROLE_LABELS: Record<string, string> = {
  operateur: 'Opérateur',
  technicien: 'Technicien',
  instrumentiste: 'Instrumentiste',
  chef_de_quart: 'Chef de quart',
  responsable_hse: 'Responsable HSE',
  resp_exploitation: 'Resp. Exploitation',
  directeur: 'Directeur',
  administrateur: 'Administrateur',
  // Legacy
  user: 'Utilisateur',
  supervisor: 'Superviseur',
  director: 'Directeur',
  administrator: 'Administrateur',
};

export const CDC_ROLES: UserRole[] = [
  'operateur',
  'technicien',
  'instrumentiste',
  'chef_de_quart',
  'responsable_hse',
  'resp_exploitation',
  'directeur',
  'administrateur',
];

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Approuvé',
  active: 'Actif',
  closed: 'Clôturé',
  expired: 'Expiré',
  rejected: 'Rejeté',
};

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  pending: 'bg-yellow-500',
  approved: 'bg-blue-500',
  active: 'bg-green-500',
  closed: 'bg-gray-600',
  expired: 'bg-orange-500',
  rejected: 'bg-red-500',
};

export const BYPASS_TYPE_LABELS: Record<string, string> = {
  maintenance: 'Maintenance',
  operationnel: 'Opérationnel',
  permissif: 'Permissif',
};

export const CRITICALITY_LABELS: Record<string, string> = {
  process: 'Process',
  securite: 'Sécurité',
};

export const DUREE_TYPE_LABELS: Record<string, string> = {
  court_terme: 'Court terme (< 48h)',
  long_terme: 'Long terme (≥ 48h)',
};

export const SIL_LABELS: Record<string, string> = {
  na: 'N/A',
  sil1: 'SIL 1',
  sil2: 'SIL 2',
  sil3: 'SIL 3',
};

export const SYSTEM_TYPE_LABELS: Record<string, string> = {
  process: 'Process',
  securite: 'Sécurité',
  feu_gaz: 'Feu & Gaz',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role;
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || 'bg-gray-400';
}

// Role-based access helpers
export function canViewDashboard(role: UserRole): boolean {
  return role !== 'operateur' && role !== 'user';
}

export function canCreateBypass(role: UserRole): boolean {
  return ['technicien', 'instrumentiste', 'chef_de_quart', 'resp_exploitation', 'directeur', 'administrateur', 'user', 'supervisor', 'director', 'administrator'].includes(role);
}

export function canValidate(role: UserRole): boolean {
  return ['chef_de_quart', 'responsable_hse', 'resp_exploitation', 'directeur', 'administrateur', 'supervisor', 'director', 'administrator'].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return ['administrateur', 'administrator'].includes(role);
}

export function canManageEquipment(role: UserRole): boolean {
  return ['resp_exploitation', 'directeur', 'administrateur', 'director', 'administrator'].includes(role);
}
