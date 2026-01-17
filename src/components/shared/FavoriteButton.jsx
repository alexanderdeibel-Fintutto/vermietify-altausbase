import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FavoriteButton({ entityId, entityType, initialState = false }) {
  const [isFavorite, setIsFavorite] = useState(initialState);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    console.log('Toggle favorite:', { entityId, entityType, isFavorite: !isFavorite });
  };

  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={toggleFavorite}
      className={cn(
        isFavorite && "text-[var(--vf-accent-500)]"
      )}
    >
      <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
    </Button>
  );
}