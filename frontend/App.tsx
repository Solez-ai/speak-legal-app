import React, { useState } from 'react';
import { Upload } from './components/Upload';
import { SimplifiedView } from './components/SimplifiedView';
import { ConfusingClauses } from './components/ConfusingClauses';
import { SuggestedQuestions } from './components/SuggestedQuestions';
import { Downloads } from './components/Downloads';
import { About } from './components/About';
import { Navigation } from './components/Navigation';
import type { AnalyzeDocumentResponse } from '~backend/legal/analyze';

export type Tab = 'upload' | 'simplified' | 'clauses' | 'questions' | 'downloads' | 'about';

export interface AppState {
  originalText: string;
  analysisResult: AnalyzeDocumentResponse | null;
  isAnalyzing: boolean;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [appState, setAppState] = useState<AppState>({
    originalText: '',
    analysisResult: null,
    isAnalyzing: false
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
              <h1 className="text-xl font-bold text-white">Speak Legal</h1>
            </div>
            <p className="text-sm text-gray-400 hidden sm:block">
              Understand Law Like a Human
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="mt-6">
          {activeTab === 'upload' && (
            <Upload appState={appState} setAppState={setAppState} onAnalysisComplete={() => setActiveTab('simplified')} />
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
      </div>
    </div>
  );
}
