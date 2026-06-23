import { AppState } from 'react-native';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { secureSessionStorage } from './secureStorage';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback to placeholder to prevent module load-time crashes in environments where env variables are not supplied (e.g. EAS build without local .env).
const activeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const activeAnonKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient(activeUrl, activeAnonKey, {
  auth: {
    storage: secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
