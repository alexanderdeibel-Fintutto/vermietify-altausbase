import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ActivityLogFilterBar({ onSearchChange, onActionChange, onDateChange }) {
  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="Aktivitäten suchen..." onChange={(e) => onSearchChange?.(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select onValueChange={(value) => onActionChange?.(value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Aktion" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="create">Erstellt</SelectItem>
            <SelectItem value="update">Aktualisiert</SelectItem>
            <SelectItem value="delete">Gelöscht</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Select onValueChange={(value) => onDateChange?.(value)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Zeitraum" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Heute</SelectItem>
          <SelectItem value="week">Diese Woche</SelectItem>
          <SelectItem value="month">Diesen Monat</SelectItem>
          <SelectItem value="all">Alle</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}