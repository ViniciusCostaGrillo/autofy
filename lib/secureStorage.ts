import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const STORAGE_PREFIX = 'autofy.secure.';
const CHUNK_SIZE = 1800;
const CHUNK_META_SUFFIX = '.__chunks';
const SESSION_KEY_HINT = 'auth-token';

async function getChunkCount(key: string) {
  const raw = await SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}${CHUNK_META_SUFFIX}`);
  const count = Number(raw || '0');
  return Number.isFinite(count) && count > 0 ? count : 0;
}

async function readChunkedValue(key: string) {
  const chunkCount = await getChunkCount(key);
  if (chunkCount <= 0) {
    return null;
  }

  const chunks = await Promise.all(
    Array.from({ length: chunkCount }, (_, index) =>
      SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}.${index}`)
    )
  );

  if (chunks.some((chunk) => chunk === null)) {
    return null;
  }

  return chunks.join('');
}

async function writeChunkedValue(key: string, value: string) {
  const existingChunkCount = await getChunkCount(key);
  const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, 'g')) || [''];

  await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);

  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}.${index}`, chunk)
    )
  );

  if (existingChunkCount > chunks.length) {
    await Promise.all(
      Array.from({ length: existingChunkCount - chunks.length }, (_, index) =>
        SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}.${chunks.length + index}`)
      )
    );
  }

  await SecureStore.setItemAsync(`${STORAGE_PREFIX}${key}${CHUNK_META_SUFFIX}`, String(chunks.length));
}

async function removeChunkedValue(key: string) {
  const chunkCount = await getChunkCount(key);
  if (chunkCount > 0) {
    await Promise.all(
      Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}.${index}`)
      )
    );
  }

  await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}${CHUNK_META_SUFFIX}`);
}

async function migrateLegacyValue(key: string) {
  const legacyValue = await AsyncStorage.getItem(key);
  if (!legacyValue) {
    return null;
  }

  await writeChunkedValue(key, legacyValue);
  await AsyncStorage.removeItem(key);
  return legacyValue;
}

async function migrateLegacySecureValue(key: string) {
  const legacyValue = await SecureStore.getItemAsync(`${STORAGE_PREFIX}${key}`);
  if (!legacyValue) {
    return null;
  }

  const shouldValidateJson = key.includes(SESSION_KEY_HINT);
  if (shouldValidateJson) {
    try {
      const parsed = JSON.parse(legacyValue);
      if (!parsed?.access_token || !parsed?.refresh_token) {
        await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
        return null;
      }
    } catch {
      await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
      return null;
    }
  }

  await writeChunkedValue(key, legacyValue);
  await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
  return legacyValue;
}

export const secureSessionStorage = {
  getItem: async (key: string) => {
    const chunkedValue = await readChunkedValue(key);
    if (chunkedValue !== null) {
      return chunkedValue;
    }

    const value = await migrateLegacySecureValue(key);
    if (value !== null) {
      return value;
    }

    return migrateLegacyValue(key);
  },
  setItem: async (key: string, value: string) => {
    await writeChunkedValue(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(`${STORAGE_PREFIX}${key}`);
    await removeChunkedValue(key);
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
