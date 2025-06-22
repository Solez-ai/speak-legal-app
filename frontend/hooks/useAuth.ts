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
        console.log('Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          toast.error(`Session error: ${error.message}`);
        } else {
          console.log('Initial session:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        toast.error('Failed to initialize authentication');
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
      console.log('Attempting to sign up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        console.error('Sign up error:', error);
        toast.error(error.message);
        return { data: null, error };
      }

      if (data.user && !data.session) {
        toast.success('Check your email to confirm your account!');
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign up catch error:', error);
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
      console.log('Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', { data, error });

      if (error) {
        console.error('Sign in error:', error);
        // Provide user-friendly error messages
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message.includes('Invalid API key')) {
          errorMessage = 'Authentication service configuration error. Please contact support.';
          console.error('Invalid API key error - check Supabase configuration');
        }
        
        toast.error(errorMessage);
        return { data: null, error: { ...error, message: errorMessage } };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Sign in catch error:', error);
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
      console.log('Attempting to sign out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('Sign out successful');
      // Clear any local state/cache here if needed
      return { error: null };
    } catch (error) {
      console.error('Sign out catch error:', error);
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
      console.log('Attempting password reset for email:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('Password reset email sent');
      toast.success('Password reset email sent! Check your inbox.');
      return { error: null };
    } catch (error) {
      console.error('Password reset catch error:', error);
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
      console.log('Updating profile with:', updates);
      
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        console.error('Profile update error:', error);
        toast.error(error.message);
        return { data: null, error };
      }

      console.log('Profile updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Profile update catch error:', error);
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
