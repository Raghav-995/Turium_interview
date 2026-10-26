import React from 'react';
import { Inbox, Sparkles, Cpu } from 'lucide-react';

interface HeaderProps {
  provider: string;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({ provider, onOpenArchitecture }) => {
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={onOpenArchitecture}
          className="btn-outline-glow"
          title="View RAG Architecture, Tradeoffs & Scaling System Design"
        >
          <Cpu size={14} color="#60a5fa" />
          <span>System Design & Tradeoffs</span>
        </button>

        <div className="status-badge">
          <span className="pulse-dot"></span>
          <Sparkles size={12} />
          <span>RAG Engine: {provider.toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
};
