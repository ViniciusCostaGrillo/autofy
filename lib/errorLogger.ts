import AsyncStorage from '@react-native-async-storage/async-storage';

const ERROR_LOGS_KEY = 'autofy.errorLogs';
const MAX_ERROR_LOGS = 30;

export interface AppErrorLog {
  id: string;
  createdAt: string;
  source: string;
  message: string;
  details?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

async function readLogs() {
  if (!__DEV__) {
    return [] as AppErrorLog[];
  }

  const raw = await AsyncStorage.getItem(ERROR_LOGS_KEY);
  if (!raw) {
    return [] as AppErrorLog[];
  }

  try {
    return JSON.parse(raw) as AppErrorLog[];
  } catch {
    return [];
  }
}

async function writeLogs(logs: AppErrorLog[]) {
  if (!__DEV__) {
    return;
  }

  await AsyncStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(logs));
}

export async function logAppError(
  source: string,
  error: unknown,
  metadata?: Record<string, string | number | boolean | null | undefined>
) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
  const details = error instanceof Error && error.stack ? error.stack : undefined;

  const nextLog: AppErrorLog = {
    id: `error-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    source,
    message,
    details,
    metadata,
  };

  if (__DEV__) {
    console.warn(`[${source}]`, message, metadata || {});
  }

  if (!__DEV__) {
    return;
  }

  const existing = await readLogs();
  await writeLogs([nextLog, ...existing].slice(0, MAX_ERROR_LOGS));
}

export async function getAppErrorLogs() {
  return readLogs();
}

export async function clearAppErrorLogs() {
  if (!__DEV__) {
    return;
  }

  await AsyncStorage.removeItem(ERROR_LOGS_KEY);
}
