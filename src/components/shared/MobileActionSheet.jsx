import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export default function MobileActionSheet({ 
  open = false,
  onOpenChange,
  title = 'Aktionen',
  description = '',
  actions = [],
  isLoading = false
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="space-y-2 mt-6">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              onClick={() => {
                action.onClick?.();
                if (!action.keepOpen) onOpenChange(false);
              }}
              disabled={isLoading || action.disabled}
              className={`w-full justify-start ${
                action.variant === 'destructive'
                  ? 'bg-red-600 hover:bg-red-700'
                  : action.variant === 'secondary'
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                  : ''
              }`}
              variant={action.variant === 'outline' ? 'outline' : 'default'}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}