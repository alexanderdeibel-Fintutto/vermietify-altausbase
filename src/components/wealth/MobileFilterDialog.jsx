import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function MobileFilterDialog({ open, onOpenChange, onApply }) {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    valueRange: [0, 100000]
  });

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full">
        <DialogHeader>
          <DialogTitle>Filter</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label className="text-sm font-light">Suche</Label>
            <Input
              placeholder="Name, ISIN..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-sm font-light">Kategorie</Label>
            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="stocks">Aktien</SelectItem>
                <SelectItem value="funds">Fonds</SelectItem>
                <SelectItem value="bonds">Anleihen</SelectItem>
                <SelectItem value="crypto">Kryptowährungen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-light">Wertbereich: €{filters.valueRange[0]} - €{filters.valueRange[1]}</Label>
            <Slider
              value={filters.valueRange}
              onValueChange={(v) => setFilters({ ...filters, valueRange: v })}
              min={0}
              max={100000}
              step={1000}
              className="mt-4"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Abbrechen
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Anwenden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}