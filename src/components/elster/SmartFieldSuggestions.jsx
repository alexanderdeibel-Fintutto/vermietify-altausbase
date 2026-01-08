import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartFieldSuggestions({ suggestions, onApplySuggestion }) {
  if (!suggestions || !suggestions.has_suggestions) return null;

  const suggestionsList = Object.entries(suggestions.suggestions || {});

  if (suggestionsList.length === 0) return null;

  const handleApply = (field, suggestion) => {
    onApplySuggestion(field, suggestion.value);
    toast.success(`Wert für ${field} übernommen`);
  };

  const handleApplyAll = () => {
    suggestionsList.forEach(([field, suggestion]) => {
      if (suggestion.confidence >= 80) {
        onApplySuggestion(field, suggestion.value);
      }
    });
    toast.success(`${suggestionsList.filter(([_, s]) => s.confidence >= 80).length} Vorschläge übernommen`);
  };

  const highConfidence = suggestionsList.filter(([_, s]) => s.confidence >= 80);

  return (
    <Alert className="bg-purple-50 border-purple-200">
      <Sparkles className="h-4 w-4 text-purple-600" />
      <AlertDescription className="text-purple-900">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium">Smart-Vorschläge verfügbar</div>
            <div className="text-xs text-purple-700">
              Basierend auf {suggestions.based_on_year}
            </div>
          </div>
          {highConfidence.length > 0 && (
            <Button
              size="sm"
              onClick={handleApplyAll}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Alle übernehmen ({highConfidence.length})
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {suggestionsList.map(([field, suggestion]) => (
            <div 
              key={field}
              className="p-3 bg-white rounded border border-purple-100 hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{field}</span>
                    <Badge 
                      variant="outline" 
                      className={
                        suggestion.confidence >= 90 ? 'bg-green-100 text-green-800' :
                        suggestion.confidence >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                      }
                    >
                      {suggestion.confidence}% Vertrauen
                    </Badge>
                    {suggestion.type === 'estimated' && (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="text-sm font-mono bg-slate-50 p-2 rounded">
                    {typeof suggestion.value === 'number' 
                      ? suggestion.value.toLocaleString('de-DE') 
                      : suggestion.value}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {suggestion.source}
                  </div>
                  {suggestion.historical_values && (
                    <div className="text-xs text-slate-500 mt-1">
                      Historie: {Object.entries(suggestion.historical_values).map(([year, val]) => 
                        `${year}: ${val.toLocaleString('de-DE')}`
                      ).join(' | ')}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApply(field, suggestion)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  );
}