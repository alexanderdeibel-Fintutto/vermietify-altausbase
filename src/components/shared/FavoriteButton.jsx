import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FavoriteButton({ isFavorite: initialFavorite, onToggle }) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  const handleClick = () => {
    setIsFavorite(!isFavorite);
    if (onToggle) onToggle(!isFavorite);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="hover:text-[var(--vf-warning-500)]"
    >
      <Star 
        className={cn(
          "h-5 w-5",
          isFavorite && "fill-[var(--vf-warning-500)] text-[var(--vf-warning-500)]"
        )} 
      />
    </Button>
  );
}