import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BookOpen, Plus, Edit, Trash2, Eye } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    title: '',
    category: 'allgemein',
    question: '',
    answer: '',
    tags: [],
    is_published: true,
    priority: 0
  });

  const queryClient = useQueryClient();

  const { data: articles = [] } = useQuery({
    queryKey: ['kb-articles'],
    queryFn: () => base44.entities.KnowledgeBaseArticle.list()
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingArticle) {
        await base44.entities.KnowledgeBaseArticle.update(editingArticle.id, formData);
      } else {
        await base44.entities.KnowledgeBaseArticle.create(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['kb-articles']);
      resetForm();
      toast.success(editingArticle ? 'Artikel aktualisiert' : 'Artikel erstellt');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.KnowledgeBaseArticle.delete({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['kb-articles']);
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
      tags: [],
      is_published: true,
      priority: 0
    });
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData(article);
    setShowForm(true);
  };

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
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={() => saveMutation.mutate()}>
                Speichern
              </Button>
              <Button onClick={resetForm} variant="outline">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {articles.map(article => (
          <Card key={article.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{categoryOptions.find(c => c.value === article.category)?.label}</Badge>
                    {!article.is_published && <Badge className="bg-slate-500">Entwurf</Badge>}
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
                <span>{article.helpful_count || 0} hilfreich</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}