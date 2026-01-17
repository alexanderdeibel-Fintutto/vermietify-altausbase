import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingActionButton({ icon: Icon = Plus, onClick, label, className }) {
  return (
    <Button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-40 p-0",
        className
      )}
      variant="gradient"
      title={label}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}