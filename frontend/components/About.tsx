import React from 'react';
import { Brain, Shield, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function About() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced language models analyze your legal documents to identify complex clauses and provide clear explanations.',
    },
    {
      icon: Zap,
      title: 'Instant Results',
      description: 'Get simplified explanations, confusing clause identification, and suggested questions in seconds.',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your documents are processed securely and are not stored or shared. Your privacy is our priority.',
    },
    {
      icon: Users,
      title: 'Human-Friendly',
      description: 'Complex legal jargon is translated into everyday language that anyone can understand.',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">About Speak Legal</h2>
        <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
          Speak Legal is an AI-powered legal assistant that transforms confusing legal documents into clear, 
          everyday language. We help you understand what you're signing before you sign it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          
          return (
            <Card key={index} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Icon className="w-6 h-6 text-purple-400" />
                  <span className="text-white">{feature.title}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-300 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-medium text-white mb-2">Paste Document Text</h4>
              <p className="text-gray-400 text-sm">
                Copy and paste your legal document text directly into the analysis area.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-medium text-white mb-2">AI Analysis</h4>
              <p className="text-gray-400 text-sm">
                Our AI analyzes the document, identifies confusing clauses, and generates explanations.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-medium text-white mb-2">Get Results</h4>
              <p className="text-gray-400 text-sm">
                Review simplified explanations, flagged clauses, and suggested questions for your lawyer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-950/30 border-red-800/30">
        <CardHeader>
          <CardTitle className="text-red-400">Important Legal Disclaimer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-red-100 text-sm leading-relaxed">
            <p>
              <strong>This tool does not provide legal advice.</strong> The AI-generated analyses, explanations, 
              and suggestions are for informational purposes only and should not be relied upon as legal advice.
            </p>
            <p>
              Always consult with a qualified attorney before making any legal decisions. The AI may miss important 
              nuances, make errors in interpretation, or fail to identify all relevant issues in your document.
            </p>
            <p>
              By using this tool, you acknowledge that you understand these limitations and will seek professional 
              legal counsel when needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
