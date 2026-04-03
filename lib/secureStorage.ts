import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_PREFIX = 'autofy.secure.';

async function migrateLegacyValue(key: string) {
  const legacyValue = await AsyncStorage.getItem(key);
  if (!legacyValue) {
    return null;
  }

  await SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}`, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

export const secureSessionStorage = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}`);
    if (value !== null) {
      return value;
    }

    return migrateLegacyValue(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}`, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
    await AsyncStorage.removeItem(key);
  },
};

export async function getSecureFlag(key: string) {
  return SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}`);
}

export async function setSecureFlag(key: string, value: string) {
  await SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}`, value);
}

export async function removeSecureFlag(key: string) {
  await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
  await AsyncStorage.removeItem(key);
}
