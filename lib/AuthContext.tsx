import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

const LOCAL_ADMIN_KEY = 'autofy.localAdmin.enabled';
const LOCAL_ADMIN_ID = 'local-admin';
const LOCAL_ADMIN_EMAIL = 'admin@autofy.test';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isLocalAdmin: boolean;
  signOut: () => Promise<void>;
  sendOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  signInAsAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(LOCAL_ADMIN_KEY)])
      .then(([{ data: { session } }, localAdminFlag]) => {
        if (!mounted) return;

        if (localAdminFlag === 'true') {
          setSession(createLocalAdminSession());
          setIsLocalAdmin(true);
        } else {
          setSession(session);
          setIsLocalAdmin(false);
        }

        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted || isLocalAdmin) return;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLocalAdmin]);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return { error };
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(LOCAL_ADMIN_KEY);
    setIsLocalAdmin(false);
    setSession(null);
    await supabase.auth.signOut();
  };

  const signInAsAdmin = async () => {
    await AsyncStorage.setItem(LOCAL_ADMIN_KEY, 'true');
    setIsLocalAdmin(true);
    setSession(createLocalAdminSession());
  };

  return (
    <AuthContext.Provider
      value={{ session, loading, isLocalAdmin, signOut, sendOtp, verifyOtp, signInAsAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function createLocalAdminSession() {
  return {
    access_token: 'local-admin',
    refresh_token: 'local-admin',
    expires_in: 31536000,
    token_type: 'bearer',
    user: {
      id: LOCAL_ADMIN_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: LOCAL_ADMIN_EMAIL,
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { role: 'admin', local: true, name: 'Admin de Teste' },
      created_at: new Date().toISOString(),
    },
  } as Session;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return context;
}
