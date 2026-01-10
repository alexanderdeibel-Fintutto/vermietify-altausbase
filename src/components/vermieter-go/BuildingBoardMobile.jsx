import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Plus, Pin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function BuildingBoardMobile({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'announcement',
    priority: 'normal'
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['buildingPosts', buildingId],
    queryFn: () => base44.entities.BuildingBoardPost.filter(
      buildingId 
        ? { building_id: buildingId, is_published: true }
        : { is_published: true },
      '-created_date',
      20
    )
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BuildingBoardPost.create({
        ...data,
        building_id: buildingId,
        author_email: user?.email,
        author_name: user?.full_name,
        author_type: 'admin',
        is_published: true,
        published_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buildingPosts'] });
      toast.success('Beitrag veröffentlicht');
      setFormData({ title: '', content: '', post_type: 'announcement', priority: 'normal' });
      setShowForm(false);
    }
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Schwarzes Brett
            </CardTitle>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-3 h-3 mr-1" />
              Neu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Form */}
          {showForm && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              <Input
                placeholder="Betreff"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Textarea
                placeholder="Nachricht..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.title}
                  size="sm"
                  className="flex-1 bg-blue-600"
                >
                  Veröffentlichen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.map(post => (
            <div key={post.id} className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-start gap-2 mb-2">
                {post.is_pinned && <Pin className="w-3 h-3 text-orange-600" />}
                <div className="flex-1">
                  <p className="font-semibold text-sm">{post.title}</p>
                  <p className="text-xs text-slate-600 mt-1">{post.content}</p>
                </div>
                {post.priority !== 'normal' && (
                  <Badge className={priorityColors[post.priority]}>
                    {post.priority}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{post.author_name}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.created_date).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && !showForm && (
            <p className="text-center text-slate-600 py-4">Keine Beiträge</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}