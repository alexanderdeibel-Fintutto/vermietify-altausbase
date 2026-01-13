import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useFavorites() {
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState(new Set());

  // Load user favorites
  const { data: userFavorites = [] } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const favs = await base44.entities.UserFavorite?.list?.() || [];
      return favs.filter(f => f.user_email === user.email);
    }
  });

  // Sync to Set
  useEffect(() => {
    setFavorites(new Set(userFavorites.map(f => f.target_id)));
  }, [userFavorites]);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (targetId) => {
      const user = await base44.auth.me();
      if (!user) return;

      const existing = userFavorites.find(f => f.target_id === targetId);
      if (existing) {
        await base44.asServiceRole.entities.UserFavorite.delete(existing.id);
      } else {
        await base44.asServiceRole.entities.UserFavorite.create({
          user_email: user.email,
          target_id: targetId,
          target_type: 'page'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
    }
  });

  const isFavorited = (id) => favorites.has(id);

  const toggleFavorite = (id) => {
    toggleFavoriteMutation.mutate(id);
  };

  return { isFavorited, toggleFavorite, favorites: userFavorites };
}