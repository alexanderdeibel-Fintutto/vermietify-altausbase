import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PageSetupPanel({ pageSetup, onChange }) {
  const paperSizes = {
    a4: { width: 210, height: 297, label: 'A4' },
    letter: { width: 216, height: 279, label: 'Letter' },
    legal: { width: 216, height: 356, label: 'Legal' },
    custom: { width: 210, height: 297, label: 'Custom' }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
      <h3 className="font-semibold text-sm">Seiten-Einstellungen</h3>

      <div>
        <Label className="text-xs">Papierformat</Label>
        <Select value={pageSetup.format || 'a4'} onValueChange={(v) => onChange({ ...pageSetup, format: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a4">A4</SelectItem>
            <SelectItem value="letter">Letter</SelectItem>
            <SelectItem value="legal">Legal</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Breite (mm)</Label>
          <Input
            type="number"
            value={pageSetup.width || 210}
            onChange={(e) => onChange({ ...pageSetup, width: parseInt(e.target.value) })}
            className="h-8 text-xs"
            min="100"
            max="400"
          />
        </div>
        <div>
          <Label className="text-xs">Höhe (mm)</Label>
          <Input
            type="number"
            value={pageSetup.height || 297}
            onChange={(e) => onChange({ ...pageSetup, height: parseInt(e.target.value) })}
            className="h-8 text-xs"
            min="100"
            max="500"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div>
          <Label className="text-xs">Oben (mm)</Label>
          <Input
            type="number"
            value={pageSetup.marginTop || 20}
            onChange={(e) => onChange({ ...pageSetup, marginTop: parseInt(e.target.value) })}
            className="h-8 text-xs"
            min="0"
            max="50"
          />
        </div>
        <div>
          <Label className="text-xs">Rechts (mm)</Label>
          <Input
            type="number"
            value={pageSetup.marginRight || 20}
            onChange={(e) => onChange({ ...pageSetup, marginRight: parseInt(e.target.value) })}
            className="h-8 text-xs"
            min="0"
            max="50"
          />
        </div>
        <div>
          <Label className="text-xs">Unten (mm)</Label>
          <Input
            type="number"
            value={pageSetup.marginBottom || 20}
            onChange={(e) => onChange({ ...pageSetup, marginBottom: parseInt(e.target.value) })}
            className="h-8 text-xs"
            min="0"
            max="50"
          />
        </div>
        <div>
          <Label className="text-xs">Links (mm)</Label>
          <Input
            type="number"
            value={pageSetup.marginLeft || 20}
            onChange={(e) => onChange({ ...pageSetup, marginLeft: parseInt(e.target.value) })}
            className="h-8 text-xs"
            min="0"
            max="50"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Ausrichtung</Label>
        <Select value={pageSetup.orientation || 'portrait'} onValueChange={(v) => onChange({ ...pageSetup, orientation: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="portrait">Hochformat</SelectItem>
            <SelectItem value="landscape">Querformat</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}