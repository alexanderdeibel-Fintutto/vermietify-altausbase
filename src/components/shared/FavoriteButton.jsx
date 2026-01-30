import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function FavoriteButton({ 
  isFavorite: initialFavorite = false, 
  onToggle,
  size = 'default' 
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e) => {
    e.stopPropagation();
    
    setIsAnimating(true);
    const newState = !isFavorite;
    setIsFavorite(newState);

    try {
      await onToggle(newState);
      toast.success(newState ? 'Zu Favoriten hinzugefügt' : 'Von Favoriten entfernt');
    } catch (error) {
      setIsFavorite(!newState);
      toast.error('Fehler beim Speichern');
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <Button
      variant="ghost"
      size={size === 'sm' ? 'sm' : 'default'}
      onClick={handleClick}
      className="relative"
    >
      <motion.div
        animate={isAnimating ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Star
          className={`w-4 h-4 transition-all ${
            isFavorite
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-400 hover:text-amber-400'
          }`}
        />
      </motion.div>
    </Button>
  );
}