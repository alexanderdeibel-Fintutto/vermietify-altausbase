import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';

const categoryLabels = {
  maintenance: '🔧 Wartung',
  payments: '💳 Zahlungen',
  lease: '📋 Mietvertrag',
  rules: '📖 Regeln',
  technical: '💻 Technisches',
  general: 'ℹ️ Allgemein',
};

export default function FAQIntegration({ onSelectArticle }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedId, setExpandedId] = React.useState(null);

  const { data: articles = [] } = useQuery({
    queryKey: ['faq-articles'],
    queryFn: () => base44.entities.KnowledgeBaseArticle.filter(
      { is_published: true },
      'order',
      100
    ),
  });

  const filteredArticles = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [articles, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="FAQs durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 font-light"
        />
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredArticles.map(article => (
          <Card
            key={article.id}
            className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
          >
            <button
              onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
              className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-light text-slate-900">{article.title}</h4>
                    <Badge variant="outline" className="text-xs font-light">
                      {categoryLabels[article.category]}
                    </Badge>
                  </div>
                </div>
                {expandedId === article.id ? (
                  <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                )}
              </div>
            </button>

            {expandedId === article.id && (
              <div className="border-t border-slate-100 p-4 bg-slate-50">
                <ReactMarkdown className="prose prose-sm font-light max-w-none text-sm">
                  {article.content}
                </ReactMarkdown>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}