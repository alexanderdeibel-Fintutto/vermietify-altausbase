import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function SmartSuggestionsCard({ suggestions = [] }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-3"
    >
      {suggestions.map((suggestion, idx) => (
        <Card key={idx} className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">{suggestion.title}</p>
                <p className="text-xs text-blue-700 mt-1">{suggestion.description}</p>
                {suggestion.action && (
                  <Button
                    onClick={suggestion.action.onClick}
                    size="sm"
                    className="mt-2 bg-blue-600 hover:bg-blue-700 gap-1 h-7 text-xs"
                  >
                    {suggestion.action.label}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}