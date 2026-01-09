import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TaskFilterBar({ onSearchChange, onStatusChange, onNewTask }) {
  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="Aufgaben suchen..." onChange={(e) => onSearchChange?.(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select onValueChange={(value) => onStatusChange?.(value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="open">Offen</SelectItem>
            <SelectItem value="done">Abgeschlossen</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onNewTask} className="bg-slate-700 hover:bg-slate-800 font-extralight"><Plus className="w-4 h-4 mr-2" />Neue Aufgabe</Button>
    </div>
  );
}