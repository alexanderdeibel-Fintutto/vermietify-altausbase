import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from "lucide-react";

export default function VisualizationFilters({ 
  buildings, 
  selectedBuilding, 
  onBuildingChange, 
  sortBy, 
  onSortChange,
  timeRange,
  onTimeRangeChange,
  onReset 
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filter & Sortierung</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Gebäude</label>
          <Select value={selectedBuilding} onValueChange={onBuildingChange}>
            <SelectTrigger>
              <SelectValue placeholder="Alle Gebäude" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Gebäude</SelectItem>
              {buildings?.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Zeitraum</label>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Diesen Monat</SelectItem>
              <SelectItem value="quarter">Dieses Quartal</SelectItem>
              <SelectItem value="year">Dieses Jahr</SelectItem>
              <SelectItem value="all">Alle Zeit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Sortierung</label>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="value">Wert (absteigend)</SelectItem>
              <SelectItem value="recent">Zuletzt aktualisiert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onReset}
            className="w-full flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Zurücksetzen
          </Button>
        </div>
      </div>
    </div>
  );
}