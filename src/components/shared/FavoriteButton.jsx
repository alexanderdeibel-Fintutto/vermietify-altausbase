import { Star } from 'lucide-react';
import { useFavorites } from '@/components/hooks/useFavorites';
import { Button } from '@/components/ui/button';

export default function FavoriteButton({ pageId, className = '' }) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const isFav = isFavorited(pageId);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleFavorite(pageId)}
      title={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      className={className}
    >
      <Star 
        className={`w-5 h-5 transition ${
          isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'
        }`}
      />
    </Button>
  );
}