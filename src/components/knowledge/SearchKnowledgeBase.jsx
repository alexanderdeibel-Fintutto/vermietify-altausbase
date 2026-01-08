import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus } from 'lucide-react';

export default function SearchKnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { data: rules = [] } = useQuery({
    queryKey: ['knowledge-rules'],
    queryFn: () => base44.entities.LegalKnowledgeBase.list()
  });

  const filteredRules = rules.filter(rule => {
    const matchesQuery = searchQuery === '' || 
      rule.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.current_rule.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'ALL' || 
      rule.knowledge_category === selectedCategory;

    return matchesQuery && matchesCategory;
  });

  const categories = ['ALL', ...new Set(rules.map(r => r.knowledge_category))];

  return (
    <div className="space-y-4">
      {/* Suchbar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Nach Wissensinhalten suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neue Regel
        </Button>
      </div>

      {/* Kategorien */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Badge
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Ergebnisse */}
      <div className="space-y-3">
        {filteredRules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine Einträge gefunden
            </CardContent>
          </Card>
        ) : (
          filteredRules.map(rule => (
            <Card key={rule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{rule.topic}</h3>
                    <Badge variant="outline" className="mt-1">
                      {rule.knowledge_category}
                    </Badge>
                  </div>
                  <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                    {rule.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700">{rule.current_rule}</p>
                <div className="flex gap-2 text-xs text-slate-600 pt-2">
                  <span>📜 {rule.rule_source}</span>
                  <span>🎯 Confidence: {rule.confidence_threshold}%</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}