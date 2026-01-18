import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FloatingActionButton({ onClick, icon: Icon = Plus, className }) {
  return (
    <Button
      variant="gradient"
      size="icon"
      onClick={onClick}
      className={cn(
        "fixed bottom-20 right-6 lg:bottom-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all",
        className
      )}
    >
      <Icon className="h-6 w-6" />
    </Button>
  );
}