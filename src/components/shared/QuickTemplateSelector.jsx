import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickTemplateSelector({ 
  templates = [],
  onSelect,
  recentlyUsed = []
}) {
  const popularTemplates = templates.filter(t => t.isPopular);
  const recent = recentlyUsed.slice(0, 3);

  if (templates.length === 0) return null;

  return (
    <div className="space-y-4">
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              Zuletzt verwendet
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {recent.map((template, idx) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelect?.(template)}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {template.name}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {popularTemplates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-700">
              Beliebte Vorlagen
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {popularTemplates.map((template, idx) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto py-3 justify-start"
                onClick={() => onSelect?.(template)}
              >
                <div className="text-left">
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {template.usage || 0} mal verwendet
                  </p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}