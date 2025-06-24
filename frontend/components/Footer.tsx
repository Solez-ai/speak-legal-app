import React from 'react';
import { TextHoverEffect } from '@/components/ui/hover-text-effect';

export function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-950 to-blue-950 border-t border-gray-800 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cool Hover Effect Section */}
        <div className="h-32 flex items-center justify-center mb-8">
          <TextHoverEffect text="Speak Legal" />
        </div>
        
        {/* Made By Section with Glow Effect */}
        <div className="text-center">
          <p className="text-lg font-medium text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text animate-pulse drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]">
            Made By Samin Yeasar
          </p>
        </div>
        
        {/* Additional Footer Content */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">About Speak Legal</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                AI-powered legal document analysis that transforms complex legal jargon into clear, 
                understandable language for everyone.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>• Document Simplification</li>
                <li>• Confusing Clause Detection</li>
                <li>• AI-Generated Questions</li>
                <li>• Legal Dictionary</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Legal Notice</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                This tool provides general information only and does not constitute legal advice. 
                Always consult with a qualified attorney for legal matters.
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Speak Legal. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
