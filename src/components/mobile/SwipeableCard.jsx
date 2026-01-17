import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SwipeableCard({ children, onDelete, onEdit }) {
  const [swiped, setSwiped] = useState(false);

  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-end gap-2 px-4 bg-[var(--vf-error-500)]",
          swiped ? "translate-x-0" : "translate-x-full",
          "transition-transform"
        )}
      >
        {onEdit && (
          <button onClick={onEdit} className="p-2 bg-white/20 rounded-lg">
            <Edit className="h-5 w-5 text-white" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="p-2 bg-white/20 rounded-lg">
            <Trash2 className="h-5 w-5 text-white" />
          </button>
        )}
      </div>
      
      <Card
        className={cn(
          "transition-transform",
          swiped && "-translate-x-24"
        )}
        onTouchStart={() => setSwiped(true)}
        onTouchEnd={() => setTimeout(() => setSwiped(false), 2000)}
      >
        {children}
      </Card>
    </div>
  );
}