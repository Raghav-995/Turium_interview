import React, { useEffect, useRef } from 'react';
import { Sparkles, User, RotateCcw, ArrowRight, Lightbulb, Database, ShieldCheck, Compass, Loader2, AlertCircle } from 'lucide-react';
import { AnswerCard } from './AnswerCard';
import type { QueryResponse } from '../types';

export interface ChatMessage {
  id: string;
  question: string;
  result?: QueryResponse;
  isLoading?: boolean;
  error?: string;
  timestamp: string;
}

interface ChatConversationProps {
  messages: ChatMessage[];
  hasItems: boolean;
  onSelectPrompt: (prompt: string) => void;
  onCitationClick: (chunkId: string) => void;
  onClearHistory: () => void;
}

export const ChatConversation: React.FC<ChatConversationProps> = ({
  messages,
  hasItems,
  onSelectPrompt,
  onCitationClick,
  onClearHistory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message or update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const starterPrompts = [
    {
      title: 'FastAPI Features',
      prompt: 'What is FastAPI and what are its features?',
      icon: '⚡',
    },
    {
      title: 'Machine Learning',
      prompt: 'Explain the fundamentals of machine learning.',
      icon: '🧠',
    },
    {
      title: "Raghav's Background",
      prompt: 'Who is Raghav?',
      icon: '👤',
    },
    {
      title: 'Google Login Guide',
      prompt: 'What instructions does the Google login page provide?',
      icon: '🔍',
    },
  ];

  return (
    <div className="chat-conversation-area" ref={scrollRef}>
      {messages.length === 0 ? (
        <div className="chat-welcome-container">
          <div className="welcome-avatar-orb">
            <Sparkles size={28} color="#ffffff" />
          </div>

          <h2 className="welcome-title">AI Knowledge Assistant</h2>
          <p className="welcome-subtitle">
            Ask questions across your ingested notes, scraped web pages, and uploaded documents.
            Answers are grounded in your content using cosine vector similarity with verifiable citations.
          </p>

          <div className="welcome-feature-pills">
            <span className="feature-pill">
              <Database size={12} color="#60a5fa" />
              In-Process Vector Store
            </span>
            <span className="feature-pill">
              <ShieldCheck size={12} color="#10b981" />
              Grounded Gemini 3.5 Flash
            </span>
            <span className="feature-pill">
              <Compass size={12} color="#a78bfa" />
              Clickable Source Citations
            </span>
          </div>

          {!hasItems ? (
            <div className="welcome-empty-inbox-alert">
              <AlertCircle size={16} color="#fbbf24" />
              <span>
                Your knowledge inbox is currently empty. Add notes, paste URLs, or upload PDF files using the left panel to begin.
              </span>
            </div>
          ) : (
            <div className="welcome-prompts-section">
              <div className="prompts-heading">
                <Lightbulb size={13} color="#f59e0b" />
                <span>Suggested Questions to Try</span>
              </div>
              <div className="welcome-prompts-grid">
                {starterPrompts.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    className="prompt-card"
                    onClick={() => onSelectPrompt(item.prompt)}
                  >
                    <div className="prompt-card-top">
                      <span className="prompt-card-emoji">{item.icon}</span>
                      <strong className="prompt-card-title">{item.title}</strong>
                      <ArrowRight size={13} className="prompt-card-arrow" />
                    </div>
                    <p className="prompt-card-query">{item.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="chat-stream-container">
          <div className="chat-stream-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={16} color="#3b82f6" />
              <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>Grounded Conversation</strong>
              <span className="badge-count">
                {messages.length} {messages.length === 1 ? 'query' : 'queries'}
              </span>
            </div>
            <button
              type="button"
              className="btn-clear-chat"
              onClick={onClearHistory}
              title="Reset conversation and clear chat stream"
            >
              <RotateCcw size={12} />
              <span>Clear Chat</span>
            </button>
          </div>

          <div className="messages-list">
            {messages.map((msg) => (
              <div key={msg.id} className="chat-exchange">
                {/* User Message Bubble */}
                <div className="user-message-bubble">
                  <div className="message-header-user">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div className="user-avatar-badge">
                        <User size={12} color="#ffffff" />
                      </div>
                      <span className="message-sender-user">You</span>
                    </div>
                    <span className="message-timestamp">{msg.timestamp}</span>
                  </div>
                  <div className="user-message-text">{msg.question}</div>
                </div>

                {/* AI Assistant Response */}
                <div className="assistant-response-wrapper">
                  {msg.isLoading && (
                    <div className="assistant-loading-card">
                      <div className="assistant-loading-header">
                        <div className="ai-avatar-badge pulsing">
                          <Sparkles size={14} color="#ffffff" />
                        </div>
                        <span className="ai-label">AI Knowledge Inbox</span>
                        <span className="ai-model-tag">Gemini 3.5 Flash</span>
                      </div>
                      <div className="assistant-loading-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <Loader2 size={16} className="animate-spin" color="#3b82f6" />
                          <span style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                            Searching vector space & synthesizing grounded answer...
                          </span>
                        </div>
                        <div className="shimmer-bar"></div>
                      </div>
                    </div>
                  )}

                  {msg.error && (
                    <div className="assistant-error-card">
                      <AlertCircle size={16} color="#f43f5e" />
                      <span>{msg.error}</span>
                    </div>
                  )}

                  {msg.result && (
                    <div className="assistant-result-container">
                      <AnswerCard
                        result={msg.result}
                        onCitationClick={onCitationClick}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
