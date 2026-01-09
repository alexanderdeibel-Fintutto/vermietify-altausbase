import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PinIcon, Upload, Trash2, MessageSquare, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function AdminBoardManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    building_id: '',
    title: '',
    content: '',
    post_type: 'general',
    priority: 'normal',
    comments_enabled: true,
    is_pinned: false
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list('-created_date', 100)
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['boardPosts'],
    queryFn: () => base44.entities.BuildingBoardPost.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.BuildingBoardPost.create({
        ...data,
        author_email: user.email,
        author_name: user.full_name,
        author_type: 'admin',
        published_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
      toast.success('Beitrag veröffentlicht');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BuildingBoardPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
      toast.success('Beitrag aktualisiert');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BuildingBoardPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boardPosts'] });
      toast.success('Beitrag gelöscht');
    }
  });

  const resetForm = () => {
    setFormData({
      building_id: '',
      title: '',
      content: '',
      post_type: 'general',
      priority: 'normal',
      comments_enabled: true,
      is_pinned: false
    });
    setEditingPost(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      building_id: post.building_id || '',
      title: post.title,
      content: post.content,
      post_type: post.post_type,
      priority: post.priority,
      comments_enabled: post.comments_enabled,
      is_pinned: post.is_pinned
    });
    setShowForm(true);
  };

  const typeLabels = {
    announcement: 'Ankündigung',
    document: 'Dokument',
    question: 'Frage',
    event: 'Veranstaltung',
    general: 'Allgemein'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light text-slate-900">Gebäude-Pinnwand verwalten</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          {showForm ? 'Abbrechen' : 'Neuer Beitrag'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingPost ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Gebäude</Label>
                <Select value={formData.building_id} onValueChange={(v) => setFormData({ ...formData, building_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Gebäude" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Alle Gebäude</SelectItem>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <Select value={formData.post_type} onValueChange={(v) => setFormData({ ...formData, post_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorität</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="urgent">Dringend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Titel</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titel des Beitrags"
                  required
                />
              </div>

              <div>
                <Label>Inhalt</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Inhalt des Beitrags"
                  rows={6}
                  required
                />
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_pinned}
                    onCheckedChange={(v) => setFormData({ ...formData, is_pinned: v })}
                  />
                  <Label>Angepinnt</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.comments_enabled}
                    onCheckedChange={(v) => setFormData({ ...formData, comments_enabled: v })}
                  />
                  <Label>Kommentare erlauben</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {editingPost ? 'Aktualisieren' : 'Veröffentlichen'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {posts.map(post => (
          <Card key={post.id} className={post.is_pinned ? 'border-blue-500 bg-blue-50' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.is_pinned && <PinIcon className="w-4 h-4 text-blue-600" />}
                    <h3 className="font-semibold text-slate-900">{post.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600">{post.content}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(post)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(post.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={priorityColors[post.priority]}>
                  {post.priority}
                </Badge>
                <Badge variant="outline">{typeLabels[post.post_type]}</Badge>
                {post.building_id ? (
                  <Badge variant="outline">
                    {buildings.find(b => b.id === post.building_id)?.name || 'Gebäude'}
                  </Badge>
                ) : (
                  <Badge variant="outline">Alle Gebäude</Badge>
                )}
                <div className="flex items-center gap-3 ml-auto text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {post.view_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> {post.comment_count || 0}
                  </span>
                  {!post.comments_enabled && (
                    <Badge variant="outline" className="text-red-600">Kommentare deaktiviert</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}