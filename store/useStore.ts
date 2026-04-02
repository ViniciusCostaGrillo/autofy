import { create } from 'zustand';
import { Vehicle, Trip, Refuel } from '../types/models';

interface AppState {
  vehicles: Vehicle[];
  trips: Trip[];
  refuels: Refuel[];
  
  // Actions
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (id: string, data: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  setDefaultVehicle: (id: string) => void;
  
  addTrip: (trip: Trip) => void;
  addRefuel: (refuel: Refuel) => void;
}

export const useStore = create<AppState>((set) => ({
  vehicles: [
    {
      id: 'mock-vehicle-1',
      userId: 'mock-user',
      nickname: 'Meu Carro',
      brand: 'Honda',
      model: 'Civic',
      year: 2020,
      fuelType: 'flex',
      manualAvgConsumption: 10.5,
      currentOdometer: 45000,
      hasTollTag: true,
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ],
  trips: [],
  refuels: [],

  addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
  
  updateVehicle: (id, data) => set((state) => ({
    vehicles: state.vehicles.map(v => v.id === id ? { ...v, ...data, updatedAt: new Date().toISOString() } : v)
  })),
  
  deleteVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.filter(v => v.id !== id)
  })),
  
  setDefaultVehicle: (id) => set((state) => ({
    vehicles: state.vehicles.map(v => ({
      ...v,
      isDefault: v.id === id
    }))
  })),

  addTrip: (trip) => set((state) => ({ trips: [trip, ...state.trips] })),
  
  addRefuel: (refuel) => set((state) => ({ refuels: [refuel, ...state.refuels] })),
}));
