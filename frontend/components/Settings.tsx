import React, { useState, useRef } from 'react';
import { User, Mail, Camera, Trash2, LogOut, Save, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../hooks/useAuth';
import { uploadAvatar } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface SettingsProps {
  onNavigate: (page: 'home' | 'dashboard') => void;
  onShowAuth: () => void;
}

export function Settings({ onNavigate, onShowAuth }: SettingsProps) {
  const { user, signOut, updateProfile, loading } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatar(file, user.id);
      setAvatarUrl(publicUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onNavigate('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmText = 'DELETE';
    const userInput = prompt(
      `This will permanently delete your account and all your documents. This action cannot be undone.\n\nType "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      if (userInput !== null) {
        toast.error('Account deletion cancelled - confirmation text did not match');
      }
      return;
    }

    try {
      // In a real app, you'd call a backend endpoint to handle account deletion
      // For now, we'll just sign out the user and show a message
      await signOut();
      onNavigate('home');
      toast.success('Account deletion requested. Please contact support to complete the process.');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <ProtectedRoute onShowAuth={onShowAuth}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account and preferences</p>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
            <CardDescription>Update your personal information and avatar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="bg-purple-600 text-white text-lg">
                    {getInitials(user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  size="sm"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="font-medium text-white">Profile Picture</h3>
                <p className="text-sm text-gray-400">
                  Click the camera icon to upload a new avatar (max 5MB)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                    maxLength={100}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-gray-800 border-gray-700 text-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isSaving || loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Account Security</CardTitle>
            <CardDescription>Manage your account security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-400" />
                <div>
                  <h4 className="font-medium text-white">Account Status</h4>
                  <p className="text-sm text-gray-400">
                    Your account is secure and verified
                  </p>
                </div>
              </div>
              <div className="text-sm text-green-400 font-medium">Active</div>
            </div>

            <Alert className="bg-blue-950/30 border-blue-800/30">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-100">
                <strong>Password Reset:</strong> To change your password, use the "Forgot Password" 
                link on the login page to receive a reset email.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Account Actions</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <h4 className="font-medium text-white">Sign Out</h4>
                <p className="text-sm text-gray-400">Sign out of your account on this device</p>
              </div>
              <Button
                onClick={handleSignOut}
                disabled={loading}
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {loading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-800/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <h4 className="font-medium text-red-400">Delete Account</h4>
                  <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                </div>
              </div>
              <Button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            onClick={() => onNavigate('dashboard')}
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
