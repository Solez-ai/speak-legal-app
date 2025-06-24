import React, { useState } from 'react';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginPrompt } from './LoginPrompt';
import { KovexChat } from './KovexChat';
import backend from '~backend/client';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import { toast } from 'react-hot-toast';
import type { AppState } from '../App';

interface UploadProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onAnalysisComplete: () => void;
  onShowAuth: () => void;
}

export function Upload({ appState, setAppState, onAnalysisComplete, onShowAuth }: UploadProps) {
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<any>(null);
  const { user } = useAuth();
  const { saveDocument } = useDocuments();

  const handleAnalyze = async () => {
    const text = textInput.trim();
    if (!text) {
      setError('Please enter some text to analyze.');
      return;
    }

    if (text.length < 50) {
      setError('Document text must be at least 50 characters long for meaningful analysis.');
      return;
    }

    setError(null);
    setAppState(prev => ({ ...prev, isAnalyzing: true, originalText: text }));
    setAnalysisStatus('Analyzing document with AI...');

    try {
      console.log('🔄 Starting document analysis...');
      const result = await backend.legal.analyze({ text });
      console.log('✅ Analysis completed successfully');

      // Set the analysis result first
      setAppState(prev => ({
        ...prev,
        analysisResult: result,
        isAnalyzing: false
      }));

      // If user is logged in, save the document
      if (user) {
        console.log('💾 User is logged in, saving document...');
        setAnalysisStatus('Saving document...');
        
        try {
          const title = `Document ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
          await saveDocument(
            title,
            text,
            result.simplifiedSections,
            result.confusingClauses,
            result.suggestedQuestions
          );
          console.log('✅ Document saved successfully');
          toast.success('Document analyzed and saved!');
        } catch (saveError) {
          console.error('❌ Failed to save document:', saveError);
          toast.error('Analysis completed but failed to save document');
        }
      } else {
        // If user is not logged in, show login prompt
        console.log('👤 User not logged in, showing login prompt...');
        setPendingAnalysis({ text, result });
        setShowLoginPrompt(true);
        toast.success('Document analyzed! Sign in to save it.');
      }

      setAnalysisStatus('');
      onAnalysisComplete();
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      setError(
        error instanceof Error 
          ? `Analysis failed: ${error.message}` 
          : 'Analysis failed. Please try again or check your internet connection.'
      );
      setAppState(prev => ({ ...prev, isAnalyzing: false }));
      setAnalysisStatus('');
      toast.error('Analysis failed. Please try again.');
    }
  };

  const handleLoginPromptLogin = () => {
    setShowLoginPrompt(false);
    onShowAuth();
  };

  const handleLoginPromptContinue = async () => {
    if (pendingAnalysis) {
      console.log('📄 Continuing with analysis without saving...');
      setAppState(prev => ({
        ...prev,
        analysisResult: pendingAnalysis.result,
        isAnalyzing: false
      }));
      onAnalysisComplete();
    }
    setShowLoginPrompt(false);
    setPendingAnalysis(null);
  };

  return (
    <>
      <div className="space-y-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Analyze Your Legal Document</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Paste your legal document text below to get clear explanations, identify confusing clauses, 
              and generate questions to ask your lawyer.
            </p>
          </div>

          {error && (
            <Alert className="bg-red-950/30 border-red-800/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-100">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {analysisStatus && (
            <Alert className="bg-blue-950/30 border-blue-800/30">
              <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              <AlertDescription className="text-blue-100">
                {analysisStatus}
              </AlertDescription>
            </Alert>
          )}

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Legal Document Text</CardTitle>
              <CardDescription>
                Copy and paste your legal document text here (minimum 50 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your legal document text here..."
                value={textInput}
                onChange={(e) => {
                  setTextInput(e.target.value);
                  setAppState(prev => ({ ...prev, originalText: e.target.value }));
                  setError(null); // Clear error when user starts typing
                }}
                className="min-h-[300px] bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
              />
              <div className="mt-2 text-sm text-gray-500">
                {textInput.length} characters {textInput.length >= 50 ? '✓' : '(minimum 50 required)'}
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={handleAnalyze}
              disabled={!textInput.trim() || textInput.length < 50 || appState.isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {appState.isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Simplify & Analyze
                </>
              )}
            </Button>
          </div>

          <Card className="bg-yellow-950/30 border-yellow-800/30">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-yellow-100 text-sm">
                  <p className="font-medium mb-1">Privacy Notice</p>
                  <p>
                    Your documents are processed securely and are not stored on our servers unless you sign in. 
                    However, always review sensitive documents before analyzing and consider 
                    removing confidential information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-950/30 border-blue-800/30">
            <CardContent className="p-4">
              <div className="text-blue-100 text-sm">
                <p className="font-medium mb-2">📄 How to Get Your Document Text</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>PDF files:</strong> Open in a PDF viewer, select all text (Ctrl+A), and copy (Ctrl+C)</li>
                  <li>• <strong>Word documents:</strong> Open in Microsoft Word or Google Docs, select all (Ctrl+A), and copy (Ctrl+C)</li>
                  <li>• <strong>Scanned documents:</strong> Use OCR software or manually type the content</li>
                  <li>• <strong>Web pages:</strong> Select the legal text and copy it directly</li>
                  <li>• <strong>Email attachments:</strong> Open the document and copy the text content</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kovex AI Chatbot Section */}
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Ask Kovex AI</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Have questions about legal concepts? Chat with Kovex AI, your legal information assistant. 
              Get clear explanations of legal terms and processes in plain English.
            </p>
          </div>
          
          <KovexChat />
        </div>
      </div>

      <LoginPrompt
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginPromptLogin}
        onContinue={handleLoginPromptContinue}
      />
    </>
  );
}
