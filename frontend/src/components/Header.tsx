import React from 'react';
import { Inbox, Sparkles } from 'lucide-react';

interface HeaderProps {
  provider: string;
}

export const Header: React.FC<HeaderProps> = ({ provider }) => {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">
          <Inbox size={22} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">AI Knowledge Inbox</h1>
          <p className="brand-tagline">Save notes & URLs • Query with grounded RAG</p>
        </div>
      </div>
      <div className="status-badge">
        <span className="pulse-dot"></span>
        <Sparkles size={12} />
        <span>RAG Engine: {provider.toUpperCase()}</span>
      </div>
    </header>
  );
};
