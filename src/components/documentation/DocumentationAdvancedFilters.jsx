import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter, X, Calendar, HardDrive, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentationAdvancedFilters({ 
  filters, 
  onFiltersChange, 
  documentations = [] 
}) {
  const [showFilters, setShowFilters] = React.useState(false);
  const activeFilterCount = Object.values(filters).filter(v => v).length;

  const handleStatusFilter = (status) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? null : status
    });
  };

  const handleDateFilter = (days) => {
    onFiltersChange({
      ...filters,
      daysOld: filters.daysOld === days ? null : days
    });
  };

  const handleSizeFilter = (range) => {
    onFiltersChange({
      ...filters,
      sizeRange: filters.sizeRange === range ? null : range
    });
  };

  const handleClearAll = () => {
    onFiltersChange({
      status: null,
      daysOld: null,
      sizeRange: null
    });
  };

  const getDocsByStatus = (status) => {
    return documentations.filter(d => d.status === status).length;
  };

  const getDocsByAge = (days) => {
    const now = new Date();
    return documentations.filter(d => {
      if (!d.last_generated_at) return false;
      const docDate = new Date(d.last_generated_at);
      const ageInDays = (now - docDate) / (1000 * 60 * 60 * 24);
      return ageInDays <= days;
    }).length;
  };

  const getDocsBySize = (range) => {
    return documentations.filter(d => {
      const kb = (d.file_size_bytes || 0) / 1024;
      if (range === 'small') return kb <= 100;
      if (range === 'medium') return kb > 100 && kb <= 500;
      if (range === 'large') return kb > 500;
      return false;
    }).length;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-emerald-600 hover:bg-emerald-700" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filter erweitern
          {activeFilterCount > 0 && (
            <Badge className="ml-2 bg-yellow-600 text-white">{activeFilterCount}</Badge>
          )}
        </Button>
        
        {activeFilterCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Alle Filter zurücksetzen
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="bg-slate-50">
          <CardContent className="p-4 space-y-4">
            {/* Status Filter */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2">Nach Status filtern</p>
              <div className="flex gap-2 flex-wrap">
                {['completed', 'generating', 'error'].map(status => (
                  <Button
                    key={status}
                    variant={filters.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusFilter(status)}
                    className={filters.status === status ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  >
                    {status === 'completed' && '✅ Erstellt'}
                    {status === 'generating' && '⏳ In Arbeit'}
                    {status === 'error' && '❌ Fehler'}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {getDocsByStatus(status)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Nach Alter filtern
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { days: 1, label: '< 1 Tag' },
                  { days: 7, label: '< 1 Woche' },
                  { days: 30, label: '< 1 Monat' }
                ].map(({ days, label }) => (
                  <Button
                    key={days}
                    variant={filters.daysOld === days ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDateFilter(days)}
                    className={filters.daysOld === days ? "bg-blue-600 hover:bg-blue-700" : ""}
                  >
                    {label}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {getDocsByAge(days)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                Nach Größe filtern
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { range: 'small', label: 'Klein (< 100 KB)' },
                  { range: 'medium', label: 'Mittel (100 - 500 KB)' },
                  { range: 'large', label: 'Groß (> 500 KB)' }
                ].map(({ range, label }) => (
                  <Button
                    key={range}
                    variant={filters.sizeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSizeFilter(range)}
                    className={filters.sizeRange === range ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    {label}
                    <Badge variant="outline" className="ml-2 text-xs">
                      {getDocsBySize(range)}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}