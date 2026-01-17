import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FavoritesWidget() {
  const favorites = [
    { id: 1, title: 'Objekt Hauptstraße 12', type: 'building', page: 'BuildingDetail' },
    { id: 2, title: 'Mietvertrag M. Schmidt', type: 'contract', page: 'ContractDetail' },
    { id: 3, title: 'BK-Abrechnung 2025', type: 'document', page: 'Documents' }
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
            <Link key={fav.id} to={createPageUrl(fav.page)}>
              <div className="flex items-center justify-between p-3 bg-[var(--theme-surface)] hover:bg-[var(--theme-surface-hover)] rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-[var(--vf-accent-500)]" />
                  <span className="text-sm font-medium">{fav.title}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-[var(--theme-text-muted)]" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}