import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { X } from 'lucide-react';

export default function TemplateFilters({
  categories,
  difficulties,
  availableTags,
  selectedCategory,
  selectedDifficulty,
  selectedTags,
  onCategoryChange,
  onDifficultyChange,
  onTagToggle
}) {
  return (
    <Card className="bg-slate-50">
      <CardContent className="pt-6 space-y-4">
        {/* Category Filter */}
        <div>
          <label className="text-sm font-medium block mb-2">Kategorie</label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Kategorien</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="text-sm font-medium block mb-2">Schwierigkeitsstufe</label>
          <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Alle Stufen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Alle Stufen</SelectItem>
              <SelectItem value="beginner">Anfänger</SelectItem>
              <SelectItem value="intermediate">Mittel</SelectItem>
              <SelectItem value="advanced">Fortgeschrittene</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div>
            <label className="text-sm font-medium block mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  className={`cursor-pointer transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                  onClick={() => onTagToggle(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}