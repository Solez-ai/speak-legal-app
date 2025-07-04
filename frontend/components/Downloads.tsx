import React from 'react';
import { Download, FileText, AlertTriangle, HelpCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppState } from '../App';

interface DownloadsProps {
  appState: AppState;
}

export function Downloads({ appState }: DownloadsProps) {
  if (!appState.analysisResult) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analysis available. Please upload and analyze a document first.</p>
      </div>
    );
  }

  const { simplifiedSections, confusingClauses, suggestedQuestions } = appState.analysisResult;

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateSimplifiedContent = () => {
    return simplifiedSections
      .map((section, index) => 
        `SECTION ${index + 1}\n\nOriginal:\n${section.originalText}\n\nSimplified:\n${section.simplifiedText}\n\n${'='.repeat(50)}\n\n`
      )
      .join('');
  };

  const generateClausesContent = () => {
    if (confusingClauses.length === 0) {
      return 'No confusing clauses were identified in this document.';
    }
    
    return confusingClauses
      .map((clause, index) => 
        `CONFUSING CLAUSE ${index + 1} (${clause.riskLevel.toUpperCase()} RISK)\n\nClause:\n${clause.clause}\n\nWhy it's confusing:\n${clause.whyConfusing}\n\n${clause.suggestedRewrite ? `Suggested rewrite:\n${clause.suggestedRewrite}\n\n` : ''}${'='.repeat(50)}\n\n`
      )
      .join('');
  };

  const generateQuestionsContent = () => {
    if (suggestedQuestions.length === 0) {
      return 'No specific questions were generated for this document.';
    }
    
    return suggestedQuestions
      .map((question, index) => 
        `${index + 1}. ${question.question}\n   Context: ${question.context}\n   Related to: ${question.relatedClause.substring(0, 100)}...\n\n`
      )
      .join('');
  };

  const generateFullReport = () => {
    const timestamp = new Date().toLocaleString();
    return `SPEAK LEGAL - DOCUMENT ANALYSIS REPORT
Generated: ${timestamp}

${'='.repeat(60)}
SIMPLIFIED DOCUMENT
${'='.repeat(60)}

${generateSimplifiedContent()}

${'='.repeat(60)}
CONFUSING CLAUSES
${'='.repeat(60)}

${generateClausesContent()}

${'='.repeat(60)}
SUGGESTED QUESTIONS FOR YOUR LAWYER
${'='.repeat(60)}

${generateQuestionsContent()}

---
This report was generated by Speak Legal AI.
Always consult with a qualified attorney for legal advice.
`;
  };

  const downloadOptions = [
    {
      id: 'simplified',
      title: 'Simplified Version',
      description: 'Plain English explanations of your document',
      icon: FileText,
      filename: 'simplified_document.txt',
      content: generateSimplifiedContent(),
      color: 'text-green-400',
    },
    {
      id: 'clauses',
      title: 'Confusing Clauses',
      description: 'Problematic or unclear sections identified',
      icon: AlertTriangle,
      filename: 'confusing_clauses.txt',
      content: generateClausesContent(),
      color: 'text-yellow-400',
    },
    {
      id: 'questions',
      title: 'AI Questions',
      description: 'Suggested questions to ask your lawyer',
      icon: HelpCircle,
      filename: 'lawyer_questions.txt',
      content: generateQuestionsContent(),
      color: 'text-blue-400',
    },
    {
      id: 'full',
      title: 'Complete Report',
      description: 'All analysis results in one comprehensive file',
      icon: Package,
      filename: 'SpeakLegal_Complete_Report.txt',
      content: generateFullReport(),
      color: 'text-purple-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Download Reports</h2>
        <p className="text-gray-400">
          Save your analysis results for future reference or sharing with your lawyer
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {downloadOptions.map((option) => {
          const Icon = option.icon;
          
          return (
            <Card key={option.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Icon className={`w-6 h-6 ${option.color}`} />
                  <span className="text-white">{option.title}</span>
                </CardTitle>
                <CardDescription>{option.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => downloadFile(option.content, option.filename)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download {option.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-yellow-400 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Important Disclaimer</span>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed">
            These AI-generated analyses are for informational purposes only and do not constitute legal advice. 
            Always consult with a qualified attorney before making any legal decisions. The AI may miss important 
            nuances or make errors in interpretation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
