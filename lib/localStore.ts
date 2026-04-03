import AsyncStorage from '@react-native-async-storage/async-storage';
import { Refuel, Trip, Vehicle } from '@/types/models';

const KEYS = {
  vehicles: 'autofy.localAdmin.vehicles',
  trips: 'autofy.localAdmin.trips',
  refuels: 'autofy.localAdmin.refuels',
};

async function readList<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, data: T[]) {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function getLocalVehicles() {
  return readList<Vehicle>(KEYS.vehicles);
}

export async function saveLocalVehicles(data: Vehicle[]) {
  return writeList(KEYS.vehicles, data);
}

export async function getLocalTrips() {
  return readList<Trip>(KEYS.trips);
}

export async function saveLocalTrips(data: Trip[]) {
  return writeList(KEYS.trips, data);
}

export async function getLocalRefuels() {
  return readList<Refuel>(KEYS.refuels);
}

export async function saveLocalRefuels(data: Refuel[]) {
  return writeList(KEYS.refuels, data);
}
