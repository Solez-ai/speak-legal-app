import React, { useState, useEffect } from 'react';
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
  const { user, loading } = useAuth();

  // Redirect to dashboard if user is logged in and on home page
  useEffect(() => {
    if (!loading && user && currentPage === 'home') {
      setCurrentPage('dashboard');
    }
  }, [user, loading, currentPage]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    setSelectedDocument(null);
    if (page === 'home') {
      setActiveTab('upload');
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setCurrentPage('document-viewer');
  };

  const handleNewDocument = () => {
    setCurrentPage('home');
    setActiveTab('upload');
    setAppState({
      originalText: '',
      analysisResult: null,
      isAnalyzing: false
    });
  };

  const handleAnalysisComplete = () => {
    if (user) {
      // If user is logged in, go to dashboard
      setCurrentPage('dashboard');
    } else {
      // If not logged in, show simplified view
      setActiveTab('simplified');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

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
                  onShowAuth={() => setShowAuthModal(true)}
                />
              )}
              {activeTab === 'simplified' && (
                <SimplifiedView appState={appState} />
              )}
              {activeTab === 'clauses' && (
                <ConfusingClauses appState={appState} />
              )}
              {activeTab === 'questions' && (
                <SuggestedQuestions appState={appState} />
              )}
              {activeTab === 'downloads' && (
                <Downloads appState={appState} />
              )}
              {activeTab === 'about' && (
                <About />
              )}
            </main>
          </>
        )}

        {currentPage === 'dashboard' && (
          <Dashboard 
            onNewDocument={handleNewDocument}
            onViewDocument={handleViewDocument}
          />
        )}

        {currentPage === 'settings' && (
          <Settings onNavigate={handleNavigate} />
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
    </div>
  );
}
