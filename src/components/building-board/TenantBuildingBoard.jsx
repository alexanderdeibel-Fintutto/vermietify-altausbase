import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PinIcon, MessageSquare, Send, ThumbsUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantBuildingBoard({ tenantId }) {
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newPostData, setNewPostData] = useState({ title: '', content: '' });
  const [commentText, setCommentText] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const tenants = await base44.entities.Tenant.filter({ id: tenantId }, null, 1);
      return tenants[0];
    },
    enabled: !!tenantId
  });

  const { data: contract } = useQuery({
    queryKey: ['tenantContract', tenantId],
    queryFn: async () => {
      const contracts = await base44.entities.LeaseContract.filter({ tenant_id: tenantId, status: 'active' }, null, 1);
      return contracts[0];
    },
    enabled: !!tenantId
  });

  const { data: building } = useQuery({
    queryKey: ['building', contract?.building_id],
    queryFn: async () => {
      const buildings = await base44.entities.Building.filter({ id: contract.building_id }, null, 1);
      return buildings[0];
    },
    enabled: !!contract?.building_id
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['tenantBoardPosts', building?.id],
    queryFn: async () => {
      const allPosts = await base44.entities.BuildingBoardPost.list('-created_date', 100);
      return allPosts.filter(p => !p.building_id || p.building_id === building?.id);
    },
    enabled: !!building?.id
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['postComments', selectedPost?.id],
    queryFn: () => base44.entities.BuildingBoardComment.filter({ post_id: selectedPost.id }, '-created_date', 100),
    enabled: !!selectedPost?.id
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.BuildingBoardPost.create({
      ...data,
      building_id: building?.id,
      author_email: user.email,
      author_name: tenant?.full_name || user.full_name,
      author_type: 'tenant',
      post_type: 'general',
      published_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantBoardPosts'] });
      toast.success('Beitrag erstellt');
      setNewPostData({ title: '', content: '' });
      setShowNewPost(false);
    }
  });

  const createCommentMutation = useMutation({
    mutationFn: (data) => base44.entities.BuildingBoardComment.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      // Update comment count
      await base44.entities.BuildingBoardPost.update(selectedPost.id, {
        comment_count: (selectedPost.comment_count || 0) + 1
      });
      queryClient.invalidateQueries({ queryKey: ['tenantBoardPosts'] });
      setCommentText('');
      toast.success('Kommentar hinzugefügt');
    }
  });

  const incrementViewMutation = useMutation({
    mutationFn: (post) => base44.entities.BuildingBoardPost.update(post.id, {
      view_count: (post.view_count || 0) + 1
    })
  });

  const handlePostClick = (post) => {
    setSelectedPost(post);
    incrementViewMutation.mutate(post);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      post_id: selectedPost.id,
      author_email: user.email,
      author_name: tenant?.full_name || user.full_name,
      author_type: 'tenant',
      content: commentText
    });
  };

  const typeIcons = {
    announcement: '📢',
    document: '📄',
    question: '❓',
    event: '📅',
    general: '📌'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const pinnedPosts = posts.filter(p => p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-slate-900">Gebäude-Pinnwand</h2>
          <p className="text-sm text-slate-600">{building?.name || 'Ihr Gebäude'}</p>
        </div>
        <Button onClick={() => setShowNewPost(!showNewPost)} className="bg-blue-600 hover:bg-blue-700">
          {showNewPost ? 'Abbrechen' : 'Neuer Beitrag'}
        </Button>
      </div>

      {showNewPost && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Input
                placeholder="Titel"
                value={newPostData.title}
                onChange={(e) => setNewPostData({ ...newPostData, title: e.target.value })}
              />
              <Textarea
                placeholder="Was möchten Sie mitteilen?"
                rows={4}
                value={newPostData.content}
                onChange={(e) => setNewPostData({ ...newPostData, content: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={() => createPostMutation.mutate(newPostData)} className="bg-blue-600 hover:bg-blue-700">
                  Veröffentlichen
                </Button>
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <PinIcon className="w-4 h-4" />
            Angepinnte Beiträge
          </h3>
          {pinnedPosts.map(post => (
            <Card key={post.id} className="border-blue-500 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handlePostClick(post)}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{typeIcons[post.post_type]}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={priorityColors[post.priority]}>{post.priority}</Badge>
                      <span className="text-xs text-slate-500">{post.author_name}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{new Date(post.published_at).toLocaleDateString('de-DE')}</span>
                      <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                        <MessageSquare className="w-3 h-3" /> {post.comment_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {regularPosts.map(post => (
          <Card key={post.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handlePostClick(post)}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcons[post.post_type]}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{post.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className={priorityColors[post.priority]}>{post.priority}</Badge>
                    <span className="text-xs text-slate-500">{post.author_name}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{new Date(post.published_at).toLocaleDateString('de-DE')}</span>
                    <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                      <MessageSquare className="w-3 h-3" /> {post.comment_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedPost(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{typeIcons[selectedPost.post_type]}</span>
                <div className="flex-1">
                  <CardTitle>{selectedPost.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={priorityColors[selectedPost.priority]}>{selectedPost.priority}</Badge>
                    <span className="text-xs text-slate-500">{selectedPost.author_name}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{new Date(selectedPost.published_at).toLocaleDateString('de-DE')}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-slate-700 mb-6 whitespace-pre-wrap">{selectedPost.content}</p>

              {selectedPost.comments_enabled ? (
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Kommentare ({comments.length})
                  </h4>

                  <div className="space-y-3">
                    {comments.map(comment => (
                      <div key={comment.id} className="p-3 bg-slate-50 rounded">
                        <p className="text-sm text-slate-900">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-500">{comment.author_name}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{new Date(comment.created_date).toLocaleDateString('de-DE')}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Kommentar hinzufügen..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <p className="text-sm text-amber-800">Kommentare sind für diesen Beitrag deaktiviert</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}