import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function CategorySuggestions({ recipient, costTypes, onSelect }) {
  // Get most frequent cost types for this recipient from localStorage
  const suggestions = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('invoice_history') || '[]');
      const recipientHistory = history.filter(h => h.recipient === recipient);
      
      if (recipientHistory.length === 0) return [];

      // Count frequency of cost types
      const frequency = {};
      recipientHistory.forEach(h => {
        frequency[h.cost_type_id] = (frequency[h.cost_type_id] || 0) + 1;
      });

      // Get top 3 suggestions
      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([costTypeId]) => costTypes.find(ct => ct.id === costTypeId))
        .filter(Boolean);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, [recipient, costTypes]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2"
    >
      <p className="text-xs font-medium text-blue-900">
        💡 Häufige Kategorien für "{recipient}":
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((costType) => (
          <button
            key={costType.id}
            onClick={() => onSelect(costType.id)}
            className="transition-all hover:scale-105"
          >
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-blue-200 bg-white border border-blue-300"
            >
              {costType.sub_category}
            </Badge>
          </button>
        ))}
      </div>
    </motion.div>
  );
}