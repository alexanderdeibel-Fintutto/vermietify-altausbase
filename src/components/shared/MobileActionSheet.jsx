import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function MobileActionSheet({ 
  open,
  onClose,
  title,
  actions = []
}) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-2">
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
                  variant={action.variant || "outline"}
                  className="w-full justify-start gap-3 h-12"
                  onClick={() => {
                    action.onClick?.();
                    onClose?.();
                  }}
                  disabled={action.disabled}
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