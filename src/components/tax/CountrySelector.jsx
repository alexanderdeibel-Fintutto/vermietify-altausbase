import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

const COUNTRIES = {
  DE: { code: 'DE', name: 'Deutschland', label: '🇩🇪 Deutschland', locale: 'de-DE', currency: 'EUR' },
  AT: { code: 'AT', name: 'Österreich', label: '🇦🇹 Österreich', locale: 'de-AT', currency: 'EUR' },
  CH: { code: 'CH', name: 'Schweiz', label: '🇨🇭 Schweiz', locale: 'de-CH', currency: 'CHF' }
};

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