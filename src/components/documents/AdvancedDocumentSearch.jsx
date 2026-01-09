import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Calendar, Tag, FileType } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function AdvancedDocumentSearch({ onSearch }) {
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    documentType: 'all',
    dateFrom: '',
    dateTo: '',
    tags: [],
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({
      searchText,
      ...filters
    });
  };

  const addTag = (tag) => {
    if (tag && !filters.tags.includes(tag)) {
      setFilters({ ...filters, tags: [...filters.tags, tag] });
    }
  };

  const removeTag = (tag) => {
    setFilters({ ...filters, tags: filters.tags.filter(t => t !== tag) });
  };

  const clearFilters = () => {
    setFilters({
      documentType: 'all',
      dateFrom: '',
      dateTo: '',
      tags: [],
      status: 'all'
    });
    setSearchText('');
    onSearch({});
  };

  const activeFiltersCount = [
    filters.documentType !== 'all',
    filters.dateFrom,
    filters.dateTo,
    filters.tags.length > 0,
    filters.status !== 'all'
  ].filter(Boolean).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="w-5 h-5" />
          Erweiterte Suche
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Suche nach Titel, Beschreibung oder Inhalt..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-blue-600">{activeFiltersCount}</Badge>
            )}
          </Button>
          <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
            {/* Document Type */}
            <div>
              <label className="text-xs font-medium mb-2 flex items-center gap-1">
                <FileType className="w-3 h-3" />
                Dokumenttyp
              </label>
              <Select value={filters.documentType} onValueChange={(v) => setFilters({ ...filters, documentType: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="contract">Verträge</SelectItem>
                  <SelectItem value="invoice">Rechnungen</SelectItem>
                  <SelectItem value="receipt">Belege</SelectItem>
                  <SelectItem value="report">Berichte</SelectItem>
                  <SelectItem value="correspondence">Korrespondenz</SelectItem>
                  <SelectItem value="other">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-xs font-medium mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Von Datum
              </label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-xs font-medium mb-2 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Bis Datum
              </label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Schlagwörter
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {filters.tags.map(tag => (
                  <Badge key={tag} className="bg-blue-100 text-blue-800 gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tag className="w-3 h-3 mr-2" />
                    Schlagwort hinzufügen
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <p className="text-xs font-medium">Häufige Schlagwörter:</p>
                    {['Mietvertrag', 'Nebenkostenabrechnung', 'Kaution', 'Wartung', 'Versicherung'].map(tag => (
                      <Button
                        key={tag}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={clearFilters}>
                Filter zurücksetzen
              </Button>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                Suche anwenden
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}