import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import backend from '~backend/client';
import type { AppState } from '../App';

interface UploadProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onAnalysisComplete: () => void;
}

export function Upload({ appState, setAppState, onAnalysisComplete }: UploadProps) {
  const [textInput, setTextInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showDocxWarning, setShowDocxWarning] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setShowDocxWarning(false);
    
    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        // For PDF files, show a message asking user to copy/paste text
        text = `[PDF file uploaded: ${file.name}]\n\nPDF text extraction is not available in the browser. Please:\n1. Open your PDF in a PDF viewer\n2. Select all text (Ctrl+A or Cmd+A)\n3. Copy the text (Ctrl+C or Cmd+C)\n4. Paste it in the text area below\n\nThen click "Simplify & Analyze" to proceed.`;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files, show instructions
        text = `[Word document uploaded: ${file.name}]\n\nWord document processing is not available in the browser. Please:\n1. Open your Word document\n2. Select all text (Ctrl+A or Cmd+A)\n3. Copy the text (Ctrl+C or Cmd+C)\n4. Paste it in the text area below\n\nThen click "Simplify & Analyze" to proceed.`;
        setShowDocxWarning(true);
      } else {
        // For text files
        text = await file.text();
      }
      
      setTextInput(text);
      setAppState(prev => ({ ...prev, originalText: text }));
    } catch (error) {
      console.error('Error processing file:', error);
      setTextInput(`Error processing ${file.name}. Please try pasting the text directly.`);
    }
  }, [setAppState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const handleAnalyze = async () => {
    const text = textInput.trim();
    if (!text) return;

    // Don't analyze if it's just the placeholder text
    if (text.includes('[PDF file uploaded:') || text.includes('[Word document uploaded:')) {
      return;
    }

    setAppState(prev => ({ ...prev, isAnalyzing: true, originalText: text }));

    try {
      const result = await backend.legal.analyze({ text });
      setAppState(prev => ({
        ...prev,
        analysisResult: result,
        isAnalyzing: false
      }));
      onAnalysisComplete();
    } catch (error) {
      console.error('Analysis failed:', error);
      setAppState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const canAnalyze = textInput.trim() && 
    !textInput.includes('[PDF file uploaded:') && 
    !textInput.includes('[Word document uploaded:');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Upload Your Legal Document</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Upload a PDF, Word document, or paste text to get clear explanations, identify confusing clauses, 
          and generate questions to ask your lawyer.
        </p>
      </div>

      {showDocxWarning && (
        <Alert className="bg-blue-950/30 border-blue-800/30">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-100">
            Word documents need to be converted to text manually. Please copy the text from your Word document and paste it in the text area below.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <UploadIcon className="w-5 h-5" />
              <span>Upload Document</span>
            </CardTitle>
            <CardDescription>
              Drag and drop or click to upload PDF, DOCX, or TXT files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input {...getInputProps()} />
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              {isDragActive ? (
                <p className="text-purple-400">Drop the file here...</p>
              ) : (
                <div>
                  <p className="text-gray-300 mb-2">
                    Drag & drop a legal document here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOCX, and TXT files
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Note: PDF and DOCX files will require manual text copying
                  </p>
                </div>
              )}
            </div>
            {uploadedFileName && (
              <p className="mt-3 text-sm text-green-400">
                ✓ Uploaded: {uploadedFileName}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          <div className="text-center">
            <Separator className="w-24 mx-auto mb-4" />
            <span className="text-gray-400 text-sm">OR</span>
            <Separator className="w-24 mx-auto mt-4" />
          </div>
        </div>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Paste Text Directly</CardTitle>
          <CardDescription>
            Copy and paste your legal document text here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your legal document text here..."
            value={textInput}
            onChange={(e) => {
              setTextInput(e.target.value);
              setAppState(prev => ({ ...prev, originalText: e.target.value }));
            }}
            className="min-h-[200px] bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
          />
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={handleAnalyze}
          disabled={!canAnalyze || appState.isAnalyzing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg disabled:opacity-50"
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
        {!canAnalyze && textInput.trim() && (
          <p className="text-sm text-gray-400 mt-2">
            Please paste the actual document text to analyze
          </p>
        )}
      </div>
    </div>
  );
}
