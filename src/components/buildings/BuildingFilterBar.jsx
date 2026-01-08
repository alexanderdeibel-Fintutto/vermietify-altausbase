import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';

export default function BuildingFilterBar({
  buildings,
  onStatusChange,
  onCityChange,
  onSearchChange,
  onNewBuilding,
  filters = {}
}) {
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(buildings.map(b => b.city).filter(Boolean))];
    return uniqueCities.sort();
  }, [buildings]);

  const getOccupancyStatus = (occupancy) => {
    if (occupancy === 100) return 'full';
    if (occupancy > 50) return 'partial';
    return 'empty';
  };

  const statusOptions = {
    all: 'Alle Status',
    full: 'Voll vermietet',
    partial: 'Teilvermietet',
    empty: 'Leer'
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-50 border-b border-slate-200">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Status:</span>
          <Select onValueChange={onStatusChange} defaultValue={filters.status || 'all'}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusOptions).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Ort:</span>
          <Select onValueChange={onCityChange} defaultValue={filters.city || 'all'}>
            <SelectTrigger className="w-40 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Orte</SelectItem>
              {cities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <Input
            placeholder="Gebäude-Name oder Adresse..."
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 text-sm"
          />
        </div>

        {/* New Button */}
        <Button
          onClick={onNewBuilding}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 h-9 whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-1" />
          Neu
        </Button>
      </div>
    </div>
  );
}