import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { logAppError } from './errorLogger';
import { supabase } from './supabase';
import { getSecureFlag, removeSecureFlag, setSecureFlag } from './secureStorage';

const LOCAL_ADMIN_KEY = 'autofy.localAdmin.enabled';
const LOCAL_ADMIN_ID = 'local-admin';
const LOCAL_ADMIN_EMAIL = 'admin@autofy.test';
const LOCAL_ADMIN_ENABLED = __DEV__;

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isLocalAdmin: boolean;
  canUseLocalAdmin: boolean;
  signOut: () => Promise<void>;
  sendOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signInAsAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAdmin, setIsLocalAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([supabase.auth.getSession(), getSecureFlag(LOCAL_ADMIN_KEY)])
      .then(([{ data: { session } }, localAdminFlag]) => {
        if (!mounted) return;

        if (!LOCAL_ADMIN_ENABLED && localAdminFlag === 'true') {
          removeSecureFlag(LOCAL_ADMIN_KEY).catch(() => undefined);
          setSession(session);
          setIsLocalAdmin(false);
        } else if (LOCAL_ADMIN_ENABLED && localAdminFlag === 'true') {
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

    if (error) {
      await logAppError('auth.sendOtp', error, { email });
    }

    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });

    if (error) {
      await logAppError('auth.verifyOtp', error, { email });
    }

    return { error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logAppError('auth.signInWithPassword', error, { email });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      await removeSecureFlag(LOCAL_ADMIN_KEY);
      setIsLocalAdmin(false);
      setSession(null);
      await supabase.auth.signOut();
    } catch (error) {
      await logAppError('auth.signOut', error);
      throw error;
    }
  };

  const signInAsAdmin = async () => {
    if (!LOCAL_ADMIN_ENABLED) {
      throw new Error('Local admin is disabled outside development.');
    }

    try {
      await setSecureFlag(LOCAL_ADMIN_KEY, 'true');
      setIsLocalAdmin(true);
      setSession(createLocalAdminSession());
    } catch (error) {
      await logAppError('auth.signInAsAdmin', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isLocalAdmin,
        canUseLocalAdmin: LOCAL_ADMIN_ENABLED,
        signOut,
        sendOtp,
        verifyOtp,
        signInWithPassword,
        signInAsAdmin,
      }}
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
