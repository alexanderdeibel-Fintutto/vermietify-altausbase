import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdvancedFilterPanel({ onResults }) {
  const [filters, setFilters] = useState({
    form_types: [],
    statuses: [],
    year_from: null,
    year_to: null,
    has_errors: null,
    confidence_min: null,
    confidence_max: null
  });
  const [searching, setSearching] = useState(false);

  const handleApplyFilters = async () => {
    setSearching(true);
    try {
      const response = await base44.functions.invoke('advancedFilterSubmissions', {
        filters
      });

      if (response.data.success) {
        onResults(response.data.submissions);
        toast.success(`${response.data.count} Ergebnisse gefunden`);
      }
    } catch (error) {
      toast.error('Filter fehlgeschlagen');
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const toggleFormType = (type) => {
    setFilters(prev => ({
      ...prev,
      form_types: prev.form_types.includes(type)
        ? prev.form_types.filter(t => t !== type)
        : [...prev.form_types, type]
    }));
  };

  const toggleStatus = (status) => {
    setFilters(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Erweiterte Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs mb-2">Formular-Typ</Label>
          <div className="space-y-2">
            {['ANLAGE_V', 'EUER', 'EST1B', 'GEWERBESTEUER', 'UMSATZSTEUER'].map(type => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  checked={filters.form_types.includes(type)}
                  onCheckedChange={() => toggleFormType(type)}
                />
                <span className="text-sm">{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs mb-2">Status</Label>
          <div className="space-y-2">
            {['DRAFT', 'VALIDATED', 'SUBMITTED', 'ACCEPTED'].map(status => (
              <div key={status} className="flex items-center gap-2">
                <Checkbox
                  checked={filters.statuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                />
                <span className="text-sm">{status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Jahr von</Label>
            <Input
              type="number"
              placeholder="2020"
              value={filters.year_from || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, year_from: parseInt(e.target.value) || null }))}
            />
          </div>
          <div>
            <Label className="text-xs">Jahr bis</Label>
            <Input
              type="number"
              placeholder="2024"
              value={filters.year_to || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, year_to: parseInt(e.target.value) || null }))}
            />
          </div>
        </div>

        <Button onClick={handleApplyFilters} disabled={searching} className="w-full">
          {searching ? 'Suche...' : 'Filter anwenden'}
        </Button>
      </CardContent>
    </Card>
  );
}