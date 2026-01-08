import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NotificationFilterBar({ onSearchChange, onTypeChange, onStatusChange }) {
  return (
    <div className="flex gap-4 flex-wrap items-center mb-6">
      <div className="flex-1 min-w-64">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input placeholder="Benachrichtigungen suchen..." onChange={(e) => onSearchChange?.(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400" />
        <Select onValueChange={(value) => onTypeChange?.(value)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Typ" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="payment">Zahlung</SelectItem>
            <SelectItem value="contract">Vertrag</SelectItem>
            <SelectItem value="maintenance">Wartung</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Select onValueChange={(value) => onStatusChange?.(value)}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alle</SelectItem>
          <SelectItem value="unread">Ungelesen</SelectItem>
          <SelectItem value="read">Gelesen</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}