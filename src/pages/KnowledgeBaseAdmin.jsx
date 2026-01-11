import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Search, BookOpen, Eye } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = [
  'Miete & Zahlung',
  'Wartung & Reparaturen',
  'Verträge & Dokumente',
  'Haus-Regeln',
  'Gemeinschaften-Richtlinien',
  'Neuzug & Auszug',
  'Technischer Support',
];

export default function KnowledgeBaseAdmin() {
  const [articles, setArticles] = useState([
    {
      id: '1',
      title: 'Wie zahle ich die Miete?',
      category: 'Miete & Zahlung',
      content: 'Die Miete kann per Überweisung, SEPA-Lastschrift oder über das Portal bezahlt werden.',
      views: 324,
      created_date: new Date().toISOString(),
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    category: 'Miete & Zahlung',
    content: '',
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        setArticles(articles.map(a => a.id === editingId ? { ...a, ...data } : a));
        toast.success('Artikel aktualisiert');
      } else {
        const newArticle = {
          id: Date.now().toString(),
          ...data,
          views: 0,
          created_date: new Date().toISOString(),
        };
        setArticles([newArticle, ...articles]);
        toast.success('Artikel erstellt');
      }
    },
    onSuccess: () => {
      setFormData({ title: '', category: 'Miete & Zahlung', content: '' });
      setShowForm(false);
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      setArticles(articles.filter(a => a.id !== id));
      toast.success('Artikel gelöscht');
    },
  });

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Wissensdatenbank</h1>
        <p className="text-slate-600 font-light mt-2">FAQs und Hilfeinhalte für Mieter verwalten</p>
      </div>

      {/* Top Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => {
          setShowForm(!showForm);
          setEditingId(null);
          setFormData({ title: '', category: 'Miete & Zahlung', content: '' });
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Artikel
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Artikel-Titel"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <Textarea
              placeholder="Artikel-Inhalt..."
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.title || !formData.content}
              >
                {editingId ? 'Aktualisieren' : 'Erstellen'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
              >
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Artikel durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="all">Alle Kategorien</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Artikel gefunden
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map(article => (
            <Card key={article.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1">{article.category}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(article.id);
                        setFormData(article);
                        setShowForm(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(article.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 line-clamp-3">{article.content}</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views} Aufrufe
                  </span>
                  <span>{new Date(article.created_date).toLocaleDateString('de-DE')}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{articles.length}</p>
            <p className="text-sm text-slate-600">Artikel insgesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{articles.reduce((sum, a) => sum + a.views, 0)}</p>
            <p className="text-sm text-slate-600">Gesamtaufrufe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-semibold">{new Set(articles.map(a => a.category)).size}</p>
            <p className="text-sm text-slate-600">Kategorien</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}