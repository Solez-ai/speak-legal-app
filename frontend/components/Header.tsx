import React, { useState } from 'react';
import { LogIn, User, LogOut, Settings, FileText, AlertCircle, Home, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AuthModal } from './AuthModal';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';

interface HeaderProps {
  onNavigate?: (page: 'home' | 'dashboard' | 'settings') => void;
  onShowDictionary?: () => void;
}

export function Header({ onNavigate, onShowDictionary }: HeaderProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, signOut, loading } = useAuth();
  const { documents, loading: documentsLoading } = useDocuments();

  const handleSignOut = async () => {
    await signOut();
    if (onNavigate) onNavigate('home');
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  // Count documents with flagged clauses
  const flaggedDocuments = documents.filter(doc => doc.confusing_clauses.length > 0).length;
  const totalDocuments = documents.length;

  return (
    <>
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onNavigate?.('home')}
            >
              <div className="flex items-center justify-center">
                <img 
                  src="https://i.postimg.cc/CxQc69dz/Screenshot-2025-06-24-162019.jpg" 
                  alt="Speak Legal Logo" 
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    // Fallback to text logo if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <div className="w-8 h-8 bg-purple-600 rounded-lg items-center justify-center hidden">
                  <span className="text-white font-bold text-sm">SL</span>
                </div>
              </div>
              <h1 className="text-xl font-bold text-white">Speak Legal</h1>
            </div>

            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-400 hidden sm:block">
                Understand Law Like a Human
              </p>

              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Document stats for logged in users */}
                  <div className="hidden md:flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1 text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">
                        {documentsLoading ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-b-2 border-gray-400"></div>
                        ) : (
                          totalDocuments
                        )}
                      </span>
                    </div>
                    {flaggedDocuments > 0 && (
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                        <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                          {flaggedDocuments} flagged
                        </Badge>
                      </div>
                    )}
                  </div>

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
                            {getDisplayName()}
                          </p>
                          <p className="w-[200px] truncate text-xs text-gray-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-800" />
                      <DropdownMenuItem 
                        onClick={() => onNavigate?.('home')}
                        className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                      >
                        <Home className="mr-2 h-4 w-4" />
                        Analyze Document
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onNavigate?.('dashboard')}
                        className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        My Documents
                        {totalDocuments > 0 && (
                          <Badge variant="outline" className="ml-auto border-gray-600 text-gray-400">
                            {documentsLoading ? '...' : totalDocuments}
                          </Badge>
                        )}
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
                        disabled={loading}
                        className="text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        {loading ? 'Signing out...' : 'Sign out'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600"
                  disabled={loading}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {loading ? 'Loading...' : 'Sign In'}
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
