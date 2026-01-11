import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, ShoppingBag, Calendar, Lightbulb, MessageSquare, Eye } from 'lucide-react';
import CommunityPostCard from './CommunityPostCard';
import CreatePostDialog from './CreatePostDialog';

export default function CommunityFeed({ tenantId, buildingId, companyId }) {
  const [filter, setFilter] = useState('all');

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts', buildingId, filter],
    queryFn: async () => {
      const allPosts = await base44.entities.CommunityPost.filter({ 
        building_id: buildingId,
        is_approved: true,
        is_active: true
      }, '-created_date');
      
      if (filter === 'all') return allPosts;
      return allPosts.filter(p => p.category === filter);
    }
  });

  const categories = [
    { key: 'all', icon: MessageSquare, label: 'Alle', color: 'bg-slate-500' },
    { key: 'roommate_search', icon: Users, label: 'Mitbewohner', color: 'bg-purple-500' },
    { key: 'item_offer', icon: Package, label: 'Angebote', color: 'bg-green-500' },
    { key: 'item_request', icon: ShoppingBag, label: 'Gesuche', color: 'bg-blue-500' },
    { key: 'event', icon: Calendar, label: 'Events', color: 'bg-orange-500' },
    { key: 'tip', icon: Lightbulb, label: 'Tipps', color: 'bg-yellow-500' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Community Pinnwand</h2>
        <CreatePostDialog tenantId={tenantId} buildingId={buildingId} companyId={companyId} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(cat => (
          <Button
            key={cat.key}
            size="sm"
            variant={filter === cat.key ? "default" : "outline"}
            onClick={() => setFilter(cat.key)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Eye className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">Noch keine Beiträge in dieser Kategorie</p>
              <p className="text-xs text-slate-500 mt-1">Sei der Erste und erstelle einen Beitrag!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map(post => (
            <CommunityPostCard 
              key={post.id} 
              post={post} 
              currentTenantId={tenantId}
            />
          ))
        )}
      </div>
    </div>
  );
}