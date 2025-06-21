import React, { useState } from 'react';
import { LogIn, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthModal } from './AuthModal';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onNavigate?: (page: 'home' | 'dashboard' | 'settings') => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    if (onNavigate) onNavigate('home');
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => onNavigate?.('home')}
            >
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <h1 className="text-xl font-bold text-white">Speak Legal</h1>
            </div>

            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-400 hidden sm:block">
                Understand Law Like a Human
              </p>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {getInitials(user.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white text-sm">
                          {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </p>
                        <p className="w-[200px] truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={() => onNavigate?.('dashboard')}
                      className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onNavigate?.('settings')}
                      className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-800" />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
