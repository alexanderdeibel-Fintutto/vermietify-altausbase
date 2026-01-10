import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import TemplateCard from './TemplateCard';
import TemplateFilters from './TemplateFilters';

export default function WorkflowTemplateCatalog({ companyId, onTemplateSelected }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search-templates', companyId, searchQuery, selectedCategory, selectedDifficulty, selectedTags],
    queryFn: () =>
      base44.functions.invoke('searchWorkflowTemplates', {
        company_id: companyId,
        search_query: searchQuery,
        category: selectedCategory || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        difficulty: selectedDifficulty || undefined
      }).then(res => res.data)
  });

  const templates = searchResults?.templates || [];
  const filters = searchResults?.filters || {};

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <Input
          placeholder="Templates durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Filters */}
      <TemplateFilters
        categories={filters.categories || []}
        difficulties={filters.difficulties || []}
        availableTags={filters.tags || []}
        selectedCategory={selectedCategory}
        selectedDifficulty={selectedDifficulty}
        selectedTags={selectedTags}
        onCategoryChange={setSelectedCategory}
        onDifficultyChange={setSelectedDifficulty}
        onTagToggle={toggleTag}
      />

      {/* Results */}
      <div>
        <p className="text-sm text-slate-600 mb-4">
          {templates.length} Template{templates.length !== 1 ? 's' : ''} gefunden
        </p>

        {templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">Keine Templates gefunden</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onSelect={onTemplateSelected}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}