import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FavoritesManager({ entityType, entityId, isFavorite = false }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        const favorites = await base44.entities.UserFavorite.filter({ 
          entity_type: entityType,
          entity_id: entityId
        });
        if (favorites[0]) {
          await base44.entities.UserFavorite.delete(favorites[0].id);
        }
      } else {
        await base44.entities.UserFavorite.create({
          entity_type: entityType,
          entity_id: entityId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['favorites']);
    }
  });

  return (
    <button
      onClick={() => toggleMutation.mutate()}
      className={cn(
        "p-2 rounded-lg transition-colors",
        isFavorite ? "text-[var(--vf-accent-500)]" : "text-[var(--theme-text-muted)]"
      )}
      title={isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
    >
      <Star className={cn("h-5 w-5", isFavorite && "fill-current")} />
    </button>
  );
}