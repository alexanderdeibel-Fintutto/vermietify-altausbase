import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, X } from 'lucide-react';
import TemplateCard from './TemplateCard';
import CreateFromTemplateDialog from './CreateFromTemplateDialog';

export default function WorkflowTemplateLibrary({ companyId, onTemplateSelected }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const { data: searchResults = {}, isLoading } = useQuery({
    queryKey: ['template-search', companyId, searchQuery, selectedCategory, selectedTags, selectedDifficulty],
    queryFn: () =>
      base44.functions.invoke('searchWorkflowTemplates', {
        company_id: companyId,
        search_query: searchQuery,
        category: selectedCategory || undefined,
        tags: selectedTags,
        difficulty: selectedDifficulty || undefined,
        limit: 50
      }).then(res => res.data)
  });

  const templates = searchResults.templates || [];
  const metadata = searchResults.metadata || {};

  const handleUse = (template) => {
    setSelectedTemplate(template);
    setShowCreateDialog(true);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Suche nach Templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Alle Kategorien</SelectItem>
            {metadata.categories?.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Schwierigkeit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>Alle Schwierigkeiten</SelectItem>
            <SelectItem value="beginner">Anfänger</SelectItem>
            <SelectItem value="intermediate">Fortgeschritten</SelectItem>
            <SelectItem value="advanced">Experte</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer gap-1"
              onClick={() => toggleTag(tag)}
            >
              {tag}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Tag Suggestions */}
      {metadata.tags?.length > 0 && selectedTags.length < 3 && (
        <div className="flex flex-wrap gap-1">
          <p className="text-xs text-slate-600 w-full">Beliebte Tags:</p>
          {metadata.tags.slice(0, 8).map(tag => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer"
              onClick={() => toggleTag(tag)}
            >
              + {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="text-center py-8">Lädt Templates...</div>
      ) : templates.length === 0 ? (
        <Card className="bg-slate-50">
          <CardContent className="pt-6 text-center text-slate-500">
            Keine Templates gefunden
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
            />
          ))}
        </div>
      )}

      {/* Dialog */}
      {showCreateDialog && selectedTemplate && (
        <CreateFromTemplateDialog
          template={selectedTemplate}
          companyId={companyId}
          onClose={() => {
            setShowCreateDialog(false);
            setSelectedTemplate(null);
          }}
          onSuccess={() => {
            setShowCreateDialog(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Results Info */}
      {templates.length > 0 && (
        <p className="text-xs text-slate-600 text-center">
          {templates.length} von {searchResults.metadata?.total_count || 0} Templates
        </p>
      )}
    </div>
  );
}