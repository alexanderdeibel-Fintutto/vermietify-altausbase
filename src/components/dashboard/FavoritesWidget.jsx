import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FavoritesWidget() {
  const { data: favorites = [] } = useQuery({
    queryKey: ['user-favorites-widget'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const favs = await base44.entities.UserFavorite?.list?.() || [];
      return favs.filter(f => f.user_email === user.email).slice(0, 5);
    }
  });

  if (favorites.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4" /> Favoriten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 text-center py-4">
            Markiere wichtige Seiten mit ⭐
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 
          Favoriten ({favorites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {favorites.map(fav => (
            <Link 
              key={fav.id}
              to={createPageUrl(fav.target_id)}
              className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 text-sm transition"
            >
              <Bookmark className="w-4 h-4 text-slate-400" />
              <span className="truncate">{fav.target_id}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}