import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

export default function KnowledgeBaseAdmin() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const articles = [
    { id: 1, title: 'Wie zahle ich meine Miete?', category: 'Zahlungen', views: 245 },
    { id: 2, title: 'Wartungsanfrage stellen', category: 'Wartung', views: 189 },
    { id: 3, title: 'Mietvertrag einsehen', category: 'Verträge', views: 156 },
    { id: 4, title: 'Kaution und Nebenkosten', category: 'Finanzen', views: 132 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Wissensdatenbank</h1>
          <p className="text-slate-600 font-light mt-2">FAQs und Hilfeinhalte für Mieter</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neuer Artikel
        </Button>
      </div>

      {/* Formular */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Artikel erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titel</label>
              <Input placeholder="Artikeltitel..." />
            </div>
            <div>
              <label className="text-sm font-medium">Kategorie</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>Zahlungen</option>
                <option>Wartung</option>
                <option>Verträge</option>
                <option>Finanzen</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Inhalt</label>
              <Textarea placeholder="Artikelinhalt..." className="min-h-40" />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1">Speichern</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suchbereich */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Artikel suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Artikel-Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map(article => (
          <Card key={article.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-slate-900">{article.title}</h3>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-slate-100 rounded">{article.category}</span>
                  <span className="text-xs text-slate-500">{article.views} Aufrufe</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}