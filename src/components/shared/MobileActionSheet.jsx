import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

export default function MobileActionSheet({ open, onOpenChange, title, actions = [] }) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-2 pb-8">
          {actions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || 'outline'}
              className="w-full justify-start h-12"
              onClick={() => {
                action.onClick?.();
                onOpenChange(false);
              }}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}