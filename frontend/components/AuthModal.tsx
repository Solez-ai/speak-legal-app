import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, Lock, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { signIn, signUp, resetPassword, loading } = useAuth();

  // Test Supabase connection when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔧 AuthModal opened - testing Supabase connection...');
      setConnectionStatus('testing');
      setConnectionError(null);
      
      // Test connection with detailed error handling
      const testConnection = async () => {
        try {
          console.log('🔍 Testing Supabase connection...');
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Supabase connection test failed:', error);
            setConnectionStatus('error');
            
            if (error.message.includes('Invalid API key') || error.message.includes('invalid_api_key')) {
              setConnectionError('Invalid API key - please check your Supabase configuration');
            } else if (error.message.includes('fetch')) {
              setConnectionError('Network error - please check your internet connection');
            } else {
              setConnectionError(`Connection error: ${error.message}`);
            }
          } else {
            console.log('✅ Supabase connection test successful');
            setConnectionStatus('success');
          }
        } catch (err) {
          console.error('❌ Connection test threw error:', err);
          setConnectionStatus('error');
          setConnectionError(err instanceof Error ? err.message : 'Unknown connection error');
        }
      };

      testConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    console.log(`🔄 Attempting ${isSignUp ? 'sign up' : 'sign in'} for:`, email);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (!error) {
        // Reset form
        setEmail('');
        setPassword('');
        setError(null);
        
        if (!isSignUp) {
          onClose();
        }
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      setError('An unexpected error occurred');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    const { error } = await resetPassword(resetEmail);
    
    if (!error) {
      setShowForgotPassword(false);
      setResetEmail('');
      setActiveTab('login');
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setResetEmail('');
    setError(null);
    setShowForgotPassword(false);
    setActiveTab('login');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const retryConnection = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SL</span>
            </div>
            <CardTitle className="text-white">
              {showForgotPassword ? 'Reset Password' : 'Speak Legal'}
            </CardTitle>
          </div>
          <CardDescription>
            {showForgotPassword 
              ? 'Enter your email to receive a password reset link'
              : 'Sign in to save your documents and access them anytime'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Connection Status */}
          {connectionStatus === 'testing' && (
            <Alert className="bg-blue-950/30 border-blue-800/30 mb-4">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              <AlertDescription className="text-blue-100">
                Testing connection to authentication service...
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'error' && (
            <Alert className="bg-red-950/30 border-red-800/30 mb-4">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-100">
                <div className="space-y-2">
                  <p><strong>Connection Error:</strong> {connectionError}</p>
                  <Button
                    onClick={retryConnection}
                    size="sm"
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Connection
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === 'success' && (
            <>
              {showForgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>

                  {error && (
                    <Alert className="bg-red-950/30 border-red-800/30">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-100">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-full bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                </form>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                    <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">
                      Login
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-purple-600">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4 mt-6">
                    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                            required
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert className="bg-red-950/30 border-red-800/30">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <AlertDescription className="text-red-100">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          'Sign In'
                        )}
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Forgot your password?
                        </button>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4 mt-6">
                    <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-4">
                      <div className="space-y-2">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                            required
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="password"
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 bg-gray-800 border-gray-700 text-white"
                            minLength={6}
                            required
                          />
                        </div>
                      </div>

                      {error && (
                        <Alert className="bg-red-950/30 border-red-800/30">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <AlertDescription className="text-red-100">
                            {error}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}

              {!showForgotPassword && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleClose}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Continue without account
                  </button>
                </div>
              )}
            </>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-gray-800 rounded text-xs text-gray-400">
              <div>Debug Info:</div>
              <div>Connection: {connectionStatus}</div>
              <div>URL: {supabase.supabaseUrl}</div>
              <div>Key: {supabase.supabaseKey?.substring(0, 20)}...</div>
              {connectionError && <div>Error: {connectionError}</div>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
