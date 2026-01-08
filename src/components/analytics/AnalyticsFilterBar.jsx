import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AnalyticsFilterBar({ onDateRangeChange, onMetricChange }) {
  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select onValueChange={(value) => onDateRangeChange?.(value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Zeitraum" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Diesen Monat</SelectItem>
            <SelectItem value="quarter">Dieses Quartal</SelectItem>
            <SelectItem value="year">Dieses Jahr</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Select onValueChange={(value) => onMetricChange?.(value)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Metrik" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="revenue">Einnahmen</SelectItem>
          <SelectItem value="costs">Kosten</SelectItem>
          <SelectItem value="occupancy">Belegung</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}