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
          <Inbox size={20} color="#ffffff" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">AI Knowledge Inbox</h1>
          <p className="brand-tagline">Save notes & URLs • Query with grounded RAG</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          onClick={onOpenArchitecture}
          className="btn-outline-glow"
          title="View RAG Architecture, Tradeoffs & Scaling System Design"
        >
          <Cpu size={14} color="#60a5fa" />
          <span className="btn-arch-label">System Design & Tradeoffs</span>
          <span className="btn-arch-short">Design</span>
        </button>

        <div className="status-badge">
          <span className="pulse-dot"></span>
          <Sparkles size={11} className="status-sparkle" />
          <span className="status-text">RAG: {provider.toUpperCase()}</span>
        </div>
      </div>
    </header>
  );
};
