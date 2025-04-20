/* /src/hooks/useAuth.tsx */

'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client'; // Client instance for Auth operations
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getOptionalUser } from '@/utils/supabase/auth-helpers';
import { toast } from '@/components/ui/use-toast'; // Import toast for feedback

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

  // Centralized redirect logic
  const handleRedirects = (currentSession: Session | null) => {
    const isAuthPage = pathname === '/login' || pathname === '/register';
    const isAdminRoute = pathname?.startsWith('/admin');

    if (currentSession && isAuthPage) {
      console.log('AuthProvider: Session exists, redirecting from auth page to /admin/dashboard');
      router.push('/admin/dashboard');
    } else if (!currentSession && isAdminRoute) {
      console.log('AuthProvider: No session, redirecting from protected route to /login');
      router.push('/login');
    }
  };

  // Helper function to check and create profile if needed after login
  const ensureProfileExists = async (currentUser: User | null) => {
    if (!currentUser) return; // Should not happen if called after successful login

    console.log('ensureProfileExists: Checking profile for user:', currentUser.id);

    try {
      // Call API route to check if public.users record exists
      const checkResponse = await fetch('/api/check-profile');
      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        console.error('ensureProfileExists: Error checking profile:', checkResult);
        // Maybe show a toast? Decide how critical this is.
        // For now, just log it. User is logged in, but profile check failed.
        toast({ title: "Profile Check Failed", description: checkResult.error || "Could not verify user profile.", variant: "destructive" });
        return; // Stop profile creation if check fails
      }

      if (checkResult.exists === false) {
        console.log('ensureProfileExists: Profile does not exist. Attempting creation...');

        // Retrieve role stored during signup
        const role = currentUser.user_metadata?.role as UserRole | undefined;

        if (!role) {
          console.error('ensureProfileExists: Role not found in user metadata for user:', currentUser.id);
          toast({ title: "Profile Creation Failed", description: "User role information is missing.", variant: "destructive" });
          // Decide action: assign default role? Force logout?
          return; // Cannot create profile without role
        }

        // Call API route to create the profile in public.users and dealer_partners
        const createResponse = await fetch('/api/register-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: role }),
        });

        const createResult = await createResponse.json();

        if (!createResponse.ok) {
          console.error('ensureProfileExists: Error creating profile via API:', createResult);
          toast({ title: "Profile Creation Failed", description: createResult.error || "Failed to save profile details.", variant: "destructive" });
          // Decide action: maybe log user out?
        } else {
          console.log('ensureProfileExists: Profile created successfully for user:', currentUser.id, 'with role:', role);
          toast({ title: "Profile Created", description: "Your user profile was set up." });
          // Profile is now created, user can proceed.
        }
      } else {
        console.log('ensureProfileExists: Profile already exists for user:', currentUser.id);
        // Profile exists, nothing more to do here.
      }
    } catch (error) {
      console.error('ensureProfileExists: Unexpected error:', error);
      toast({ title: "Error During Profile Setup", description: "An unexpected error occurred.", variant: "destructive" });
    }
  };


  useEffect(() => {
    let isMounted = true;

    const getInitialAuth = async () => {
      setIsLoading(true); // Ensure loading is true at start
      try {
        const { user: initialUser, error } = await getOptionalUser(supabase);
        if (error && isMounted) console.error('AuthProvider: Error getting initial user:', error);

        if (isMounted) {
          console.log('AuthProvider: Initial auth check complete. User:', !!initialUser);
          setUser(initialUser);
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          setSession(currentSession);
          // Don't call ensureProfileExists here, only on explicit login events
          handleRedirects(currentSession);
        }
      } catch (catchError) {
        console.error('AuthProvider: Unexpected error getting initial auth:', catchError);
      } finally {
        if (isMounted) setIsLoading(false); // Stop loading once check is done
      }
    };

    getInitialAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log(`%c[Auth State Change] Event: ${event}, Session: ${!!session}, User: ${session?.user?.id ?? 'None'}`, 'color: blue; font-weight: bold;');
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);

          // If user just signed in (and potentially confirmed email), check/create profile
          // Important: Check event type to avoid running on every change
          if (event === 'SIGNED_IN' && session?.user) {
            // Delay slightly to ensure session is fully propagated? Maybe not needed.
            ensureProfileExists(session.user);
          }

          handleRedirects(session);
        }
      }
    );

    return () => {
      isMounted = false;
      console.log('AuthProvider: Unsubscribing from auth state changes.');
      subscription?.unsubscribe();
    };
  }, [pathname]); // Rerun if pathname changes

  const signIn = async (email: string, password: string) => {
    console.log('useAuth: Signing in with:', email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('useAuth signIn error:', error);
        return { error, user: null };
      }
      console.log('useAuth signIn success, user:', data.user?.id);

      // IMPORTANT: Profile check/creation is now handled by the 'SIGNED_IN' event
      // listener in the useEffect hook. We don't need to call ensureProfileExists here.
      // The onAuthStateChange listener will pick up the SIGNED_IN event and handle it.

      // State update is handled by onAuthStateChange
      return { error: null, user: data.user };
    } catch (error) {
      console.error('useAuth: Unexpected error during signIn:', error);
      return { error: error instanceof Error ? error : new Error('Unexpected sign in error'), user: null };
    }
  };

  // --- UPDATED signUp FUNCTION ---
  const signUp = async (email: string, password: string, role: UserRole) => {
    console.log('useAuth: Signing up user with email:', email, ' Storing role in metadata:', role);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { // Store role in user_metadata
            role: role,
          },
        },
      });

      if (error) {
        console.error('useAuth signUp error:', error);
        return { error, user: null };
      }
      console.log('useAuth signUp success (check email if confirmation enabled), user:', data.user?.id);
      // DO NOT insert into public.users here.
      return { error: null, user: data.user };
    } catch (error) {
      console.error('useAuth: Unexpected error during signUp:', error);
      return { error: error instanceof Error ? error : new Error('Unexpected sign up error'), user: null };
    }
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out.');
    const { error } = await supabase.auth.signOut();
    if (error) console.error('AuthProvider: Error signing out:', error);
  };

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    signIn,
    signUp, // Provide the updated signUp function
    signOut,
  }), [user, session, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}