import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CostTypeFilterBar({ onSearchChange, onCategoryChange, onNewCostType }) {
  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="Kostenarten suchen..." onChange={(e) => onSearchChange?.(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select onValueChange={(value) => onCategoryChange?.(value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Kategorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="maintenance">Instandhaltung</SelectItem>
            <SelectItem value="utilities">Nebenkosten</SelectItem>
            <SelectItem value="insurance">Versicherung</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onNewCostType} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Neue Kostenart</Button>
    </div>
  );
}