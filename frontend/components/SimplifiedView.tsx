import React, { useState } from 'react';
import { Copy, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AppState } from '../App';

interface SimplifiedViewProps {
  appState: AppState;
}

export function SimplifiedView({ appState }: SimplifiedViewProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'stacked'>('side-by-side');
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});

  if (!appState.analysisResult) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analysis available. Please upload and analyze a document first.</p>
      </div>
    );
  }

  const { simplifiedSections } = appState.analysisResult;

  const copyToClipboard = async (text: string, type: 'original' | 'simplified', index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${type}-${index}`;
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'side-by-side' ? 'stacked' : 'side-by-side');
  };

  if (simplifiedSections.length === 0) {
    return (
      <div className="text-center py-12">
        <Alert className="bg-yellow-950/30 border-yellow-800/30 max-w-md mx-auto">
          <AlertDescription className="text-yellow-100">
            No sections could be simplified. The document may be too short or the AI service may be experiencing issues.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Simplified View</h2>
          <p className="text-gray-400">Original text alongside plain English explanations</p>
        </div>
        <Button
          onClick={toggleViewMode}
          className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
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
                      onClick={() => copyToClipboard(section.originalText, 'original', index)}
                      variant="ghost"
                      size="sm"
                      className="text-white bg-gray-800 hover:bg-gray-700"
                    >
                      {copiedStates[`original-${index}`] ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm leading-relaxed max-h-96 overflow-y-auto scroll-area">
                    {section.originalText}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-green-400">What This Means</h4>
                    <Button
                      onClick={() => copyToClipboard(section.simplifiedText, 'simplified', index)}
                      variant="ghost"
                      size="sm"
                      className="text-white bg-gray-800 hover:bg-gray-700"
                    >
                      {copiedStates[`simplified-${index}`] ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4 text-green-100 text-sm leading-relaxed max-h-96 overflow-y-auto scroll-area">
                    {section.simplifiedText}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-950/30 border-blue-800/30">
        <CardContent className="p-4">
          <div className="text-blue-100 text-sm">
            <p className="font-medium mb-1">💡 How to Use This</p>
            <p>
              Compare the original legal text with our plain English explanations. 
              Use the copy buttons to save sections you want to discuss with your lawyer.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
