import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectMessage?: string;
  onShowAuth?: () => void;
}

export function ProtectedRoute({ 
  children, 
  fallback, 
  redirectMessage = "You need to be logged in to access this page.",
  onShowAuth 
}: ProtectedRouteProps) {
  const { user, loading, initializing } = useAuth();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Wait for auth to initialize
    if (initializing || loading) {
      return;
    }

    // If no user after initialization, show fallback
    if (!user) {
      setShowFallback(true);
    } else {
      setShowFallback(false);
    }
  }, [user, loading, initializing]);

  // Show loading state while initializing
  if (initializing || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (showFallback) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardContent className="p-8 text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Authentication Required</h3>
            <p className="text-gray-400 mb-6">{redirectMessage}</p>
            <Button
              onClick={onShowAuth}
              className="bg-purple-600 hover:bg-purple-700 w-full"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
