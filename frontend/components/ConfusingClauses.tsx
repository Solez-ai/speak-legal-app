import React from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AppState } from '../App';

interface ConfusingClausesProps {
  appState: AppState;
}

export function ConfusingClauses({ appState }: ConfusingClausesProps) {
  if (!appState.analysisResult) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analysis available. Please upload and analyze a document first.</p>
      </div>
    );
  }

  const { confusingClauses } = appState.analysisResult;

  if (confusingClauses.length === 0) {
    return (
      <div className="text-center py-12">
        <Info className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Great News!</h3>
        <p className="text-gray-400">No particularly confusing or problematic clauses were found in this document.</p>
      </div>
    );
  }

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'border-red-500 text-red-400';
      case 'medium':
        return 'border-yellow-500 text-yellow-400';
      default:
        return 'border-blue-500 text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Confusing Clauses</h2>
        <p className="text-gray-400">
          Clauses that may be vague, risky, or difficult to understand
        </p>
      </div>

      <div className="space-y-4">
        {confusingClauses.map((clause, index) => (
          <Card key={index} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                {getRiskIcon(clause.riskLevel)}
                <span className="text-white">Clause {index + 1}</span>
                <Badge variant="outline" className={getRiskColor(clause.riskLevel)}>
                  {clause.riskLevel.toUpperCase()} RISK
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-gray-400">
                  Section {clause.sectionIndex + 1}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-300 mb-2">Original Clause</h4>
                <div className="bg-red-950/30 border border-red-800/30 rounded-lg p-4 text-red-100 text-sm leading-relaxed">
                  {clause.clause}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-300 mb-2">Why This Is Confusing</h4>
                <div className="bg-gray-800 rounded-lg p-4 text-gray-300 text-sm leading-relaxed">
                  {clause.whyConfusing}
                </div>
              </div>

              {clause.suggestedRewrite && (
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Suggested Clearer Version</h4>
                  <div className="bg-green-950/30 border border-green-800/30 rounded-lg p-4 text-green-100 text-sm leading-relaxed">
                    {clause.suggestedRewrite}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
