import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Save } from 'lucide-react';

export default function AdvancedFilterPanel({ portfolio, onFilterChange }) {
  const [filters, setFilters] = useState({
    searchText: '',
    category: 'all',
    minValue: '',
    maxValue: '',
    minGain: '',
    maxGain: '',
    status: 'all'
  });
  const [savedFilters, setSavedFilters] = useState([]);

  const categories = [...new Set(portfolio.map(p => p.asset_category))];

  const applyFilters = () => {
    const filtered = portfolio.filter(item => {
      if (filters.searchText && !item.name.toLowerCase().includes(filters.searchText.toLowerCase())) return false;
      if (filters.category !== 'all' && item.asset_category !== filters.category) return false;
      if (filters.status !== 'all' && item.status !== filters.status) return false;
      
      const total = item.quantity * item.current_value;
      if (filters.minValue && total < parseFloat(filters.minValue)) return false;
      if (filters.maxValue && total > parseFloat(filters.maxValue)) return false;

      const gain = total - (item.quantity * item.purchase_price);
      if (filters.minGain && gain < parseFloat(filters.minGain)) return false;
      if (filters.maxGain && gain > parseFloat(filters.maxGain)) return false;

      return true;
    });
    onFilterChange(filtered);
  };

  const saveFilter = () => {
    const name = `Filter ${new Date().toLocaleDateString()}`;
    setSavedFilters([...savedFilters, { name, ...filters }]);
  };

  const loadFilter = (filter) => {
    setFilters({ ...filter });
  };

  React.useEffect(() => {
    applyFilters();
  }, [filters]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erweiterte Filterung</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-light">Suche</Label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Name, ISIN..."
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                className="flex-1"
              />
              <Search className="w-4 h-4 text-slate-400 mt-2" />
            </div>
          </div>

          <div>
            <Label className="text-sm font-light">Kategorie</Label>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-light">Status</Label>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="sold">Verkauft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-light">Wert von</Label>
            <Input type="number" placeholder="€" value={filters.minValue} onChange={(e) => setFilters({ ...filters, minValue: e.target.value })} className="mt-1" />
          </div>

          <div>
            <Label className="text-sm font-light">Wert bis</Label>
            <Input type="number" placeholder="€" value={filters.maxValue} onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })} className="mt-1" />
          </div>

          <div>
            <Label className="text-sm font-light">Gewinn/Verlust</Label>
            <div className="flex gap-2 mt-1">
              <Input type="number" placeholder="von" value={filters.minGain} onChange={(e) => setFilters({ ...filters, minGain: e.target.value })} />
              <Input type="number" placeholder="bis" value={filters.maxGain} onChange={(e) => setFilters({ ...filters, maxGain: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setFilters({ searchText: '', category: 'all', minValue: '', maxValue: '', minGain: '', maxGain: '', status: 'all' })}>
            <X className="w-4 h-4 mr-2" /> Zurücksetzen
          </Button>
          <Button onClick={saveFilter} className="gap-2">
            <Save className="w-4 h-4" /> Filter speichern
          </Button>
        </div>

        {savedFilters.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-xs text-slate-600 mb-2">Gespeicherte Filter:</p>
            <div className="flex gap-2 flex-wrap">
              {savedFilters.map((f, i) => (
                <Button key={i} variant="outline" size="sm" onClick={() => loadFilter(f)}>{f.name}</Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}