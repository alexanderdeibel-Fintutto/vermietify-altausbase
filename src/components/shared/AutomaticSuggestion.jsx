import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutomaticSuggestion({ 
  visible = false,
  title = 'Suggestion',
  message = '',
  onAccept,
  onReject,
  autoHideDuration = 5000,
  loading = false
}) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onReject?.();
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, autoHideDuration, onReject]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-blue-900">{title}</h3>
            {message && <p className="text-sm text-blue-800 mt-1">{message}</p>}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={() => {
                  onAccept?.();
                  setIsVisible(false);
                }}
                disabled={loading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Wird angewendet...' : 'Annehmen'}
              </Button>
              <Button
                onClick={() => {
                  onReject?.();
                  setIsVisible(false);
                }}
                disabled={loading}
                size="sm"
                variant="outline"
              >
                Ablehnen
              </Button>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-blue-600 hover:text-blue-700 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </motion.div>
  );
}