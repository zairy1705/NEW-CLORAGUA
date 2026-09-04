export type TankType =
  | 'cylindrical_vertical'
  | 'rectangular_cistern'
  | 'cubic'
  | 'cylindrical_horizontal'
  | 'direct_volume';

export interface TankDimensions {
  type: TankType;
  // Cylindrical vertical
  diameterMeters?: number;
  radiusMeters?: number;
  totalHeightMeters?: number;
  waterHeightMeters?: number;
  // Rectangular cistern
  lengthMeters?: number;
  widthMeters?: number;
  // Cubic
  sideMeters?: number;
  // Cylindrical horizontal
  horizontalLengthMeters?: number;
  horizontalDiameterMeters?: number;
  horizontalWaterLevelMeters?: number;
  // Direct input
  directValue?: number;
  directUnit?: 'L' | 'm3';
}

export type ChlorineProductType =
  | 'sodium_hypochlorite'
  | 'calcium_hypochlorite'
  | 'trichlor'
  | 'custom';

export interface ChlorineProduct {
  type: ChlorineProductType;
  name: string;
  form: 'liquid' | 'granular' | 'tablets';
  concentrationPercent: number; // e.g. 10%, 65%, 90%
  description?: string;
}

export type ResidualStatus = 'optimal' | 'warning' | 'danger';

export interface WaterSystem {
  id: string;
  name: string;
  centerPoblado: string;
  district: string;
  province: string;
  department: string;
  tankType: TankType;
  capacityLiters: number;
  currentVolumeLiters: number;
  waterSource: string;
  responsible: string;
  lastChlorinePpm: number;
  ph: number;
  turbidityNtu: number;
  operationalStatus: 'active' | 'maintenance' | 'alert';
  disinfectionMethod: string;
  observations: string;
  updatedAt: string;
  tier: 'TIER I' | 'TIER II' | 'TIER III';
}

export interface SurveillanceRecord {
  id: string;
  timestamp: string;
  dateStr: string;
  timeStr: string;
  systemId: string;
  systemName: string;
  centerPoblado: string;
  measurementPoint: string;
  volumeLiters: number;
  productName: string;
  concentrationPercent: number;
  initialChlorinePpm: number;
  targetChlorinePpm: number;
  calculatedDoseValue: number;
  calculatedDoseUnit: 'mL' | 'L' | 'g' | 'kg';
  postChlorinePpm?: number;
  contactTimeMinutes: number;
  status: ResidualStatus;
  ph?: number;
  turbidityNtu?: number;
  temperatureC?: number;
  responsible: string;
  observations: string;
  xpEarned: number;
  isAudited?: boolean;
}

export interface NormativeParameters {
  minFreeChlorine: number;       // 0.5 mg/L (D.S. 031-2010-SA)
  optimumMinFreeChlorine: number; // 0.8 mg/L (Recomendado JASS/DIGESA)
  optimumMaxFreeChlorine: number; // 1.5 mg/L
  maxFreeChlorine: number;       // 2.0 mg/L (Límite Máximo Permisible)
  minContactTimeMinutes: number;  // 30 min
  maxTurbidityNtu: number;        // 5.0 NTU
  minPh: number;                  // 6.5
  maxPh: number;                  // 8.5
  regulationTitle: string;        // D.S. N.° 031-2010-SA
  lastUpdated: string;            // Fecha actualización
}

export interface UserGuardianProfile {
  level: number;
  title: string;
  currentXp: number;
  nextLevelXp: number;
  streakDays: number;
  totalVolumeTreatedLiters: number;
  achievementsUnlocked: number;
  totalAchievements: number;
}

export type UserRole =
  | 'operador_jass'
  | 'responsable_atm'
  | 'inspector_salud'
  | 'administrador_sistema';

export interface UserProfileAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  roleLabel: string;
  organization: string; // e.g. "JASS San Jerónimo" / "ATM Municipalidad Lucma"
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt: string;
  guardian: UserGuardianProfile;
}
