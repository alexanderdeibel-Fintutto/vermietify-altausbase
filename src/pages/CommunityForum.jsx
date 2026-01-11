import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ThumbsUp, Plus, CheckCircle2, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  { value: 'roommate_search', label: 'Mitbewohner-Suche' },
  { value: 'item_offer', label: 'Gegenstände anbieten' },
  { value: 'item_request', label: 'Gegenstände suchen' },
  { value: 'event', label: 'Veranstaltungen' },
  { value: 'tip', label: 'Tipps & Tricks' },
  { value: 'general', label: 'Allgemeines' },
];

export default function CommunityForum() {
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: 'general' });
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list(),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['community-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date', 100),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['community-comments'],
    queryFn: () => base44.entities.CommunityComment?.list?.('-created_date', 200) || Promise.resolve([]),
  });

  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      const tenant = tenants.find(t => t.id === currentUser.id);
      await base44.entities.CommunityPost.create({
        ...data,
        tenant_id: currentUser.id,
        building_id: tenant?.building_id,
        company_id: currentUser.company_id,
        author_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Anonym',
        is_approved: currentUser?.role === 'admin',
        is_active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setFormData({ title: '', content: '', category: 'general' });
      setShowCreateForm(false);
      toast.success('Post erstellt');
    },
  });

  const approvePostMutation = useMutation({
    mutationFn: async (postId) => {
      await base44.entities.CommunityPost.update(postId, { is_approved: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('Post genehmigt');
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      await base44.entities.CommunityPost.update(postId, { is_active: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('Post gelöscht');
    },
  });

  const isAdmin = currentUser?.role === 'admin';
  const filteredPosts = selectedCategory === 'pending'
    ? posts.filter(p => !p.is_approved && p.is_active)
    : posts.filter(p => (p.category === selectedCategory || selectedCategory === 'all') && p.is_approved && p.is_active);

  const getCategoryLabel = (value) => CATEGORIES.find(c => c.value === value)?.label || value;
  const getPostComments = (postId) => comments.filter(c => c.post_id === postId).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Community-Forum</h1>
        <p className="text-slate-600 font-light mt-2">Austausch zwischen Mietern und Gemeinschaft stärken</p>
      </div>

      {!isAdmin && (
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Post
        </Button>
      )}

      {showCreateForm && !isAdmin && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Titel"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            <Textarea
              placeholder="Inhalt..."
              rows={4}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => createPostMutation.mutate(formData)}
                disabled={!formData.title || !formData.content}
              >
                Veröffentlichen
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Alle Posts</TabsTrigger>
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
            ))}
            <TabsTrigger value="pending" className="text-red-600">
              Genehmigung ausstehend ({posts.filter(p => !p.is_approved).length})
            </TabsTrigger>
          </TabsList>

          {['all', ...CATEGORIES.map(c => c.value), 'pending'].map(cat => (
            <TabsContent key={cat} value={cat} className="mt-6 space-y-3">
              {filteredPosts.filter(p => cat === 'all' || cat === 'pending' || p.category === cat).map(post => (
                <Card key={post.id} className={!post.is_approved ? 'border-yellow-300 bg-yellow-50' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{post.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{getCategoryLabel(post.category)}</Badge>
                          {!post.is_approved && <Badge className="bg-yellow-100 text-yellow-800">Ausstehend</Badge>}
                        </div>
                      </div>
                      {isAdmin && !post.is_approved && (
                        <Button
                          size="sm"
                          onClick={() => approvePostMutation.mutate(post.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-slate-700 mb-2">{post.content}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-4">
                      <span>{post.author_name}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(post.created_date).toLocaleDateString('de-DE')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {getPostComments(post.id)} Kommentare
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        {post.is_approved && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePostMutation.mutate(post.id)}
                          >
                            Löschen
                          </Button>
                        )}
                      </div>
                    )}

                    {selectedPost?.id === post.id && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="text-sm bg-slate-50 p-2 rounded">
                          <p className="font-semibold">Alle Kommentare:</p>
                          {comments.filter(c => c.post_id === post.id).map(comment => (
                            <div key={comment.id} className="mt-2 text-xs">
                              <p className="font-semibold">{comment.author_name}</p>
                              <p className="text-slate-700">{comment.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {filteredPosts.filter(p => cat === 'all' || cat === 'pending' || p.category === cat).length === 0 && (
                <Card>
                  <CardContent className="pt-6 text-center text-slate-500">
                    Keine Posts in dieser Kategorie
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {!isAdmin && (
        <div className="space-y-3">
          <div className="flex gap-2 mb-4">
            {['all', ...CATEGORIES.map(c => c.value)].map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'Alle' : getCategoryLabel(cat)}
              </Button>
            ))}
          </div>

          {filteredPosts.map(post => (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-slate-900">{post.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{post.author_name}</p>
                <p className="text-sm text-slate-700 mt-2">{post.content.slice(0, 150)}...</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-4">
                  <span>{new Date(post.created_date).toLocaleDateString('de-DE')}</span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {getPostComments(post.id)} Kommentare
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}