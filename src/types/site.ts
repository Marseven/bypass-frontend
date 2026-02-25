export interface Site {
  id: number;
  code: string;
  name: string;
  location?: string;
  is_active: boolean;
  zones?: import('./equipment').Zone[];
  created_at?: string;
  updated_at?: string;
}
