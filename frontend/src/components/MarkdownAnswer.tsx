import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownAnswerProps {
  content: string;
  onCitationClick: (chunkId: string) => void;
  citationMap: Record<number, string>; // Maps source index (1-based) to chunkId
}

export const MarkdownAnswer: React.FC<MarkdownAnswerProps> = ({
  content,
  onCitationClick,
  citationMap,
}) => {
  // Replace [Source X] with custom token for markdown rendering
  const preprocessContent = (text: string) => {
    // Replace [Source 1], [Source 2], etc. with markdown links: [Source 1](#source-1)
    return text.replace(/\[Source\s*(\d+)\]/gi, (match, p1) => {
      const idx = parseInt(p1, 10);
      return `[${match}](#source-${idx})`;
    });
  };

  const processed = preprocessContent(content);

  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('#source-')) {
              const idxStr = href.replace('#source-', '');
              const sourceIdx = parseInt(idxStr, 10);
              const chunkId = citationMap[sourceIdx];
              return (
                <button
                  type="button"
                  className="citation-pill"
                  onClick={() => {
                    if (chunkId) onCitationClick(chunkId);
                  }}
                  title={`Jump to Source ${sourceIdx} snippet`}
                >
                  {children}
                </button>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>
                {children}
              </a>
            );
          },
          h1: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1rem 0 0.5rem', color: '#f8fafc' }}>{children}</h3>,
          h2: ({ children }) => <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0.85rem 0 0.4rem', color: '#f8fafc' }}>{children}</h4>,
          h3: ({ children }) => <h5 style={{ fontSize: '0.92rem', fontWeight: 600, margin: '0.75rem 0 0.35rem', color: '#cbd5e1' }}>{children}</h5>,
          p: ({ children }) => <p style={{ marginBottom: '0.75rem', lineHeight: 1.7, color: '#e2e8f0' }}>{children}</p>,
          ul: ({ children }) => <ul style={{ paddingLeft: '1.4rem', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: '1.4rem', marginBottom: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>{children}</ol>,
          li: ({ children }) => <li style={{ lineHeight: 1.6, color: '#cbd5e1' }}>{children}</li>,
          strong: ({ children }) => <strong style={{ color: '#f8fafc', fontWeight: 700 }}>{children}</strong>,
          code: ({ children }) => (
            <code style={{ background: 'rgba(0,0,0,0.35)', color: '#93c5fa', padding: '0.15rem 0.4rem', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>
              {children}
            </code>
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
};
