import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Guard so getInitialSession runs only once per app lifetime
  const hasFetchedInitialSession = useRef(false);

  useEffect(() => {
    if (hasFetchedInitialSession.current) return;
    hasFetchedInitialSession.current = true;

    // Get initial session and handle URL fragments
    const getInitialSession = async () => {
      try {
        console.log('🔄 useAuth - Getting initial session...');
        console.log('🔄 useAuth - Current URL:', window.location.href);

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (accessToken) {
          console.log('🔍 useAuth - Found auth tokens in URL fragment:', { type });
          // Clean URL by removing hash fragment
          window.history.replaceState(null, '', window.location.pathname);
        }

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ useAuth - Error getting session:', error);
          if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
            toast.error('Authentication service configuration error. Please refresh the page and try again.');
          } else {
            toast.error(`Session error: ${error.message}`);
          }
        } else {
          console.log('✅ useAuth - Initial session retrieved:', session?.user?.email || 'No session');
          setSession(session);
          setUser(session?.user ?? null);

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

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 useAuth - Auth state changed:', event, session?.user?.email || 'No session');

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      switch (event) {
        case 'SIGNED_IN':
          toast.success('Successfully signed in!');
          break;
        case 'SIGNED_OUT':
          toast.success('Successfully signed out!');
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

  // ... signUp, signIn, signOut, resetPassword, updateProfile unchanged ...

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
