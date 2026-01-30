import React, { useState } from 'react';
import { Search, Filter, Save, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdvancedSearchPanel({ onSearch, onSaveSearch, savedSearches = [] }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch({ query, filters });
  };

  const handleSave = () => {
    const name = prompt('Name für gespeicherte Suche:');
    if (name) {
      onSaveSearch({ name, query, filters });
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Main Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Suchen..."
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
            Suchen
          </Button>
          <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)} className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-3">
                <Select
                  value={filters.type}
                  onValueChange={(val) => setFilters({ ...filters, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Typ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Typen</SelectItem>
                    <SelectItem value="building">Gebäude</SelectItem>
                    <SelectItem value="tenant">Mieter</SelectItem>
                    <SelectItem value="contract">Vertrag</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status}
                  onValueChange={(val) => setFilters({ ...filters, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="gap-1"
                >
                  <X className="w-3 h-3" />
                  Filter zurücksetzen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className="gap-1"
                >
                  <Save className="w-3 h-3" />
                  Suche speichern
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}