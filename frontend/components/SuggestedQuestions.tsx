import React, { useState } from 'react';
import { HelpCircle, Copy, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import type { AppState } from '../App';

interface SuggestedQuestionsProps {
  appState: AppState;
}

export function SuggestedQuestions({ appState }: SuggestedQuestionsProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');

  if (!appState.analysisResult) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No analysis available. Please upload and analyze a document first.</p>
      </div>
    );
  }

  const { suggestedQuestions } = appState.analysisResult;

  const toggleQuestion = (index: number) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedQuestions(newSelected);
  };

  const addCustomQuestion = () => {
    if (newQuestion.trim()) {
      setCustomQuestions([...customQuestions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const copySelectedQuestions = () => {
    const selected = suggestedQuestions
      .filter((_, index) => selectedQuestions.has(index))
      .map(q => `• ${q.question}`)
      .concat(customQuestions.map(q => `• ${q}`))
      .join('\n');
    
    navigator.clipboard.writeText(selected);
  };

  const copyAllQuestions = () => {
    const all = suggestedQuestions
      .map(q => `• ${q.question}`)
      .concat(customQuestions.map(q => `• ${q}`))
      .join('\n');
    
    navigator.clipboard.writeText(all);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">AI-Suggested Questions</h2>
          <p className="text-gray-400">
            Questions you might want to ask a lawyer about this document
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={copySelectedQuestions}
            disabled={selectedQuestions.size === 0 && customQuestions.length === 0}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Selected
          </Button>
          <Button
            onClick={copyAllQuestions}
            disabled={suggestedQuestions.length === 0 && customQuestions.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All
          </Button>
        </div>
      </div>

      {suggestedQuestions.length === 0 ? (
        <div className="text-center py-12">
          <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Questions Generated</h3>
          <p className="text-gray-400">The AI didn't identify any specific areas that warrant lawyer consultation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestedQuestions.map((question, index) => (
            <Card key={index} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <button
                    onClick={() => toggleQuestion(index)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedQuestions.has(index)
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    {selectedQuestions.has(index) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        {question.context}
                      </Badge>
                    </div>
                    <p className="text-white font-medium">{question.question}</p>
                    <p className="text-sm text-gray-400">
                      Related to: "{question.relatedClause.substring(0, 100)}..."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Plus className="w-5 h-5" />
            <span>Add Your Own Questions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Textarea
              placeholder="Add a question you want to ask your lawyer..."
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
            />
            <Button
              onClick={addCustomQuestion}
              disabled={!newQuestion.trim()}
              className="bg-purple-600 hover:bg-purple-700 shrink-0"
            >
              Add
            </Button>
          </div>
          
          {customQuestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-300">Your Questions:</h4>
              {customQuestions.map((question, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3 text-gray-300">
                  • {question}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
