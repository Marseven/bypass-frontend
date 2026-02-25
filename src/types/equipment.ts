export interface Equipment {
  id: string;
  name: string;
  code?: string;
  type: EquipmentType;
  zone: string;
  location?: string;
  fabricant: string;
  model?: string;
  serialNumber?: string;
  installationDate?: Date;
  lastMaintenance?: Date;
  status: EquipmentStatus;
  criticite: CriticalityLevel;
  sensors: Sensor[];
}

export interface Zone {
  id: string;
  name: string;
  description: string;
  equipmentCount: number;
}

export interface Sensor {
  id: string;
  equipmentId: string;
  name: string;
  code: string;
  type: SensorType;
  unit: string;
  minValue?: number;
  maxValue?: number;
  criticalThreshold?: number;
  warningThreshold?: number;
  status: SensorStatus;
  lastCalibration?: Date;
  nextCalibration?: Date;
  isActive: boolean;
  bypassHistory?: BypassHistory[];
}

export interface BypassHistory {
  id: string;
  requestId: string;
  startDate: Date;
  endDate?: Date;
  duration: number; // in hours
  reason: string;
  approvedBy: string;
  status: 'active' | 'completed' | 'expired';
}

export type EquipmentType = 
  | 'conveyor'
  | 'crusher'
  | 'pump'
  | 'fan'
  | 'separator'
  | 'loader'
  | 'truck'
  | 'drill';

export type SensorType = 
  | 'temperature'
  | 'vibration'
  | 'pressure'
  | 'flow'
  | 'level'
  | 'speed'
  | 'current'
  | 'voltage';

export type EquipmentStatus = 
  | 'operational'
  | 'maintenance'
  | 'down'
  | 'standby';

export type SensorStatus = 
  | 'active'
  | 'bypassed'
  | 'maintenance'
  | 'faulty'
  | 'calibration';

export type CriticalityLevel = 
  | 'low'
  | 'medium' 
  | 'high'
  | 'critical';