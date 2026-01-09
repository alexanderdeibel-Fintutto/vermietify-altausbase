import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

const SWISS_CANTONS = {
  AG: { code: 'AG', name: 'Aargau', region: 'nordwest' },
  AI: { code: 'AI', name: 'Appenzell Innerrhoden', region: 'ostschweiz' },
  AR: { code: 'AR', name: 'Appenzell Ausserrhoden', region: 'ostschweiz' },
  BE: { code: 'BE', name: 'Bern', region: 'mittelland' },
  BL: { code: 'BL', name: 'Basel-Landschaft', region: 'nordwest' },
  BS: { code: 'BS', name: 'Basel-Stadt', region: 'nordwest' },
  FR: { code: 'FR', name: 'Freiburg', region: 'mittelland' },
  GE: { code: 'GE', name: 'Genf', region: 'westschweiz' },
  GL: { code: 'GL', name: 'Glarus', region: 'ostschweiz' },
  GR: { code: 'GR', name: 'Graubünden', region: 'ostschweiz' },
  JU: { code: 'JU', name: 'Jura', region: 'mittelland' },
  LU: { code: 'LU', name: 'Luzern', region: 'zentralschweiz' },
  NE: { code: 'NE', name: 'Neuenburg', region: 'westschweiz' },
  NW: { code: 'NW', name: 'Nidwalden', region: 'zentralschweiz' },
  OW: { code: 'OW', name: 'Obwalden', region: 'zentralschweiz' },
  SG: { code: 'SG', name: 'Sankt Gallen', region: 'ostschweiz' },
  SH: { code: 'SH', name: 'Schaffhausen', region: 'nordost' },
  SO: { code: 'SO', name: 'Solothurn', region: 'mittelland' },
  SZ: { code: 'SZ', name: 'Schwyz', region: 'zentralschweiz' },
  TG: { code: 'TG', name: 'Thurgau', region: 'ostschweiz' },
  TI: { code: 'TI', name: 'Tessin', region: 'tessin' },
  UR: { code: 'UR', name: 'Uri', region: 'zentralschweiz' },
  VD: { code: 'VD', name: 'Waadt', region: 'westschweiz' },
  VS: { code: 'VS', name: 'Wallis', region: 'westschweiz' },
  ZG: { code: 'ZG', name: 'Zug', region: 'zentralschweiz' },
  ZH: { code: 'ZH', name: 'Zürich', region: 'nordost' }
};

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