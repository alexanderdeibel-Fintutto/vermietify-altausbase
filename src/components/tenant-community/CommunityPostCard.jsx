import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Clock } from 'lucide-react';

export default function CommunityPostCard({ post, currentTenantId }) {
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ['community-comments', post.id],
    queryFn: () => base44.entities.CommunityComment.filter({ post_id: post.id, is_approved: true }),
    enabled: showComments
  });

  const { data: currentTenant } = useQuery({
    queryKey: ['current-tenant', currentTenantId],
    queryFn: () => base44.entities.Tenant.read(currentTenantId),
    enabled: !!currentTenantId
  });

  const addCommentMutation = useMutation({
    mutationFn: () =>
      base44.entities.CommunityComment.create({
        post_id: post.id,
        tenant_id: currentTenantId,
        author_name: currentTenant?.first_name || 'Mieter',
        comment
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-comments'] });
      setComment('');
    }
  });

  const categoryColors = {
    roommate_search: 'bg-purple-100 text-purple-800',
    item_offer: 'bg-green-100 text-green-800',
    item_request: 'bg-blue-100 text-blue-800',
    event: 'bg-orange-100 text-orange-800',
    tip: 'bg-yellow-100 text-yellow-800',
    general: 'bg-slate-100 text-slate-800'
  };

  const categoryLabels = {
    roommate_search: 'Mitbewohner gesucht',
    item_offer: 'Angebot',
    item_request: 'Gesuch',
    event: 'Event',
    tip: 'Tipp',
    general: 'Allgemein'
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-sm">{post.author_name}</p>
              <p className="text-xs text-slate-500">
                {new Date(post.created_date).toLocaleString('de-DE')}
              </p>
            </div>
          </div>
          <Badge className={categoryColors[post.category]}>
            {categoryLabels[post.category]}
          </Badge>
        </div>

        <h3 className="font-bold mb-2">{post.title}</h3>
        <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3">{post.content}</p>

        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {post.images.map((img, i) => (
              <img key={i} src={img} alt="" className="w-full h-32 object-cover rounded" />
            ))}
          </div>
        )}

        {post.contact_method !== 'app_message' && post.contact_info && (
          <div className="p-2 bg-blue-50 rounded text-xs mb-3">
            <p className="font-medium text-blue-900">Kontakt:</p>
            <p className="text-blue-700">{post.contact_info}</p>
          </div>
        )}

        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            {comments.length} Kommentare
          </Button>
        </div>

        {showComments && (
          <div className="mt-3 space-y-3 border-t pt-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">{c.author_name}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(c.created_date).toLocaleString('de-DE')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{c.comment}</p>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Textarea
                placeholder="Kommentar hinzufügen..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => addCommentMutation.mutate()}
                disabled={!comment.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}