import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

export default function DocumentFilterPanel({ filters, onFilterChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select 
          value={filters.category} 
          onValueChange={(v) => onFilterChange({ ...filters, category: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Kategorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            <SelectItem value="Mietrecht">Mietrecht</SelectItem>
            <SelectItem value="Verwaltung">Verwaltung</SelectItem>
            <SelectItem value="Finanzen">Finanzen</SelectItem>
            <SelectItem value="Sonstiges">Sonstiges</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.fileType} 
          onValueChange={(v) => onFilterChange({ ...filters, fileType: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Dateityp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="image">Bilder</SelectItem>
            <SelectItem value="pdf">PDFs</SelectItem>
            <SelectItem value="document">Dokumente</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.status} 
          onValueChange={(v) => onFilterChange({ ...filters, status: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="gescannt">Gescannt</SelectItem>
            <SelectItem value="erstellt">Erstellt</SelectItem>
            <SelectItem value="versendet">Versendet</SelectItem>
          </SelectContent>
        </Select>

        <div>
          <label className="text-xs font-semibold block mb-1">Datum von</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Datum bis</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}