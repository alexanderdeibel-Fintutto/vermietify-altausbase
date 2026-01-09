import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const categoryEmojis = {
  maintenance: '🔧',
  payments: '💳',
  lease: '📋',
  rules: '📖',
  technical: '💻',
  general: 'ℹ️',
};

const categoryLabels = {
  maintenance: 'Wartung',
  payments: 'Zahlungen',
  lease: 'Mietvertrag',
  rules: 'Regeln',
  technical: 'Technisches',
  general: 'Allgemein',
};

export default function KnowledgeBaseWidget() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedArticleId, setExpandedArticleId] = useState(null);

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledge-base'],
    queryFn: () => base44.entities.KnowledgeBaseArticle.filter(
      { is_published: true },
      'order',
      100
    ),
  });

  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return articles.filter(article => {
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        categoryLabels[article.category]?.toLowerCase().includes(query) ||
        article.tags?.some(tag => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [articles, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-light text-slate-900">Häufig gestellte Fragen</h2>

        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="FAQ durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 font-light"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-40 font-light">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              <SelectItem value="maintenance">🔧 Wartung</SelectItem>
              <SelectItem value="payments">💳 Zahlungen</SelectItem>
              <SelectItem value="lease">📋 Mietvertrag</SelectItem>
              <SelectItem value="rules">📖 Regeln</SelectItem>
              <SelectItem value="technical">💻 Technisches</SelectItem>
              <SelectItem value="general">ℹ️ Allgemein</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm font-light text-slate-500">
              Keine Artikel gefunden. Versuchen Sie, die Suchkriterien zu ändern.
            </p>
          </Card>
        ) : (
          filteredArticles.map(article => (
            <Card
              key={article.id}
              className="overflow-hidden transition-all hover:shadow-md"
            >
              <button
                onClick={() =>
                  setExpandedArticleId(
                    expandedArticleId === article.id ? null : article.id
                  )
                }
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {categoryEmojis[article.category]}
                      </span>
                      <h3 className="font-light text-slate-900">
                        {article.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs font-light ml-auto"
                      >
                        {categoryLabels[article.category]}
                      </Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {article.tags?.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="text-xs font-light text-slate-500 bg-slate-100 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  {expandedArticleId === article.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>
              </button>

              {expandedArticleId === article.id && (
                <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                  <div className="prose prose-sm font-light max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => (
                          <p className="text-sm font-light text-slate-700 mb-2">
                            {children}
                          </p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-lg font-light text-slate-900 mb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-light text-slate-900 mb-2 mt-3">
                            {children}
                          </h2>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside text-sm font-light text-slate-700 mb-2">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                      }}
                    >
                      {article.content}
                    </ReactMarkdown>
                  </div>

                  <div className="border-t border-slate-200 pt-4 flex items-center gap-4">
                    <span className="text-xs font-light text-slate-500">
                      War dieser Artikel hilfreich?
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 h-8 text-xs font-light"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      {article.helpful_count || 0}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 h-8 text-xs font-light"
                    >
                      <ThumbsDown className="w-4 h-4" />
                      {article.unhelpful_count || 0}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}