import React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function SmartSuggestionsCard({
  suggestions = [],
  onApply,
  onDismiss,
}) {
  const [visible, setVisible] = React.useState(true);

  if (!visible || suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              
              <div className="flex-1">
                <p className="font-medium text-blue-900 mb-2">Intelligente Vorschläge</p>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-blue-800">
                      • {suggestion.title}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  onClick={() => {
                    onApply?.(suggestions);
                    setVisible(false);
                  }}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Anwenden
                </Button>
                <Button
                  onClick={() => {
                    onDismiss?.();
                    setVisible(false);
                  }}
                  size="sm"
                  variant="ghost"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}