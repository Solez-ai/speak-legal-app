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
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');

  const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple DOCX text extraction - look for document.xml content
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(uint8Array);
      
      // This is a very basic extraction - in production you'd want a proper DOCX parser
      const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (textMatches) {
        const extractedText = textMatches
          .map(match => match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1'))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (extractedText.length > 50) {
          return extractedText;
        }
      }
      
      return `[Word Document: ${file.name}]\n\nUnable to extract text automatically. Please copy and paste the text content of your document here for analysis.`;
    } catch (error) {
      console.error('DOCX processing error:', error);
      return `[Word Document: ${file.name}]\n\nError processing document. Please copy and paste the text content directly.`;
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // For PDF files, we'll provide instructions since browser-based PDF parsing is complex
      return `[PDF Document: ${file.name}]\n\nPDF text extraction requires additional setup. For best results, please:\n\n1. Open your PDF in a PDF viewer\n2. Select all text (Ctrl+A or Cmd+A)\n3. Copy the text (Ctrl+C or Cmd+C)\n4. Paste it in the text area below\n\nThis ensures accurate text extraction for analysis.`;
    } catch (error) {
      console.error('PDF processing error:', error);
      return `[PDF Document: ${file.name}]\n\nUnable to process PDF. Please copy and paste the text content directly.`;
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setUploadedFileName(file.name);
    setAnalysisStatus('Processing file...');
    
    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        text = await extractTextFromPdf(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        text = await extractTextFromDocx(file);
      } else if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        // Fallback for other text-based files
        text = await file.text();
      }
      
      setTextInput(text);
      setAppState(prev => ({ ...prev, originalText: text }));
      setAnalysisStatus('');
    } catch (error) {
      console.error('Error processing file:', error);
      setError(`Error processing ${file.name}. Please try pasting the text directly.`);
      setAnalysisStatus('');
    }
  }, [setAppState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/*': ['.txt', '.md'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection) {
        if (rejection.errors.some(e => e.code === 'file-too-large')) {
          setError('File is too large. Please use files smaller than 10MB.');
        } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
          setError('Invalid file type. Please use PDF, DOCX, or TXT files.');
        } else {
          setError('File upload failed. Please try again.');
        }
      }
    }
  });

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
      const result = await backend.legal.analyze({ text });
      setAppState(prev => ({
        ...prev,
        analysisResult: result,
        isAnalyzing: false
      }));
      setAnalysisStatus('');
      onAnalysisComplete();
    } catch (error) {
      console.error('Analysis failed:', error);
      setError(
        error instanceof Error 
          ? `Analysis failed: ${error.message}` 
          : 'Analysis failed. Please try again or check your internet connection.'
      );
      setAppState(prev => ({ ...prev, isAnalyzing: false }));
      setAnalysisStatus('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Upload Your Legal Document</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Upload a PDF, Word document, or paste text to get clear explanations, identify confusing clauses, 
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

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <UploadIcon className="w-5 h-5" />
              <span>Upload Document</span>
            </CardTitle>
            <CardDescription>
              Drag and drop or click to upload PDF, DOCX, or TXT files (max 10MB)
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
                    Supports PDF, DOCX, and TXT files (max 10MB)
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
            className="min-h-[200px] bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
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
                Your documents are processed securely and are not stored on our servers. 
                However, always review sensitive documents before uploading and consider 
                removing confidential information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-950/30 border-blue-800/30">
        <CardContent className="p-4">
          <div className="text-blue-100 text-sm">
            <p className="font-medium mb-2">📄 File Upload Tips</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>PDF files:</strong> For best results, copy and paste text directly from your PDF viewer</li>
              <li>• <strong>Word files:</strong> Basic text extraction is supported, but manual copy-paste is more reliable</li>
              <li>• <strong>Text files:</strong> Fully supported with automatic processing</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
