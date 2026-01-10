import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, BookOpen, ThumbsUp, ChevronDown, ChevronUp } from 'lucide-react';

const categoryLabels = {
  mietvertrag: 'Mietvertrag',
  wartung: 'Wartung',
  zahlung: 'Zahlung',
  hausverwaltung: 'Hausverwaltung',
  notfall: 'Notfall',
  allgemein: 'Allgemein'
};

const categoryColors = {
  mietvertrag: 'bg-blue-100 text-blue-800',
  wartung: 'bg-orange-100 text-orange-800',
  zahlung: 'bg-green-100 text-green-800',
  hausverwaltung: 'bg-purple-100 text-purple-800',
  notfall: 'bg-red-100 text-red-800',
  allgemein: 'bg-slate-100 text-slate-800'
};

export default function KnowledgeBaseViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedArticle, setExpandedArticle] = useState(null);
  const queryClient = useQueryClient();

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: async () => {
      const arts = await base44.entities.KnowledgeBaseArticle.filter({ 
        is_published: true 
      });
      return arts.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }
  });

  const markHelpfulMutation = useMutation({
    mutationFn: async (articleId) => {
      const article = articles.find(a => a.id === articleId);
      await base44.entities.KnowledgeBaseArticle.update(articleId, {
        helpful_count: (article.helpful_count || 0) + 1,
        view_count: (article.view_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['knowledge-base']);
    }
  });

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id) => {
    setExpandedArticle(expandedArticle === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Wissensdatenbank</h2>
          <p className="text-slate-600">Antworten auf häufige Fragen</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Suche nach Fragen oder Themen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            className={`cursor-pointer ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800'}`}
            onClick={() => setSelectedCategory('all')}
          >
            Alle
          </Badge>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Badge
              key={key}
              className={`cursor-pointer ${selectedCategory === key ? categoryColors[key] : 'bg-slate-100 text-slate-800'}`}
              onClick={() => setSelectedCategory(key)}
            >
              {label}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Keine Artikel gefunden</p>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map(article => (
            <Card key={article.id}>
              <CardHeader 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => toggleExpand(article.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={categoryColors[article.category]} variant="outline">
                        {categoryLabels[article.category]}
                      </Badge>
                    </div>
                    <CardTitle className="text-base">{article.question}</CardTitle>
                  </div>
                  {expandedArticle === article.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </div>
              </CardHeader>
              {expandedArticle === article.id && (
                <CardContent className="border-t">
                  <div className="pt-4 space-y-4">
                    <p className="text-slate-700 whitespace-pre-wrap">{article.answer}</p>
                    
                    {article.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {article.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markHelpfulMutation.mutate(article.id)}
                      >
                        <ThumbsUp className="w-3 h-3 mr-1" />
                        Hilfreich ({article.helpful_count || 0})
                      </Button>
                      <span className="text-xs text-slate-600">
                        {article.view_count || 0} Aufrufe
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}