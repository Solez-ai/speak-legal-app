import React from 'react';
import { FileText, AlertTriangle, HelpCircle, Download, Info, Book } from 'lucide-react';
import type { Tab } from '../App';

interface NavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: 'upload' as Tab, label: 'Analyze Document', icon: FileText },
  { id: 'simplified' as Tab, label: 'Simplified View', icon: FileText },
  { id: 'clauses' as Tab, label: 'Confusing Clauses', icon: AlertTriangle },
  { id: 'questions' as Tab, label: 'AI Questions', icon: HelpCircle },
  { id: 'downloads' as Tab, label: 'Downloads', icon: Download },
  { id: 'dictionary' as Tab, label: 'Legal Dictionary', icon: Book },
  { id: 'about' as Tab, label: 'About', icon: Info },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="border-b border-gray-800">
      <div className="flex space-x-8 overflow-x-auto scroll-area">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
