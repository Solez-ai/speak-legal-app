import React, { useState, useRef } from 'react';
import { User, Mail, Camera, Trash2, LogOut, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  onNavigate: (page: 'home' | 'dashboard') => void;
}

export function Settings({ onNavigate }: SettingsProps) {
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your documents.')) {
      return;
    }

    if (!confirm('This will permanently delete your account and all data. Type "DELETE" to confirm.')) {
      return;
    }

    try {
      // In a real app, you'd call a backend endpoint to handle account deletion
      // For now, we'll just sign out the user
      await signOut();
      onNavigate('home');
      alert('Account deletion requested. Please contact support to complete the process.');
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      {message && (
        <Alert className={message.type === 'success' ? 'bg-green-950/30 border-green-800/30' : 'bg-red-950/30 border-red-800/30'}>
          <AlertDescription className={message.type === 'success' ? 'text-green-100' : 'text-red-100'}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

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
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-purple-600 hover:bg-purple-700"
              >
                <Camera className="h-4 w-4" />
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
              <p className="text-sm text-gray-400">Click the camera icon to upload a new avatar</p>
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
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
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
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-800/30 rounded-lg">
            <div>
              <h4 className="font-medium text-red-400">Delete Account</h4>
              <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
            </div>
            <Button
              onClick={handleDeleteAccount}
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
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
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
