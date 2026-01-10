import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

export default function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  documentTypes = [],
  tags = [],
  statuses = [],
  users = []
}) {
  const addTagFilter = (tag) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      onFiltersChange({
        ...filters,
        tags: [...currentTags, tag]
      });
    }
  };

  const removeTagFilter = (tag) => {
    const currentTags = filters.tags || [];
    onFiltersChange({
      ...filters,
      tags: currentTags.filter(t => t !== tag)
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card className="bg-slate-50">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-900">Filter</span>
          </div>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={clearFilters} className="text-xs">
              Alle zurücksetzen
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Date From */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Von Datum</label>
            <Input
              type="date"
              value={filters.from_date || ''}
              onChange={(e) => onFiltersChange({ ...filters, from_date: e.target.value })}
              className="text-xs h-8"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Bis Datum</label>
            <Input
              type="date"
              value={filters.to_date || ''}
              onChange={(e) => onFiltersChange({ ...filters, to_date: e.target.value })}
              className="text-xs h-8"
            />
          </div>

          {/* Document Type */}
          {documentTypes.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Dokumenttyp</label>
              <Select value={filters.document_type || ''} onValueChange={(value) => onFiltersChange({ ...filters, document_type: value })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          {statuses.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Status</label>
              <Select value={filters.status || ''} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Assigned To */}
          {users.length > 0 && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">Zugewiesen</label>
              <Select value={filters.assigned_to || ''} onValueChange={(value) => onFiltersChange({ ...filters, assigned_to: value })}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Alle</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-700">Priorität</label>
            <Select value={filters.priority || ''} onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Alle</SelectItem>
                <SelectItem value="low">Niedrig</SelectItem>
                <SelectItem value="medium">Mittel</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="urgent">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags Filter */}
        {tags.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-slate-700 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Button
                  key={tag}
                  size="sm"
                  variant={filters.tags?.includes(tag) ? 'default' : 'outline'}
                  onClick={() => {
                    if (filters.tags?.includes(tag)) {
                      removeTagFilter(tag);
                    } else {
                      addTagFilter(tag);
                    }
                  }}
                  className="text-xs h-7"
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}