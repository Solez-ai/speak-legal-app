import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  const hasFetchedInitialSession = useRef(false);
  const hasShownInitialToast = useRef(false);
  const authSubscriptionRef = useRef<any>(null);

  // ✅ SIGN UP
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      toast.success('Signup successful! Please check your email to confirm.');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ SIGN IN
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Don't show toast here - let the auth state change handler do it
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ SIGN OUT
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Don't show toast here - let the auth state change handler do it
      setUser(null);
      setSession(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ RESET PASSWORD
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      toast.success('Password reset email sent!');
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATE PROFILE
  const updateProfile = async (updates: { email?: string; password?: string; [key: string]: any }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      toast.success('Profile updated!');
      setUser(data.user);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ✅ INITIAL SESSION + SUBSCRIPTION
  useEffect(() => {
    if (hasFetchedInitialSession.current) return;
    hasFetchedInitialSession.current = true;

    const getInitialSession = async () => {
      try {
        console.log('🔄 useAuth - Initializing authentication...');
        
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken) {
          console.log('🔍 useAuth - Found tokens in URL:', { type });
          window.history.replaceState(null, '', window.location.pathname);
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ useAuth - Session error:', error);
          toast.error(error.message);
        } else {
          console.log('✅ useAuth - Initial session loaded:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);

          if (accessToken && session?.user && type === 'signup') {
            toast.success('Email confirmed! Welcome to Speak Legal!');
            hasShownInitialToast.current = true;
          }
        }
      } catch (error) {
        toast.error('Failed to initialize authentication');
        console.error('❌ useAuth - Initialization error:', error);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    getInitialSession();

    // Cleanup any existing auth subscription
    if (authSubscriptionRef.current) {
      authSubscriptionRef.current.unsubscribe();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 useAuth - Auth changed:', event, session?.user?.email || 'No session');

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Only show toasts for actual user actions, not initial loads
      if (!initializing && !hasShownInitialToast.current) {
        switch (event) {
          case 'SIGNED_IN':
            toast.success('Successfully signed in!');
            break;
          case 'SIGNED_OUT':
            toast.success('Successfully signed out!');
            break;
          case 'USER_UPDATED':
            // Don't show toast for profile updates - handled in updateProfile
            break;
          case 'PASSWORD_RECOVERY':
            // Don't show toast here - handled in resetPassword
            break;
        }
      }

      // Reset the flag after initial load
      if (hasShownInitialToast.current) {
        hasShownInitialToast.current = false;
      }
    });

    authSubscriptionRef.current = subscription;

    return () => {
      console.log('🔌 useAuth - Cleaning up auth subscription');
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, []); // Empty dependency array to run only once

  return {
    user,
    session,
    loading,
    initializing,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };
}
