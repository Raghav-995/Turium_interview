import React from 'react';
import { X, Cpu, Database, Scissors, ShieldAlert, Zap, Server } from 'lucide-react';


interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon" style={{ width: 32, height: 32 }}>
              <Cpu size={18} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>System Design & Architecture</h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                End-to-end production RAG pipeline, tradeoffs, and scaling analysis
              </p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Visual Data Flow Diagram */}
          <div className="diagram-card">
            <h3 className="section-title">
              <Zap size={16} color="#3b82f6" />
              Interactive Pipeline Data Flow
            </h3>
            <div className="pipeline-flow">
              <div className="pipeline-step">
                <span className="step-tag">Step 1: Ingestion</span>
                <strong>Notes / URLs / PDFs</strong>
                <p>trafilatura body extraction, metadata & clean text</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="pipeline-step">
                <span className="step-tag">Step 2: Chunking</span>
                <strong>Boundary-Aware</strong>
                <p>500-char target, 100-char overlap, sentence snapping</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="pipeline-step">
                <span className="step-tag">Step 3: Embeddings</span>
                <strong>Gemini / Vector Store</strong>
                <p>3072-dim embeddings stored in SQLite + NumPy index</p>
              </div>
              <div className="flow-arrow">→</div>
              <div className="pipeline-step">
                <span className="step-tag">Step 4: RAG QA</span>
                <strong>Grounded Synthesis</strong>
                <p>Top-k cosine search, anti-hallucination prompt, citations</p>
              </div>
            </div>
          </div>

          <div className="arch-grid">
            {/* Box 1: Chunking Strategy */}
            <div className="arch-card">
              <h4 className="arch-card-title">
                <Scissors size={15} color="#8b5cf6" />
                1. Intentional Chunking Strategy
              </h4>
              <p className="arch-desc">
                <strong>Why not naive character slicing?</strong> Fixed $N$-char slicing cuts words in half and severs sentence clauses, destroying semantic vectors.
              </p>
              <ul className="arch-list">
                <li>Hierarchical splitting: Paragraphs (<code>\n\n</code>) → Sentences (<code>.!?</code>) → Words.</li>
                <li><strong>100-character sliding overlap</strong> preserves cross-boundary continuity so facts straddling two chunks remain complete.</li>
              </ul>
            </div>

            {/* Box 2: Vector Store Choice */}
            <div className="arch-card">
              <h4 className="arch-card-title">
                <Database size={15} color="#10b981" />
                2. Vector Store Rationale
              </h4>
              <p className="arch-desc">
                <strong>In-Process SQLite + NumPy Cosine Similarity:</strong>
              </p>
              <ul className="arch-list">
                <li><strong>Zero Infrastructure Bloat:</strong> No external vector database daemon required.</li>
                <li><strong>ACID Reliability:</strong> Documents and vectors share the same transactional database; cascading deletes work out of the box.</li>
                <li><strong>Performance:</strong> Vectorized matrix math calculates 10,000+ chunks in &lt;10ms.</li>
              </ul>
            </div>

            {/* Box 3: Anti-Hallucination & Citations */}
            <div className="arch-card">
              <h4 className="arch-card-title">
                <ShieldAlert size={15} color="#f59e0b" />
                3. Grounded Anti-Hallucination Guardrails
              </h4>
              <p className="arch-desc">
                Strict system prompt enforces that the LLM answers <em>only</em> using retrieved snippets and explicitly flags when knowledge is missing.
              </p>
              <ul className="arch-list">
                <li>Every assertion requires explicit <code>[Source N]</code> citation tags.</li>
                <li>Frontend parses tags into interactive clickable pills linked to snippets.</li>
              </ul>
            </div>

            {/* Box 4: What Breaks at Scale */}
            <div className="arch-card">
              <h4 className="arch-card-title">
                <Server size={15} color="#f43f5e" />
                4. What Breaks at 100k+ Scale & Roadmap
              </h4>
              <p className="arch-desc">
                <strong>Production Architectural Evolution:</strong>
              </p>
              <ul className="arch-list">
                <li><strong>Scraping Latency:</strong> Move to async worker queues (Celery/ARQ + Redis) returning <code>202 Accepted</code> with WebSockets.</li>
                <li><strong>Vector DB:</strong> Transition SQLite to PostgreSQL <code>pgvector</code> with HNSW indexing for $O(\log N)$ search.</li>
                <li><strong>Cost & Rate Limits:</strong> Add semantic caching (Redis) for frequent questions.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={onClose}>
            Got it, return to App
          </button>
        </div>
      </div>
    </div>
  );
};
