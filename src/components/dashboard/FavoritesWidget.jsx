import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FavoritesWidget() {
  const favorites = [
    { title: 'Kaufpreis-Rechner', page: 'KaufpreisRechner', icon: '🏠' },
    { title: 'Rendite-Rechner', page: 'AfACalculator', icon: '📊' },
    { title: 'Tilgungs-Rechner', page: 'TilgungsRechner', icon: '💰' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Favoriten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {favorites.map((fav) => (
            <Link key={fav.page} to={createPageUrl(fav.page)}>
              <div className="flex items-center gap-3 p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors">
                <span className="text-2xl">{fav.icon}</span>
                <span className="text-sm font-medium">{fav.title}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}