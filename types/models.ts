export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export type FuelType = 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'electric' | 'hybrid';
export type AppLanguage = 'pt-BR' | 'en' | 'es';
export type UnitSystem = 'metric' | 'imperial';
export type ConsumptionUnit = 'km_l' | 'l_100km' | 'mpg_us' | 'mpg_uk';

export interface AppPreferences {
  onboardingCompleted: boolean;
  initialVehicleCompleted: boolean;
  language: AppLanguage;
  countryCode: string;
  unitSystem: UnitSystem;
  consumptionUnit: ConsumptionUnit;
  currencyCode: string;
  name?: string;
  avatarUrl?: string;
}

export interface RouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  tollCost: number;
  fuelLiters: number;
  fuelCost: number;
  totalCost: number;
  currencyCode: string;
  usedTollPass: boolean;
  suggestedFuelPrice?: number;
  fuelPriceCity?: string;
  fuelPriceState?: string;
  fuelPriceWeekLabel?: string;
  fuelPriceSource?: string;
  distanceSource?: string;
  tollSource?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  nickname: string;
  brand: string;
  model: string;
  year: number;
  fuelType: FuelType;
  manualAvgConsumption: number; 
  currentOdometer: number;
  hasTollTag: boolean;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Refuel {
  id: string;
  vehicleId: string;
  date: string; 
  odometer: number;
  liters: number;
  totalPrice: number;
  pricePerLiter: number;
  fuelType: FuelType;
  fullTank: boolean;
  gasStation?: string;
  notes?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  vehicleId: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes?: number;
  avgConsumptionUsed: number;
  fuelPriceUsed: number;
  estimatedLiters: number;
  tollCost: number;
  fuelCost: number;
  totalCost: number;
  roundTrip: boolean;
  passengers?: number;
  notes?: string;
  createdAt: string;
}

export interface OilChange {
  id: string;
  userId: string;
  vehicleId: string;
  changedAt: string;
  odometer: number;
  oilName: string;
  nextChangeDate?: string;
  nextChangeOdometer?: number;
  notes?: string;
  createdAt: string;
}

export type MaintenanceCategory =
  | 'oil_change'
  | 'tires'
  | 'insurance'
  | 'parts'
  | 'service'
  | 'other';

export interface MaintenanceExpense {
  id: string;
  userId: string;
  vehicleId: string;
  category: MaintenanceCategory;
  title: string;
  amount: number;
  date: string;
  notes?: string;
  isRecurring: boolean;
  recurrenceMonths?: number;
  monthlyAmount: number;
  createdAt: string;
}

export interface MonthlyReport {
  id: string;
  vehicleId: string;
  month: number;
  year: number;
  totalKm: number;
  totalFuelSpent: number;
  totalLiters: number;
  avgConsumption: number;
  costPerKm: number;
  tripCount: number;
  refuelCount: number;
}
