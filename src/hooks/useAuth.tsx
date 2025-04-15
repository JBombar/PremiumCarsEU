/* /src/hooks/useAuth.tsx */

'use client';

// Import React explicitly for React.useMemo
import React, { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Assumes client.ts exports supabase instance
import type { User, Session, AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type if needed elsewhere

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean; // Represents initial auth state loading
  // Define signIn/signUp return type more accurately if possible, but 'any' for error is flexible
  signIn: (email: string, password: string) => Promise<{ error: any; user: User | null }>;
  signUp: (email: string, password: string, role: string) => Promise<{ error: any; user: User | null }>;
  signOut: () => Promise<void>;
  // Expose Supabase client if needed by components, though often not necessary
  // supabaseClient: SupabaseClient<any, "public", any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start loading until first check completes

  const router = useRouter();
  const pathname = usePathname(); // Get current path

  // Centralized redirect logic
  const handleRedirects = (currentSession: Session | null) => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isAdminRoute = pathname?.startsWith('/admin');

    // Prevent redirect loops by checking current path
    if (currentSession && isAuthPage) {
      console.log('AuthProvider: Session exists, redirecting from auth page to dashboard');
      router.push('/admin/dashboard'); // Or your main authenticated route
    } else if (!currentSession && isAdminRoute) {
      console.log('AuthProvider: No session, redirecting from protected route to login');
      router.push('/login');
    }
  };

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    // Check initial auth state securely
    const getInitialAuth = async () => {
      try {
        // Use getUser instead of getSession for secure validation
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error getting authenticated user:', error);
        }

        // Only update state if the component is still mounted
        if (isMounted) {
          console.log('AuthProvider: Initial auth check complete. User:', !!user);
          setUser(user);
          // We still need session for some data, but we've validated the user first
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session);
          setIsLoading(false); // Initial load process complete
          handleRedirects(session); // Handle redirect based on initial state
        }
      } catch (catchError) {
        console.error('Unexpected error getting initial auth:', catchError);
        if (isMounted) {
          setIsLoading(false); // Ensure loading stops even on unexpected error
        }
      }
    };

    getInitialAuth();

    // Keep the onAuthStateChange listener as it's still valuable for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        // Log all auth events
        console.log(`%c[Auth State Change] Event: ${event}, Session Exists: ${!!session}, User: ${session?.user?.id ?? 'None'}`, 'color: blue; font-weight: bold;');

        if (isMounted) {
          // Update state regardless of event type
          setSession(session);
          setUser(session?.user ?? null);
          // Handle redirects based on the new session state
          handleRedirects(session);
        }
      }
    );

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      isMounted = false; // Mark as unmounted
      console.log('AuthProvider: Unsubscribing from auth state changes.');
      subscription?.unsubscribe();
    };
    // Rerun effect if router changes (though unlikely) or path changes (for redirects)
  }, [router, pathname]);

  const signIn = async (email: string, password: string) => {
    console.log('useAuth: Signing in with:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error, user: null };
      }

      console.log('Sign in success, user:', data.user);

      // Update user state but don't redirect - let the calling component handle it
      if (data.user) {
        setUser(data.user);
      }

      return { error: null, user: data.user };

    } catch (error) {
      console.error('Unexpected error during signIn:', error);
      return {
        error: error instanceof Error ? error : new Error('An unexpected error occurred during sign in'),
        user: null
      };
    }
  };

  const signUp = async (email: string, password: string, role: string) => {
    console.log('useAuth: Signing up with:', email, 'role:', role);
    try {
      // Create the user in Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error, user: null };
      }

      console.log('Sign up success, user:', data.user);

      // If registration worked, update the user state without redirecting
      if (data.user) {
        setUser(data.user);
      }

      return { error: null, user: data.user };

    } catch (error) {
      console.error('Unexpected error during signUp:', error);
      return {
        error: error instanceof Error ? error : new Error('An unexpected error occurred during sign up'),
        user: null
      };
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out.');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Optionally handle sign-out errors (e.g., display a toast)
    }
    // State update and redirect are handled by onAuthStateChange & handleRedirects.
    // No router.push('/') needed here.
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    // supabaseClient: supabase // Expose client if truly needed elsewhere
  }), [user, session, isLoading]); // Dependencies for memoization

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context; // Simply return the full context with all properties
}