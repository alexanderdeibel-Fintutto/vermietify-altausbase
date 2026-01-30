import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function MobileActionSheet({ open, onOpenChange, title, actions = [] }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2 mt-4">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Button
                  variant={action.variant || 'outline'}
                  onClick={() => {
                    action.onClick();
                    onOpenChange(false);
                  }}
                  disabled={action.disabled}
                  className="w-full justify-start gap-3 h-12"
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span>{action.label}</span>
                </Button>
              </motion.div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}