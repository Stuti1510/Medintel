import React, { useState } from 'react';
import { Cpu, Play, Hash, Layers, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { predictTransformer } from '../services/api';
import { TransformerResult } from '../types/clinical';
import { AttentionHeatmap } from '../components/AttentionHeatmap';
import { TokenVisualizer } from '../components/TokenVisualizer';

export const TransformerLabPage: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    "Patient is a 58-year-old male with crushing substernal chest pain radiating to left arm, diaphoresis, and shortness of breath for 3 hours."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TransformerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTokenizeAndInfer = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictTransformer(inputText);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute Transformer forward pass.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Transformer Intelligence Lab</h1>
            <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-ai/10 text-ai border border-ai/20">
              BIOBERT-v1.1
            </span>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Interactive PyTorch Transformer encoder inspection: WordPiece tokenization, position encoding, and self-attention heatmaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded bg-dark-surface border border-dark-strongBorder text-[11px] font-mono-tech text-dark-secondary">
            <span>Vocabulary: 30,522</span> • <span>Heads: 4</span> • <span>Hidden: 256</span>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
        <label className="text-xs font-semibold text-dark-secondary font-mono-tech uppercase block">
          Enter Clinical Sentence or Narrative:
        </label>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or paste medical symptoms here..."
          className="w-full p-3 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none leading-relaxed font-mono-tech"
        />

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputText("Severe stabbing right lower quadrant abdominal pain with rebound tenderness and vomiting for 24 hours.")}
              className="px-2.5 py-1 text-xs rounded bg-dark-deep hover:bg-dark-elevated text-dark-muted hover:text-dark-text border border-dark-border transition-colors"
            >
              Appendicitis Example
            </button>
            <button
              type="button"
              onClick={() => setInputText("Productive cough with rust-colored sputum, high spiking fever, and pleuritic chest pain on inspiration.")}
              className="px-2.5 py-1 text-xs rounded bg-dark-deep hover:bg-dark-elevated text-dark-muted hover:text-dark-text border border-dark-border transition-colors"
            >
              Pneumonia Example
            </button>
          </div>

          <button
            onClick={handleTokenizeAndInfer}
            disabled={loading || !inputText.trim()}
            className="px-5 py-2.5 rounded-button bg-ai hover:bg-ai-hover text-white text-xs font-semibold shadow-md shadow-ai/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Computing Attention & Forward Pass...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Tokenize & Compute Attention</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-button bg-semantic-critical/15 border border-semantic-critical/40 text-semantic-critical text-xs">
          {error}
        </div>
      )}

      {/* Results / Transformer Visualizer */}
      {result && (
        <div className="space-y-6">
          {/* Top Prediction Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
              <span className="text-[10px] font-mono-tech text-dark-muted block">PREDICTED CONDITION</span>
              <p className="text-lg font-bold text-dark-text mt-0.5">{result.predicted_condition}</p>
            </div>
            <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
              <span className="text-[10px] font-mono-tech text-dark-muted block">TRANSFORMER CONFIDENCE</span>
              <p className="text-lg font-bold font-mono-tech text-ai mt-0.5">{result.confidence_percentage}</p>
            </div>
            <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
              <span className="text-[10px] font-mono-tech text-dark-muted block">FORWARD LATENCY</span>
              <p className="text-lg font-bold font-mono-tech text-semantic-success mt-0.5">{result.inference_time_ms}ms</p>
            </div>
            <div className="p-4 rounded-card bg-dark-surface border border-dark-border">
              <span className="text-[10px] font-mono-tech text-dark-muted block">MODEL PARAMETERS</span>
              <p className="text-lg font-bold font-mono-tech text-dark-text mt-0.5">{result.total_parameters?.toLocaleString() || "10,183,188"}</p>
            </div>
          </div>

          {/* Tokens Visualizer */}
          {result.token_details && <TokenVisualizer tokenDetails={result.token_details} />}

          {/* Self-Attention Heatmap */}
          {result.tokens && result.attention_matrix && (
            <AttentionHeatmap
              tokens={result.tokens}
              tokenDetails={result.token_details}
              matrix={result.attention_matrix}
            />
          )}

          {/* Pipeline Architectural Stage Explainer */}
          <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-dark-secondary font-mono-tech">
              BioBERT Forward Flow
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs font-mono-tech">
              <div className="p-2 rounded bg-dark-elevated border border-dark-strongBorder">1. WordPiece Tokenizer</div>
              <div className="p-2 rounded bg-dark-elevated border border-dark-strongBorder">2. Input IDs + Mask</div>
              <div className="p-2 rounded bg-dark-elevated border border-dark-strongBorder">3. Embedding Sum</div>
              <div className="p-2 rounded bg-dark-elevated border border-dark-strongBorder">4. Self-Attention (4 Heads)</div>
              <div className="p-2 rounded bg-dark-elevated border border-dark-strongBorder">5. [CLS] Representation</div>
              <div className="p-2 rounded bg-ai/20 border border-ai text-ai font-bold">6. Softmax Logits</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
