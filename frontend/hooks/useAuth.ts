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
    // Get initial session and handle URL fragments
    const getInitialSession = async () => {
      try {
        console.log('🔄 useAuth - Getting initial session...');
        console.log('🔄 useAuth - Current URL:', window.location.href);
        
        // Check if we have auth fragments in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        
        if (accessToken) {
          console.log('🔍 useAuth - Found auth tokens in URL fragment:', { type });
          // Clear the URL hash to clean up the URL
          window.history.replaceState(null, '', window.location.pathname);
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ useAuth - Error getting session:', error);
          console.error('❌ useAuth - Error details:', {
            message: error.message,
            status: error.status,
            statusCode: error.statusCode
          });
          
          // Check for specific API key errors
          if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
            console.error('🔑 useAuth - API Key validation failed');
            toast.error('Authentication service configuration error. Please refresh the page and try again.');
          } else {
            toast.error(`Session error: ${error.message}`);
          }
        } else {
          console.log('✅ useAuth - Initial session retrieved:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);
          
          // If we just confirmed email and have a session, show success message
          if (accessToken && session?.user && type === 'signup') {
            console.log('✅ useAuth - Email confirmed and user logged in');
            toast.success('Email confirmed! Welcome to Speak Legal!');
          }
        }
      } catch (error) {
        console.error('❌ useAuth - Error in getInitialSession:', error);
        toast.error('Failed to initialize authentication');
      } finally {
        console.log('✅ useAuth - Initial session check complete');
        setLoading(false);
        setInitializing(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 useAuth - Auth state changed:', event, session?.user?.email || 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('✅ useAuth - User signed in successfully');
          toast.success('Successfully signed in!');
          break;
        case 'SIGNED_OUT':
          console.log('✅ useAuth - User signed out successfully');
          toast.success('Successfully signed out!');
          break;
        case 'TOKEN_REFRESHED':
          console.log('🔄 useAuth - Token refreshed');
          break;
        case 'USER_UPDATED':
          console.log('👤 useAuth - User profile updated');
          toast.success('Profile updated!');
          break;
        case 'PASSWORD_RECOVERY':
          console.log('📧 useAuth - Password recovery initiated');
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
      console.log('📝 useAuth - Attempting to sign up with email:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      console.log('📝 useAuth - Sign up response:', { 
        user: data.user?.email, 
        session: !!data.session,
        error: error?.message 
      });

      if (error) {
        console.error('❌ useAuth - Sign up error:', error);
        
        // Enhanced error handling
        let errorMessage = error.message;
        if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
          errorMessage = 'Authentication service configuration error. Please contact support.';
          console.error('🔑 useAuth - Invalid API key during sign up');
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message.includes('Password should be at least')) {
          errorMessage = 'Password must be at least 6 characters long.';
        }
        
        toast.error(errorMessage);
        return { data: null, error: { ...error, message: errorMessage } };
      }

      if (data.user && !data.session) {
        console.log('📧 useAuth - Email confirmation required');
        toast.success('Check your email to confirm your account!');
      } else if (data.session) {
        console.log('✅ useAuth - User signed up and logged in immediately');
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ useAuth - Sign up catch error:', error);
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
      console.log('🔐 useAuth - Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 useAuth - Sign in response:', { 
        user: data.user?.email, 
        session: !!data.session,
        error: error?.message 
      });

      if (error) {
        console.error('❌ useAuth - Sign in error:', error);
        console.error('❌ useAuth - Error details:', {
          message: error.message,
          status: error.status,
          statusCode: error.statusCode
        });
        
        // Enhanced error handling
        let errorMessage = error.message;
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many login attempts. Please wait a moment and try again.';
        } else if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
          errorMessage = 'Authentication service configuration error. Please contact support.';
          console.error('🔑 useAuth - Invalid API key during sign in');
        } else if (error.message.includes('signup_disabled')) {
          errorMessage = 'New signups are currently disabled. Please contact support.';
        }
        
        toast.error(errorMessage);
        return { data: null, error: { ...error, message: errorMessage } };
      }

      console.log('✅ useAuth - Sign in successful');
      return { data, error: null };
    } catch (error) {
      console.error('❌ useAuth - Sign in catch error:', error);
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
      console.log('🚪 useAuth - Attempting to sign out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ useAuth - Sign out error:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('✅ useAuth - Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('❌ useAuth - Sign out catch error:', error);
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
      console.log('📧 useAuth - Attempting password reset for email:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ useAuth - Password reset error:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
          errorMessage = 'Authentication service configuration error. Please contact support.';
          console.error('🔑 useAuth - Invalid API key during password reset');
        }
        
        toast.error(errorMessage);
        return { error: { ...error, message: errorMessage } };
      }

      console.log('✅ useAuth - Password reset email sent');
      toast.success('Password reset email sent! Check your inbox.');
      return { error: null };
    } catch (error) {
      console.error('❌ useAuth - Password reset catch error:', error);
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
      console.log('👤 useAuth - Updating profile with:', updates);
      
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        console.error('❌ useAuth - Profile update error:', error);
        
        let errorMessage = error.message;
        if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
          errorMessage = 'Authentication service configuration error. Please contact support.';
          console.error('🔑 useAuth - Invalid API key during profile update');
        }
        
        toast.error(errorMessage);
        return { data: null, error: { ...error, message: errorMessage } };
      }

      console.log('✅ useAuth - Profile updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ useAuth - Profile update catch error:', error);
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
