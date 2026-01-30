import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ErrorRecovery({ error, onRetry, onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 dark:text-red-200">Fehler aufgetreten</h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Erneut versuchen
            </Button>
            {onDismiss && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDismiss}
              >
                Schließen
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}