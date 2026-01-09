import React from 'react';
import { GripVertical, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardWidgetEditor({ 
  widget, 
  onToggleVisibility, 
  onRemove,
  isDragging,
  dragHandleProps 
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg transition-all",
      isDragging && "opacity-50 bg-slate-50"
    )}>
      <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      
      <div className="flex-1">
        <p className="text-sm font-light text-slate-900">{widget.title}</p>
        <p className="text-xs text-slate-500">{widget.widget_type}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleVisibility(widget.id)}
          title={widget.is_visible ? 'Ausblenden' : 'Anzeigen'}
        >
          {widget.is_visible ? (
            <Eye className="w-4 h-4 text-slate-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-400" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 hover:text-red-700"
          onClick={() => onRemove(widget.id)}
          title="Entfernen"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}