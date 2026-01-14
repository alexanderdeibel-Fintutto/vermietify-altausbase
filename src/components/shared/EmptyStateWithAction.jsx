import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { FileQuestion, Plus, Search, Inbox } from 'lucide-react';

export default function EmptyStateWithAction({ 
  icon = 'inbox',
  title = 'Noch keine Daten',
  description = 'Beginnen Sie, indem Sie Ihren ersten Eintrag erstellen.',
  actionLabel = 'Erstellen',
  onAction,
  secondaryLabel,
  onSecondaryAction
}) {
  const icons = {
    inbox: Inbox,
    search: Search,
    question: FileQuestion,
    plus: Plus
  };

  const Icon = icons[icon] || Inbox;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <Card className="max-w-md p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
            <Icon className="w-10 h-10 text-slate-400" />
          </div>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          {title}
        </h3>
        
        <p className="text-slate-600 mb-6">
          {description}
        </p>

        <div className="flex gap-3 justify-center">
          {onAction && (
            <Button onClick={onAction} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          )}
          
          {onSecondaryAction && secondaryLabel && (
            <Button variant="outline" onClick={onSecondaryAction} size="lg">
              {secondaryLabel}
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}