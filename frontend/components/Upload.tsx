import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoginPrompt } from './LoginPrompt';
import backend from '~backend/client';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';
import type { AppState } from '../App';

interface UploadProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onAnalysisComplete: () => void;
  onShowAuth: () => void;
}

export function Upload({ appState, setAppState, onAnalysisComplete, onShowAuth }: UploadProps) {
  const [textInput, setTextInput] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState<any>(null);
  const { user } = useAuth();
  const { saveDocument } = useDocuments();

  const extractTextFromDocx = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to string for processing
      const decoder = new TextDecoder('utf-8', { fatal: false });
      let content = '';
      
      // Try to decode in chunks to handle encoding issues
      try {
        content = decoder.decode(uint8Array);
      } catch (e) {
        // Fallback: try latin1 encoding
        const latin1Decoder = new TextDecoder('latin1');
        content = latin1Decoder.decode(uint8Array);
      }
      
      // Extract text from DOCX XML structure
      // Look for document.xml content and w:t tags
      const textMatches = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      const paragraphMatches = content.match(/<w:p[^>]*>.*?<\/w:p>/gs);
      
      let extractedText = '';
      
      if (textMatches && textMatches.length > 0) {
        // Extract text from w:t tags
        extractedText = textMatches
          .map(match => {
            // Remove XML tags and decode entities
            const text = match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1');
            return text
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'");
          })
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // If no text found with w:t tags, try alternative extraction
      if (!extractedText || extractedText.length < 50) {
        // Look for any text content between XML tags
        const allTextMatches = content.match(/>([^<]+)</g);
        if (allTextMatches) {
          const candidateText = allTextMatches
            .map(match => match.replace(/^>([^<]+)<$/, '$1'))
            .filter(text => text.trim().length > 2 && !/^[0-9\s\-_=]+$/.test(text))
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (candidateText.length > extractedText.length) {
            extractedText = candidateText;
          }
        }
      }
      
      // Final validation
      if (extractedText && extractedText.length >= 50) {
        return extractedText;
      }
      
      // If extraction failed, provide helpful instructions
      return `[Word Document: ${file.name}]

Unable to automatically extract text from this DOCX file. This can happen with:
- Password-protected documents
- Documents with complex formatting
- Corrupted files
- Newer DOCX formats

For best results, please:
1. Open your document in Microsoft Word or Google Docs
2. Select all text (Ctrl+A or Cmd+A)
3. Copy the text (Ctrl+C or Cmd+C)
4. Paste it in the text area below

This ensures accurate text extraction for analysis.`;
      
    } catch (error) {
      console.error('DOCX processing error:', error);
      return `[Word Document: ${file.name}]

Error processing DOCX file: ${error instanceof Error ? error.message : 'Unknown error'}

Please try:
1. Opening the document in Microsoft Word
2. Saving it as a .txt file
3. Uploading the .txt file instead

Or copy and paste the text content directly into the text area below.`;
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      // For PDF files, we'll provide instructions since browser-based PDF parsing is complex
      return `[PDF Document: ${file.name}]

PDF text extraction requires additional setup. For best results, please:

1. Open your PDF in a PDF viewer (Adobe Reader, Chrome, etc.)
2. Select all text (Ctrl+A or Cmd+A)
3. Copy the text (Ctrl+C or Cmd+C)
4. Paste it in the text area below

This ensures accurate text extraction for analysis.

Note: Some PDFs (scanned documents, images) may not contain selectable text. In those cases, you may need to use OCR software or manually type the content.`;
    } catch (error) {
      console.error('PDF processing error:', error);
      return `[PDF Document: ${file.name}]

Unable to process PDF. Please copy and paste the text content directly.`;
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
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
        text = await extractTextFromDocx(file);
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        text = await file.text();
      } else if (file.type.startsWith('text/') || file.name.toLowerCase().match(/\.(txt|md|rtf)$/)) {
        // Handle other text-based files
        text = await file.text();
      } else {
        // Fallback for unknown file types
        try {
          text = await file.text();
          if (!text || text.length < 10) {
            throw new Error('File appears to be binary or empty');
          }
        } catch (e) {
          text = `[${file.name}]

Unsupported file type: ${file.type || 'unknown'}

Supported formats:
- PDF files (.pdf)
- Word documents (.docx)
- Text files (.txt, .md)

Please convert your document to one of these formats or copy and paste the text directly into the text area below.`;
        }
      }
      
      setTextInput(text);
      setAppState(prev => ({ ...prev, originalText: text }));
      setAnalysisStatus('');
      
      // If the extracted text looks like it failed, show a warning
      if (text.startsWith('[') && text.includes('Unable to')) {
        setError('Automatic text extraction may have failed. Please review the extracted content and paste the text manually if needed.');
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setError(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}. Please try pasting the text directly.`);
      setAnalysisStatus('');
    }
  }, [setAppState]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
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

    // Check if the text looks like a failed extraction
    if (text.startsWith('[') && text.includes('Unable to')) {
      setError('It looks like the text extraction failed. Please copy and paste your document text manually.');
      return;
    }

    setError(null);
    setAppState(prev => ({ ...prev, isAnalyzing: true, originalText: text }));
    setAnalysisStatus('Analyzing document with AI...');

    try {
      const result = await backend.legal.analyze({ text });
      
      // If user is not logged in, show login prompt
      if (!user) {
        setPendingAnalysis({ text, result });
        setShowLoginPrompt(true);
        setAppState(prev => ({ ...prev, isAnalyzing: false }));
        setAnalysisStatus('');
        return;
      }

      // Save document if user is logged in
      const title = uploadedFileName || `Document ${new Date().toLocaleDateString()}`;
      await saveDocument(
        title,
        text,
        result.simplifiedSections,
        result.confusingClauses,
        result.suggestedQuestions
      );

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

  const handleLoginPromptLogin = () => {
    setShowLoginPrompt(false);
    onShowAuth();
  };

  const handleLoginPromptContinue = () => {
    if (pendingAnalysis) {
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
                  Your documents are processed securely and are not stored on our servers unless you sign in. 
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
                <li>• <strong>Word files (.docx):</strong> Automatic text extraction is supported, but manual copy-paste is more reliable for complex documents</li>
                <li>• <strong>Text files:</strong> Fully supported with automatic processing</li>
                <li>• <strong>Scanned documents:</strong> May require OCR software or manual typing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
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
