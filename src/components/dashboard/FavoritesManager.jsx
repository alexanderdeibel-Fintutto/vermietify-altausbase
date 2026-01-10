import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Star, Trash } from 'lucide-react';
import { toast } from 'sonner';

export default function FavoritesManager() {
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getFavorites', {});
      return response.data.favorites;
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      await base44.functions.invoke('removeFavorite', { favorite_id: id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('Favorit entfernt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-600" />
          Favoriten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {favorites.map(fav => (
          <div key={fav.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div>
              <p className="text-sm font-semibold">{fav.title}</p>
              <Badge variant="outline" className="text-xs">{fav.type}</Badge>
            </div>
            <Button size="icon" variant="ghost" onClick={() => removeMutation.mutate(fav.id)}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}