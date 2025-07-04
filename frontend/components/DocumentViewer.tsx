import React, { useState } from 'react';
import { ArrowLeft, Download, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimplifiedView } from './SimplifiedView';
import { ConfusingClauses } from './ConfusingClauses';
import { SuggestedQuestions } from './SuggestedQuestions';
import type { Document } from '../lib/supabase';
import type { AppState } from '../App';

interface DocumentViewerProps {
  document: Document;
  onBack: () => void;
}

export function DocumentViewer({ document, onBack }: DocumentViewerProps) {
  const [activeTab, setActiveTab] = useState('simplified');

  // Convert document to AppState format for existing components
  const appState: AppState = {
    originalText: document.raw_input,
    analysisResult: {
      simplifiedSections: document.simplified_sections,
      confusingClauses: document.confusing_clauses,
      suggestedQuestions: document.suggested_questions,
    },
    isAnalyzing: false,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadDocumentReport = () => {
    const content = `SPEAK LEGAL - DOCUMENT ANALYSIS
Title: ${document.title}
Date: ${formatDate(document.created_at)}

${'='.repeat(60)}
ORIGINAL DOCUMENT
${'='.repeat(60)}

${document.raw_input}

${'='.repeat(60)}
SIMPLIFIED SECTIONS
${'='.repeat(60)}

${document.simplified_sections.map((section, index) => 
  `SECTION ${index + 1}\n\nOriginal:\n${section.originalText}\n\nSimplified:\n${section.simplifiedText}\n\n${'='.repeat(50)}\n\n`
).join('')}

${'='.repeat(60)}
CONFUSING CLAUSES
${'='.repeat(60)}

${document.confusing_clauses.length === 0 ? 'No confusing clauses identified.' : 
  document.confusing_clauses.map((clause, index) => 
    `CLAUSE ${index + 1} (${clause.riskLevel.toUpperCase()} RISK)\n\nClause:\n${clause.clause}\n\nWhy confusing:\n${clause.whyConfusing}\n\n${clause.suggestedRewrite ? `Suggested rewrite:\n${clause.suggestedRewrite}\n\n` : ''}${'='.repeat(50)}\n\n`
  ).join('')}

${'='.repeat(60)}
SUGGESTED QUESTIONS
${'='.repeat(60)}

${document.suggested_questions.length === 0 ? 'No specific questions generated.' :
  document.suggested_questions.map((question, index) => 
    `${index + 1}. ${question.question}\n   Context: ${question.context}\n   Related to: ${question.relatedClause.substring(0, 100)}...\n\n`
  ).join('')}

---
Generated by Speak Legal AI
Always consult with a qualified attorney for legal advice.
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${document.title.replace(/[^a-z0-9]/gi, '_')}_analysis.txt`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{document.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400 mt-1">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(document.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FileText className="w-4 h-4" />
                <span>{document.raw_input.length} characters</span>
              </div>
            </div>
          </div>
        </div>
        <Button
          onClick={downloadDocumentReport}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{document.simplified_sections.length}</div>
            <div className="text-sm text-gray-400">Sections Simplified</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{document.confusing_clauses.length}</div>
            <div className="text-sm text-gray-400">Clauses Flagged</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{document.suggested_questions.length}</div>
            <div className="text-sm text-gray-400">Questions Generated</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-800 px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="simplified" className="data-[state=active]:bg-purple-600">
                  Simplified View
                </TabsTrigger>
                <TabsTrigger value="clauses" className="data-[state=active]:bg-purple-600">
                  Confusing Clauses
                  {document.confusing_clauses.length > 0 && (
                    <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-400">
                      {document.confusing_clauses.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="questions" className="data-[state=active]:bg-purple-600">
                  AI Questions
                  {document.suggested_questions.length > 0 && (
                    <Badge variant="outline" className="ml-2 border-green-500 text-green-400">
                      {document.suggested_questions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="simplified" className="mt-0">
                <SimplifiedView appState={appState} />
              </TabsContent>
              <TabsContent value="clauses" className="mt-0">
                <ConfusingClauses appState={appState} />
              </TabsContent>
              <TabsContent value="questions" className="mt-0">
                <SuggestedQuestions appState={appState} />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
