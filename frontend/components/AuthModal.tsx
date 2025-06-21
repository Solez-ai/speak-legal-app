import React, { useState } from 'react';
import { X, Loader2, Mail, Lock, User } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      } else {
        if (isSignUp) {
          setError(null);
          alert('Check your email to confirm your account!');
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SL</span>
            </div>
            <CardTitle className="text-white">Speak Legal</CardTitle>
          </div>
          <CardDescription>
            Sign in to save your documents and access them anytime
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-gray-300"
            >
              Continue without account
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
