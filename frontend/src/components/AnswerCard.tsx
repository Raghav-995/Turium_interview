import React, { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import { MarkdownAnswer } from './MarkdownAnswer';
import type { QueryResponse } from '../types';

interface AnswerCardProps {
  result: QueryResponse;
  onCitationClick: (chunkId: string) => void;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  result,
  onCitationClick,
}) => {

  const [copied, setCopied] = useState(false);

  const handleCopyAnswer = () => {
    navigator.clipboard.writeText(result.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Build mapping from 1-based index to chunk_id
  const citationMap: Record<number, string> = {};
  result.citations.forEach((c, idx) => {
    citationMap[idx + 1] = c.chunk_id;
  });

  return (
    <div className="answer-box">
      <div className="answer-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={18} color="#3b82f6" />
          <strong style={{ fontSize: '1rem', color: '#f8fafc' }}>Grounded Answer</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Model: <code style={{ color: '#93c5fa', fontWeight: 600 }}>{result.llm_provider}</code>
          </span>
          <button
            type="button"
            className="btn-copy"
            onClick={handleCopyAnswer}
            title="Copy answer to clipboard"
          >
            {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <MarkdownAnswer
        content={result.answer}
        onCitationClick={onCitationClick}
        citationMap={citationMap}
      />
    </div>
  );
};
