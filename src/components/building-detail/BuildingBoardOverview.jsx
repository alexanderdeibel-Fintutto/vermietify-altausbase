import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, PinIcon } from 'lucide-react';

export default function BuildingBoardOverview({ buildingId }) {
  const { data: posts = [] } = useQuery({
    queryKey: ['buildingBoardPosts', buildingId],
    queryFn: async () => {
      const allPosts = await base44.entities.BuildingBoardPost.list('-created_date', 100);
      return allPosts.filter(p => !p.building_id || p.building_id === buildingId);
    },
    enabled: !!buildingId
  });

  const typeIcons = {
    announcement: '📢',
    document: '📄',
    question: '❓',
    event: '📅',
    general: '📌'
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-light text-slate-900">Gebäude-Pinnwand</h2>
      
      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Keine Beiträge vorhanden
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className={post.is_pinned ? 'border-blue-500 bg-blue-50' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeIcons[post.post_type]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {post.is_pinned && <PinIcon className="w-4 h-4 text-blue-600" />}
                      <h3 className="font-semibold text-slate-900">{post.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">{post.author_name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        {new Date(post.published_at).toLocaleDateString('de-DE')}
                      </span>
                      <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                        <MessageSquare className="w-3 h-3" />
                        {post.comment_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}