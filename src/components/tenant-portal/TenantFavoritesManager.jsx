import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Key, MessageSquare, FileText, Wrench, Euro } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TenantFavoritesManager({ tenantId }) {
  const queryClient = useQueryClient();

  const { data: favorites = [] } = useQuery({
    queryKey: ['tenant-favorites', tenantId],
    queryFn: () => base44.entities.TenantFavorite.filter({ tenant_id: tenantId })
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (type) => {
      const existing = favorites.find(f => f.favorite_type === type);
      if (existing) {
        await base44.entities.TenantFavorite.delete(existing.id);
      } else {
        await base44.entities.TenantFavorite.create({
          tenant_id: tenantId,
          favorite_type: type,
          display_order: favorites.length
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-favorites'] })
  });

  const quickActions = [
    { type: 'digital_key', icon: Key, label: 'Digitaler Schlüssel', path: 'TenantDigitalKey', color: 'bg-blue-500' },
    { type: 'messages', icon: MessageSquare, label: 'Nachrichten', path: 'TenantMessages', color: 'bg-green-500' },
    { type: 'documents', icon: FileText, label: 'Dokumente', path: 'TenantDocuments', color: 'bg-purple-500' },
    { type: 'maintenance', icon: Wrench, label: 'Wartung', path: 'TenantMaintenance', color: 'bg-orange-500' },
    { type: 'payments', icon: Euro, label: 'Zahlungen', path: 'TenantPortalDashboard', color: 'bg-emerald-500' }
  ];

  const favoriteItems = quickActions.filter(action => 
    favorites.some(f => f.favorite_type === action.type)
  );

  return (
    <div className="space-y-4">
      {favoriteItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              Favoriten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favoriteItems.map(action => (
                <Link key={action.type} to={createPageUrl(action.path)}>
                  <div className="relative p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer text-center">
                    <Star
                      className="absolute top-2 right-2 w-4 h-4 text-yellow-500 fill-yellow-500"
                    />
                    <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-xs font-medium">{action.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Favoriten verwalten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {quickActions.map(action => {
            const isFavorite = favorites.some(f => f.favorite_type === action.type);
            return (
              <div key={action.type} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${action.color} rounded-full flex items-center justify-center`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
                <Button
                  size="sm"
                  variant={isFavorite ? "default" : "outline"}
                  onClick={() => toggleFavoriteMutation.mutate(action.type)}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}