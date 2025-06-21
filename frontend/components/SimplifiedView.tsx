import React, { useState } from 'react';
import { Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AppState } from '../App';

interface SimplifiedViewProps {
  appState: AppState;
}

export function SimplifiedView({ appState }: SimplifiedViewProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'stacked'>('side-by-side');

  if (!appState.analysisResult) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analysis available. Please upload and analyze a document first.</p>
      </div>
    );
  }

  const { simplifiedSections } = appState.analysisResult;

  const copyToClipboard = (text: string, type: 'original' | 'simplified') => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'side-by-side' ? 'stacked' : 'side-by-side');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Simplified View</h2>
          <p className="text-gray-400">Original text alongside plain English explanations</p>
        </div>
        <Button
          onClick={toggleViewMode}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          {viewMode === 'side-by-side' ? (
            <>
              <ToggleRight className="w-4 h-4 mr-2" />
              Side-by-Side
            </>
          ) : (
            <>
              <ToggleLeft className="w-4 h-4 mr-2" />
              Stacked
            </>
          )}
        </Button>
      </div>

      <div className="space-y-6">
        {simplifiedSections.map((section, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  Section {index + 1}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={viewMode === 'side-by-side' ? 'grid md:grid-cols-2 gap-6' : 'space-y-6'}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-300">Original Text</h4>
                    <Button
                      onClick={() => copyToClipboard(section.originalText, 'original')}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm leading-relaxed">
                    {section.originalText}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-400">What This Means</h4>
                    <Button
                      onClick={() => copyToClipboard(section.simplifiedText, 'simplified')}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4 text-green-100 text-sm leading-relaxed">
                    {section.simplifiedText}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
