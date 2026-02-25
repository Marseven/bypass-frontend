import { Equipment, Sensor, EquipmentType, SensorType } from '@/types/equipment';

export const mockEquipment: Equipment[] = [
  {
    id: 'eq-001',
    name: 'Convoyeur Principal Zone A',
    code: 'CV-A-001',
    type: 'conveyor',
    zone: 'Zone A - Extraction',
    location: 'Bâtiment A1, Niveau 2',
    fabricant: 'ConveyTech Industries',
    model: 'CT-2500-HD',
    serialNumber: 'CT2024001',
    installationDate: new Date('2023-03-15'),
    lastMaintenance: new Date('2024-01-10'),
    status: 'operational',
    criticite: 'high',
    sensors: [
      {
        id: 'sens-001',
        equipmentId: 'eq-001',
        name: 'Température Moteur Principal',
        code: 'TEMP-CV-A-001-M1',
        type: 'temperature',
        unit: '°C',
        minValue: 0,
        maxValue: 120,
        criticalThreshold: 85,
        warningThreshold: 75,
        status: 'active',
        lastCalibration: new Date('2023-12-15'),
        nextCalibration: new Date('2024-06-15'),
        isActive: true,
        bypassHistory: []
      },
      {
        id: 'sens-002',
        equipmentId: 'eq-001',
        name: 'Vibration Tambour',
        code: 'VIB-CV-A-001-T1',
        type: 'vibration',
        unit: 'mm/s',
        minValue: 0,
        maxValue: 50,
        criticalThreshold: 15,
        warningThreshold: 10,
        status: 'active',
        lastCalibration: new Date('2023-11-20'),
        nextCalibration: new Date('2024-05-20'),
        isActive: true,
        bypassHistory: []
      }
    ]
  },
  {
    id: 'eq-002',
    name: 'Broyeur Primaire B1',
    code: 'BR-B-001',
    type: 'crusher',
    zone: 'Zone B - Traitement',
    location: 'Hall de Broyage, Niveau 1',
    manufacturer: 'CrushForce Equipment',
    model: 'CF-800-Primary',
    serialNumber: 'CF2023045',
    installationDate: new Date('2022-08-20'),
    lastMaintenance: new Date('2024-01-05'),
    status: 'operational',
    criticality: 'critical',
    sensors: [
      {
        id: 'sens-003',
        equipmentId: 'eq-002',
        name: 'Pression Hydraulique',
        code: 'PRESS-BR-B-001-H1',
        type: 'pressure',
        unit: 'bar',
        minValue: 0,
        maxValue: 300,
        criticalThreshold: 280,
        warningThreshold: 250,
        status: 'active',
        lastCalibration: new Date('2024-01-01'),
        nextCalibration: new Date('2024-07-01'),
        isActive: true,
        bypassHistory: []
      },
      {
        id: 'sens-004',
        equipmentId: 'eq-002',
        name: 'Vibration Châssis',
        code: 'VIB-BR-B-001-CH',
        type: 'vibration',
        unit: 'mm/s',
        minValue: 0,
        maxValue: 30,
        criticalThreshold: 20,
        warningThreshold: 15,
        status: 'active',
        isActive: true,
        bypassHistory: []
      }
    ]
  },
  {
    id: 'eq-003',
    name: 'Pompe Eau Process P1',
    code: 'PM-C-001',
    type: 'pump',
    zone: 'Zone C - Transport',
    location: 'Station de Pompage C1',
    manufacturer: 'FlowTech Solutions',
    model: 'FT-500-Industrial',
    serialNumber: 'FT2023078',
    installationDate: new Date('2023-05-10'),
    lastMaintenance: new Date('2024-01-12'),
    status: 'operational',
    criticality: 'medium',
    sensors: [
      {
        id: 'sens-005',
        equipmentId: 'eq-003',
        name: 'Débit Sortie',
        code: 'FLOW-PM-C-001-OUT',
        type: 'flow',
        unit: 'm³/h',
        minValue: 0,
        maxValue: 500,
        criticalThreshold: 450,
        warningThreshold: 400,
        status: 'active',
        isActive: true,
        bypassHistory: []
      },
      {
        id: 'sens-006',
        equipmentId: 'eq-003',
        name: 'Température Paliers',
        code: 'TEMP-PM-C-001-PAL',
        type: 'temperature',
        unit: '°C',
        minValue: 0,
        maxValue: 100,
        criticalThreshold: 80,
        warningThreshold: 70,
        status: 'active',
        isActive: true,
        bypassHistory: []
      }
    ]
  }
];

export const getEquipmentByZone = (zone: string): Equipment[] => {
  return mockEquipment.filter(eq => eq.zone === zone);
};

export const getSensorsByEquipment = (equipmentId: string): Sensor[] => {
  const equipment = mockEquipment.find(eq => eq.id === equipmentId);
  return equipment?.sensors || [];
};

export const getAllZones = (): string[] => {
  return [...new Set(mockEquipment.map(eq => eq.zone))];
};

export const getEquipmentById = (id: string): Equipment | undefined => {
  return mockEquipment.find(eq => eq.id === id);
};

export const getSensorById = (sensorId: string): Sensor | undefined => {
  for (const equipment of mockEquipment) {
    const sensor = equipment.sensors.find(s => s.id === sensorId);
    if (sensor) return sensor;
  }
  return undefined;
};