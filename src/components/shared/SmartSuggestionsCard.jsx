import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, TrendingUp, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartSuggestionsCard({ 
  entityType = 'invoice',
  onSuggestionClick,
  maxSuggestions = 3 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    // Generate smart suggestions based on user behavior
    const loadSuggestions = () => {
      try {
        const history = JSON.parse(localStorage.getItem(`${entityType}_recent`) || '[]');
        const patterns = analyzePatterns(history);
        setSuggestions(patterns);
      } catch {
        setSuggestions([]);
      }
    };

    loadSuggestions();
  }, [entityType]);

  const analyzePatterns = (history) => {
    if (history.length < 2) return [];

    const suggestions = [];

    // Pattern 1: Frequent category
    const categories = history.map(h => h.category).filter(Boolean);
    const mostFrequent = getMostFrequent(categories);
    if (mostFrequent) {
      suggestions.push({
        id: 'frequent_category',
        icon: TrendingUp,
        title: `Häufige Kategorie: ${mostFrequent}`,
        description: 'In 80% der Fälle verwendet',
        action: () => onSuggestionClick?.({ category: mostFrequent }),
        color: 'blue'
      });
    }

    // Pattern 2: Recent time pattern
    const recentHour = new Date().getHours();
    if (recentHour >= 9 && recentHour <= 17) {
      suggestions.push({
        id: 'business_hours',
        icon: Clock,
        title: 'Geschäftszeiten erkannt',
        description: 'Datum auf heute setzen?',
        action: () => onSuggestionClick?.({ date: new Date().toISOString().split('T')[0] }),
        color: 'green'
      });
    }

    return suggestions.slice(0, maxSuggestions);
  };

  const getMostFrequent = (arr) => {
    if (arr.length === 0) return null;
    const counts = {};
    arr.forEach(item => counts[item] = (counts[item] || 0) + 1);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  };

  const handleDismiss = (id) => {
    setDismissed([...dismissed, id]);
  };

  const visibleSuggestions = suggestions.filter(s => !dismissed.includes(s.id));

  if (visibleSuggestions.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-amber-900">
          <Lightbulb className="w-4 h-4" />
          Intelligente Vorschläge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <AnimatePresence>
          {visibleSuggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
              >
                <div className={`w-8 h-8 rounded-full bg-${suggestion.color}-100 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 text-${suggestion.color}-600`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{suggestion.title}</p>
                  <p className="text-xs text-slate-600">{suggestion.description}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={suggestion.action}
                    className="h-7 px-2 text-xs"
                  >
                    Anwenden
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="h-7 w-7 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}