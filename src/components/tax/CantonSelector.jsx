import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SWISS_CANTONS } from '@/utils/taxLocalization';
import { MapPin } from 'lucide-react';

export default function CantonSelector({ value, onChange, label = 'Kanton' }) {
  const cantonList = Object.values(SWISS_CANTONS).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {label}
      </label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Kanton wählen..." />
        </SelectTrigger>
        <SelectContent>
          {cantonList.map(canton => (
            <SelectItem key={canton.code} value={canton.code}>
              {canton.name} ({canton.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}