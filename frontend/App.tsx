import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Upload } from './components/Upload';
import { SimplifiedView } from './components/SimplifiedView';
import { ConfusingClauses } from './components/ConfusingClauses';
import { SuggestedQuestions } from './components/SuggestedQuestions';
import { Downloads } from './components/Downloads';
import { About } from './components/About';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { DocumentViewer } from './components/DocumentViewer';
import { Navigation } from './components/Navigation';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './hooks/useAuth';
import type { AnalyzeDocumentResponse } from '~backend/legal/analyze';
import type { Document } from './lib/supabase';

export type Tab = 'upload' | 'simplified' | 'clauses' | 'questions' | 'downloads' | 'about';
export type Page = 'home' | 'dashboard' | 'settings' | 'document-viewer';

export interface AppState {
  originalText: string;
  analysisResult: AnalyzeDocumentResponse | null;
  isAnalyzing: boolean;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [appState, setAppState] = useState<AppState>({
    originalText: '',
    analysisResult: null,
    isAnalyzing: false
  });
  const { user, loading, initializing } = useAuth();

  useEffect(() => {
    // Only run if auth finished loading
    if (initializing || loading) return;

    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken && user && type === 'signup') {
      setCurrentPage('home');
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }
  }, [user, loading, initializing]);

  useEffect(() => {
    const handlePopState = () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken && user) {
        setCurrentPage('home');
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  const handleNavigate = (page: Page) => {
    console.log('🧭 Navigating to page:', page);
    setCurrentPage(page);
    setSelectedDocument(null);
    
    // Always reset to upload tab when going to home
    if (page === 'home') {
      setActiveTab('upload');
      // Reset app state when going to home
      setAppState({
        originalText: '',
        analysisResult: null,
        isAnalyzing: false
      });
    }
  };

  const handleViewDocument = (document: Document) => {
    console.log('👁️ Viewing document:', document.title);
    setSelectedDocument(document);
    setCurrentPage('document-viewer');
  };

  const handleNewDocument = () => {
    console.log('📄 Creating new document - navigating to home');
    setCurrentPage('home');
    setActiveTab('upload');
    setAppState({
      originalText: '',
      analysisResult: null,
      isAnalyzing: false
    });
  };

  const handleAnalysisComplete = () => {
    console.log('✅ Analysis complete - switching to simplified view');
    setActiveTab('simplified');
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  // Show loading screen while auth is loading or initializing to avoid white blank screen
  if (initializing || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Speak Legal...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Current page:', currentPage, 'Active tab:', activeTab);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header onNavigate={handleNavigate} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'home' && (
          <>
            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="mt-6">
              {activeTab === 'upload' && (
                <Upload 
                  appState={appState} 
                  setAppState={setAppState} 
                  onAnalysisComplete={handleAnalysisComplete}
                  onShowAuth={handleShowAuth}
                />
              )}
              {activeTab === 'simplified' && <SimplifiedView appState={appState} />}
              {activeTab === 'clauses' && <ConfusingClauses appState={appState} />}
              {activeTab === 'questions' && <SuggestedQuestions appState={appState} />}
              {activeTab === 'downloads' && <Downloads appState={appState} />}
              {activeTab === 'about' && <About />}
            </main>
          </>
        )}

        {currentPage === 'dashboard' && (
          <Dashboard 
            onNewDocument={handleNewDocument}
            onViewDocument={handleViewDocument}
            onShowAuth={handleShowAuth}
          />
        )}

        {currentPage === 'settings' && (
          <Settings 
            onNavigate={handleNavigate}
            onShowAuth={handleShowAuth}
          />
        )}

        {currentPage === 'document-viewer' && selectedDocument && (
          <DocumentViewer 
            document={selectedDocument}
            onBack={() => setCurrentPage('dashboard')}
          />
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f3f4f6',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f3f4f6',
            },
          },
        }}
      />
    </div>
  );
}
