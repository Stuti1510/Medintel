import React, { useState } from 'react';
import { Sparkles, Brain, Cpu, BookOpen, AlertCircle, BarChart2 } from 'lucide-react';
import { predictClassicalML, predictTransformer } from '../services/api';
import { ClassicalMLResult, TransformerResult } from '../types/clinical';

export const ExplainabilityPage: React.FC = () => {
  const [inputText, setInputText] = useState<string>(
    "Patient presents with crushing substernal chest pain, radiation to left arm and jaw, diaphoresis, and shortness of breath."
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [mlResult, setMLResult] = useState<ClassicalMLResult | null>(null);
  const [transformerResult, setTransformerResult] = useState<TransformerResult | null>(null);

  const handleExplain = async () => {
    setLoading(true);
    try {
      const [ml, trans] = await Promise.all([
        predictClassicalML(inputText),
        predictTransformer(inputText)
      ]);
      setMLResult(ml);
      setTransformerResult(trans);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-ai" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Explainable AI (XAI) & Feature Attribution</h1>
          </div>
          <p className="text-xs text-dark-secondary mt-1">
            Understanding why the models made their predictions: TF-IDF feature weights, token salience, and differential confidence.
          </p>
        </div>
      </div>

      {/* Input Box */}
      <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
        <label className="text-xs font-semibold text-dark-secondary font-mono-tech uppercase block">
          Analyze Clinical Text for Multi-Model Attribution:
        </label>
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full p-3 rounded-button bg-dark-deep border border-dark-border text-xs text-dark-text focus:border-ai focus:outline-none font-mono-tech leading-relaxed"
        />
        <button
          onClick={handleExplain}
          disabled={loading || !inputText.trim()}
          className="px-5 py-2.5 rounded-button bg-ai hover:bg-ai-hover text-white text-xs font-semibold shadow-md shadow-ai/25 transition-all disabled:opacity-50"
        >
          {loading ? "Extracting Salient Features & Attributions..." : "Analyze Attributions"}
        </button>
      </div>

      {/* Attribution Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classical ML Feature Importance */}
        <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
              <Brain className="w-4 h-4 text-semantic-success" />
              Classical ML: Salient Lexical Features (TF-IDF)
            </h3>
            <span className="text-[10px] font-mono-tech text-dark-muted">N-gram Space</span>
          </div>

          <p className="text-xs text-dark-secondary">
            Words in the input clinical text with the highest statistical contribution to the vector space representation.
          </p>

          {mlResult?.salient_features && mlResult.salient_features.length > 0 ? (
            <div className="space-y-2">
              {mlResult.salient_features.map((feat) => {
                const pct = Math.min(feat.tfidf_weight * 100 * 2.5, 100);
                return (
                  <div key={feat.token} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono-tech">
                      <span className="text-dark-text font-medium">"{feat.token}"</span>
                      <span className="text-semantic-success font-bold">{feat.tfidf_weight}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-dark-deep overflow-hidden">
                      <div
                        className="h-full rounded-full bg-semantic-success"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded bg-dark-deep text-center text-xs text-dark-muted">
              Click "Analyze Attributions" to extract TF-IDF feature weights.
            </div>
          )}
        </div>

        {/* Transformer Token Attention Salience */}
        <div className="p-5 rounded-card bg-dark-surface border border-dark-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-dark-text flex items-center gap-2">
              <Cpu className="w-4 h-4 text-ai" />
              Transformer Token Contextual Dependencies
            </h3>
            <span className="text-[10px] font-mono-tech text-ai">BioBERT WordPiece</span>
          </div>

          <p className="text-xs text-dark-secondary">
            Contextual tokens processed by BioBERT classification head pooler.
          </p>

          {transformerResult?.token_details && transformerResult.token_details.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5 p-3 rounded bg-dark-deep border border-dark-border max-h-48 overflow-y-auto">
                {transformerResult.token_details.map((tok) => (
                  <span
                    key={tok.position}
                    className={`px-2 py-1 rounded text-xs font-mono-tech border ${
                      tok.is_special
                        ? 'bg-ai/15 border-ai/40 text-ai'
                        : 'bg-dark-elevated border-dark-strongBorder text-dark-text'
                    }`}
                  >
                    {tok.token}
                  </span>
                ))}
              </div>

              <div className="p-3 rounded bg-dark-deep border border-dark-border text-xs text-dark-muted space-y-1">
                <span className="font-semibold text-dark-text block">Attention Note:</span>
                <p>
                  Transformer self-attention models semantic co-occurrence across non-adjacent symptoms (e.g. "chest pain" with "radiation to left arm"), providing contextual resilience over independent bag-of-words.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded bg-dark-deep text-center text-xs text-dark-muted">
              Click "Analyze Attributions" to extract WordPiece token mappings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
