import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
        setInitializing(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          toast.success('Successfully signed in!');
          break;
        case 'SIGNED_OUT':
          toast.success('Successfully signed out!');
          // Clear any cached data
          break;
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed');
          break;
        case 'USER_UPDATED':
          toast.success('Profile updated!');
          break;
        case 'PASSWORD_RECOVERY':
          toast.success('Password reset email sent!');
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
        return { data: null, error };
      }

      if (data.user && !data.session) {
        toast.success('Check your email to confirm your account!');
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { data: null, error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        }
        
        toast.error(errorMessage);
        return { data: null, error: { ...error, message: errorMessage } };
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { data: null, error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error(error.message);
        return { error };
      }

      // Clear any local state/cache here if needed
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return { error };
      }

      toast.success('Password reset email sent! Check your inbox.');
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { error: { message } };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        toast.error(error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      return { data: null, error: { message } };
    } finally {
      setLoading(false);
    }
  };

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
