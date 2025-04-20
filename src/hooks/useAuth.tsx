/* /src/hooks/useAuth.tsx */

'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getOptionalUser } from '@/utils/supabase/auth-helpers';
import { toast } from '@/components/ui/use-toast';

// Define the user role type
type UserRole = 'dealer' | 'tipper' | 'admin' | 'buyer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; user: User | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: any; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const handleRedirects = async (currentSession: Session | null) => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isAdminRoute = pathname?.startsWith('/admin');

    if (currentSession && isAuthPage) {
      const { user } = currentSession;
      const { data: userRecord, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (roleError || !userRecord) {
        console.warn('AuthProvider: Failed to fetch user role for redirect fallback');
        return;
      }

      const role = userRecord.role;

      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'dealer') {
        router.push('/dealer-admin');
      } else {
        router.push('/');
      }
    } else if (!currentSession && isAdminRoute) {
      router.push('/login');
    }
  };

  const ensureProfileExists = async (currentUser: User | null) => {
    if (!currentUser) return;

    try {
      const checkResponse = await fetch('/api/check-profile');
      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        toast({ title: 'Profile Check Failed', description: checkResult.error || 'Could not verify user profile.', variant: 'destructive' });
        return;
      }

      if (checkResult.exists === false) {
        const role = currentUser.user_metadata?.role as UserRole | undefined;

        if (!role) {
          toast({ title: 'Profile Creation Failed', description: 'User role information is missing.', variant: 'destructive' });
          return;
        }

        const createResponse = await fetch('/api/register-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok) {
          toast({ title: 'Profile Creation Failed', description: createResult.error || 'Failed to save profile details.', variant: 'destructive' });
        } else {
          toast({ title: 'Profile Created', description: 'Your user profile was set up.' });
        }
      }
    } catch (error) {
      toast({ title: 'Error During Profile Setup', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const getInitialAuth = async () => {
      setIsLoading(true);
      try {
        const { user: initialUser, error } = await getOptionalUser(supabase);
        if (error && isMounted) console.error('AuthProvider: Error getting initial user:', error);

        if (isMounted) {
          setUser(initialUser);
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          handleRedirects(currentSession);
        }
      } catch (catchError) {
        console.error('AuthProvider: Unexpected error getting initial auth:', catchError);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    getInitialAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          if (event === 'SIGNED_IN' && session?.user) {
            ensureProfileExists(session.user);
          }

          handleRedirects(session);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error, user: null };
      return { error: null, user: data.user };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unexpected sign in error'), user: null };
    }
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });

      if (error) return { error, user: null };
      return { error: null, user: data.user };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unexpected sign up error'), user: null };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('AuthProvider: Error signing out:', error);
  };

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  }), [user, session, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
