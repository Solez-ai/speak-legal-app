import React from 'react';
import { X, Shield, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onContinue: () => void;
}

export function LoginPrompt({ isOpen, onClose, onLogin, onContinue }: LoginPromptProps) {
  if (!isOpen) return null;

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
            <CardTitle className="text-white">Save Your Analysis?</CardTitle>
          </div>
          <CardDescription>
            We recommend signing in to save your document analysis and access it later
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Save className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Save Your Work</h4>
                <p className="text-sm text-gray-400">Keep all your analyzed documents in one place</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Access Anytime</h4>
                <p className="text-sm text-gray-400">View your documents from any device</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">Secure & Private</h4>
                <p className="text-sm text-gray-400">Your documents are encrypted and private</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={onLogin}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              Sign In to Save
            </Button>
            <Button
              onClick={onContinue}
              className="w-full bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
            >
              Continue Without Saving
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            You can always sign in later, but this analysis won't be saved
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
