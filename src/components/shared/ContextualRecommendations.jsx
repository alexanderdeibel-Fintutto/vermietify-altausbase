import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ContextualRecommendations({ 
  recommendations = [],
  onApply,
  onDismiss 
}) {
  if (recommendations.length === 0) return null;

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-purple-900">
          <Sparkles className="w-4 h-4" />
          Empfehlungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-3 rounded-lg border border-purple-200"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-4 h-4 text-purple-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 mb-1">
                  {rec.title}
                </p>
                <p className="text-xs text-slate-600 mb-2">
                  {rec.description}
                </p>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onApply?.(rec)}
                    className="gap-2 text-xs h-7"
                  >
                    Anwenden
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDismiss?.(rec)}
                      className="text-xs h-7"
                    >
                      Ignorieren
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}