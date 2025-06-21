import React, { useState } from 'react';
import { X, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../hooks/useAuth';

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
  const { signIn, signUp, resetPassword, loading } = useAuth();

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
                  className="w-full bg-purple-600 hover:bg-purple-700"
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
                  variant="outline"
                  className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
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
                    className="w-full bg-purple-600 hover:bg-purple-700"
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
                    className="w-full bg-purple-600 hover:bg-purple-700"
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
        </CardContent>
      </Card>
    </div>
  );
}
