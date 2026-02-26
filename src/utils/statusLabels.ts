// Centralized French labels for all API enum values

export const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  approved: 'Approuvé',
  active: 'Actif',
  closed: 'Clôturé',
  expired: 'Expiré',
  rejected: 'Rejeté',
  submitted: 'Soumis',
  in_progress: 'En cours',
  // French aliases
  en_attente: 'En attente',
  approuve: 'Approuvé',
  actif: 'Actif',
  cloture: 'Clôturé',
  expire: 'Expiré',
  rejete: 'Rejeté',
  brouillon: 'Brouillon',
  soumis: 'Soumis',
};

export const priorityLabels: Record<string, string> = {
  high: 'Haute',
  medium: 'Moyenne',
  low: 'Faible',
  critical: 'Critique',
  emergency: 'Urgence',
  normal: 'Normale',
  // French aliases
  haute: 'Haute',
  moyenne: 'Moyenne',
  faible: 'Faible',
  critique: 'Critique',
  urgence: 'Urgence',
  normale: 'Normale',
};

export const equipmentStatusLabels: Record<string, string> = {
  operational: 'Opérationnel',
  maintenance: 'Maintenance',
  down: 'Hors service',
  standby: 'Arrêt',
};

export const equipmentTypeLabels: Record<string, string> = {
  conveyor: 'Convoyeur',
  crusher: 'Concasseur',
  pump: 'Pompe',
  fan: 'Ventilateur',
  separator: 'Séparateur',
  loader: 'Chargeuse',
  truck: 'Camion',
  drill: 'Foreuse',
};

export const criticalityLabels: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
  critical: 'Critique',
};

export const impactLabels: Record<string, string> = {
  critical: 'Critique',
  critique: 'Critique',
  high: 'Majeur',
  haute: 'Majeur',
  majeur: 'Majeur',
  medium: 'Moyen',
  moyenne: 'Moyen',
  low: 'Mineur',
  normal: 'Mineur',
  faible: 'Mineur',
};

export const roleLabels: Record<string, string> = {
  administrateur: 'Administrateur',
  administrator: 'Administrateur',
  directeur: 'Directeur',
  director: 'Directeur',
  resp_exploitation: "Resp. Exploitation",
  responsable_hse: 'Responsable HSE',
  chef_de_quart: 'Chef de quart',
  supervisor: 'Chef de quart',
  technicien: 'Technicien',
  instrumentiste: 'Instrumentiste',
  operateur: 'Opérateur',
  user: 'Opérateur',
};

export const sensorStatusLabels: Record<string, string> = {
  active: 'Sain',
  bypassed: 'En bypass',
  maintenance: 'En maintenance',
  inactive: 'Inactif',
  faulty: 'En défaut',
};

/** Get a French label for any value, with capitalize fallback */
export function getLabel(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—';
  const label = map[value.toLowerCase()];
  if (label) return label;
  // Fallback: replace underscores, capitalize first letter
  return value.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
}
