import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SupplierFilterBar({ onSearchChange, onCategoryChange, onNewSupplier }) {
  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="Lieferanten suchen..." onChange={(e) => onSearchChange?.(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select onValueChange={(value) => onCategoryChange?.(value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Kategorie" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="maintenance">Instandhaltung</SelectItem>
            <SelectItem value="cleaning">Reinigung</SelectItem>
            <SelectItem value="utility">Nebenkosten</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onNewSupplier} className="bg-lime-600 hover:bg-lime-700"><Plus className="w-4 h-4 mr-2" />Neuer Lieferant</Button>
    </div>
  );
}