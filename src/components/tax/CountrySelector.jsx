import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { COUNTRIES } from '@/utils/taxLocalization';
import { Globe } from 'lucide-react';

export default function CountrySelector({ value, onChange, label = 'Steuerjahr Land' }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Globe className="w-4 h-4" />
        {label}
      </label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Land wählen..." />
        </SelectTrigger>
        <SelectContent>
          {Object.values(COUNTRIES).map(country => (
            <SelectItem key={country.code} value={country.code}>
              {country.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}