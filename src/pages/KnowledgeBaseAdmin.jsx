import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { toast } from 'sonner';

const categoryOptions = [
  { value: 'mietvertrag', label: 'Mietvertrag' },
  { value: 'wartung', label: 'Wartung' },
  { value: 'zahlung', label: 'Zahlung' },
  { value: 'hausverwaltung', label: 'Hausverwaltung' },
  { value: 'notfall', label: 'Notfall' },
  { value: 'allgemein', label: 'Allgemein' }
];

export default function KnowledgeBaseAdmin() {
  const [showForm, setShowForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'allgemein',
    question: '',
    answer: '',
    tags: '',
    is_published: true,
    priority: 0
  });

  const queryClient = useQueryClient();

  const { data: articles = [] } = useQuery({
    queryKey: ['kb-articles-admin'],
    queryFn: () => base44.entities.KnowledgeBaseArticle.list('-priority', 100)
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
      };
      
      if (editingArticle) {
        await base44.entities.KnowledgeBaseArticle.update(editingArticle.id, data);
      } else {
        await base44.entities.KnowledgeBaseArticle.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kb-articles-admin']);
      resetForm();
      toast.success(editingArticle ? 'Artikel aktualisiert' : 'Artikel erstellt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KnowledgeBaseArticle.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['kb-articles-admin']);
      toast.success('Artikel gelöscht');
    }
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingArticle(null);
    setFormData({
      title: '',
      category: 'allgemein',
      question: '',
      answer: '',
      tags: '',
      is_published: true,
      priority: 0
    });
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      ...article,
      tags: article.tags?.join(', ') || ''
    });
    setShowForm(true);
  };

  const filteredArticles = articles.filter(a => 
    searchQuery === '' ||
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Wissensdatenbank</h1>
            <p className="text-slate-600">FAQ-Artikel verwalten</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Artikel
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Artikel durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingArticle ? 'Artikel bearbeiten' : 'Neuer Artikel'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Titel</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Kategorie</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Frage</label>
              <Input
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="z.B. Wie zahle ich meine Miete?"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Antwort</label>
              <Textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={6}
                placeholder="Ausführliche Antwort..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">Tags (kommagetrennt)</label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Miete, Zahlung, Heizung"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">Priorität</label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  placeholder="0-10"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-sm font-semibold">Veröffentlicht</span>
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                Speichern
              </Button>
              <Button onClick={resetForm} variant="outline">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {filteredArticles.map(article => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {categoryOptions.find(c => c.value === article.category)?.label}
                    </Badge>
                    {!article.is_published && (
                      <Badge className="bg-slate-500">Entwurf</Badge>
                    )}
                    <Badge variant="outline">Priorität: {article.priority || 0}</Badge>
                  </div>
                  <CardTitle className="text-base">{article.question}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(article)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(article.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{article.answer}</p>
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <span><Eye className="w-3 h-3 inline mr-1" />{article.view_count || 0} Aufrufe</span>
                <span>{article.helpful_count || 0} als hilfreich markiert</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}