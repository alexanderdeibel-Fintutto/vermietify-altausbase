import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SmartCategorySelector({ 
  description, 
  reference, 
  recipient,
  type,
  costTypes, 
  onSelect 
}) {
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historySuggestions, setHistorySuggestions] = useState([]);

  // Get frequent categories for this recipient from localStorage
  React.useEffect(() => {
    if (!recipient) return;
    
    try {
      const history = JSON.parse(localStorage.getItem('invoice_category_history') || '[]');
      const recipientHistory = history.filter(h => h.recipient === recipient);
      
      const frequency = {};
      recipientHistory.forEach(h => {
        frequency[h.cost_type_id] = (frequency[h.cost_type_id] || 0) + 1;
      });

      const top3 = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([costTypeId, count]) => ({
          costType: costTypes.find(ct => ct.id === costTypeId),
          count
        }))
        .filter(s => s.costType);
      
      setHistorySuggestions(top3);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, [recipient, costTypes]);

  const getAISuggestion = async () => {
    if (!description && !reference) {
      toast.error('Beschreibung oder Referenz benötigt');
      return;
    }

    setLoading(true);
    try {
      const filteredTypes = costTypes.filter(ct => ct.type === type);
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analysiere diese Rechnung und wähle die beste Kostenart:

Rechnung:
- Beschreibung: ${description || 'keine'}
- Referenz: ${reference || 'keine'}
- Empfänger: ${recipient || 'keine'}

Verfügbare Kategorien:
${filteredTypes.map(ct => `- ID: ${ct.id}, ${ct.main_category} > ${ct.sub_category}`).join('\n')}

Gib die am besten passende ID zurück.`,
        response_json_schema: {
          type: "object",
          properties: {
            cost_type_id: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" }
          }
        }
      });

      const suggestedType = costTypes.find(ct => ct.id === response.cost_type_id);
      if (suggestedType) {
        setAiSuggestion({
          costType: suggestedType,
          confidence: response.confidence,
          reasoning: response.reasoning
        });
      }
    } catch (error) {
      toast.error('KI-Vorschlag fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (costTypeId) => {
    onSelect(costTypeId);
    
    // Save to history
    if (recipient) {
      try {
        const history = JSON.parse(localStorage.getItem('invoice_category_history') || '[]');
        history.push({ recipient, cost_type_id: costTypeId, timestamp: Date.now() });
        // Keep only last 100 entries
        localStorage.setItem('invoice_category_history', JSON.stringify(history.slice(-100)));
      } catch (error) {
        console.error('Error saving history:', error);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* AI Suggestion Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={getAISuggestion}
        disabled={loading || (!description && !reference)}
        className="w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysiere...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            KI-Kategorie vorschlagen
          </>
        )}
      </Button>

      {/* AI Suggestion Result */}
      <AnimatePresence>
        {aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">KI-Vorschlag:</span>
                <Badge className="bg-blue-600 ml-auto">
                  {Math.round(aiSuggestion.confidence)}% sicher
                </Badge>
              </div>
              <button
                onClick={() => handleSelect(aiSuggestion.costType.id)}
                className="w-full text-left p-2 bg-white rounded border hover:border-blue-400 transition-colors"
              >
                <p className="font-medium text-sm">{aiSuggestion.costType.sub_category}</p>
                <p className="text-xs text-slate-500">{aiSuggestion.costType.main_category}</p>
              </button>
              {aiSuggestion.reasoning && (
                <p className="text-xs text-blue-700">{aiSuggestion.reasoning}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History-based suggestions */}
      {historySuggestions.length > 0 && (
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-700">
              Häufig für "{recipient}":
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {historySuggestions.map(({ costType, count }) => (
              <button
                key={costType.id}
                onClick={() => handleSelect(costType.id)}
                className="transition-all hover:scale-105"
              >
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-slate-200 bg-white"
                >
                  {costType.sub_category} ({count}×)
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}