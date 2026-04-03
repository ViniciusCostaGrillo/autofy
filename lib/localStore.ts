import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppPreferences, OilChange, Refuel, Trip, Vehicle } from '@/types/models';

const KEYS = {
  vehicles: 'autofy.localAdmin.vehicles',
  trips: 'autofy.localAdmin.trips',
  refuels: 'autofy.localAdmin.refuels',
  oilChanges: 'autofy.oilChanges',
  preferences: 'autofy.preferences',
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

export async function getLocalOilChanges() {
  return readList<OilChange>(KEYS.oilChanges);
}

export async function saveLocalOilChanges(data: OilChange[]) {
  return writeList(KEYS.oilChanges, data);
}

export async function getLocalPreferences() {
  const raw = await AsyncStorage.getItem(KEYS.preferences);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppPreferences;
  } catch {
    return null;
  }
}

export async function saveLocalPreferences(data: AppPreferences) {
  await AsyncStorage.setItem(KEYS.preferences, JSON.stringify(data));
}
