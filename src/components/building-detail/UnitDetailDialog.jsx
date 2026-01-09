import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';

export default function UnitDetailDialog({ unit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Einheit {unit.unit_number}</CardTitle>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <Badge className={
                unit.status === 'occupied' ? 'bg-green-100 text-green-800' :
                unit.status === 'vacant' ? 'bg-amber-100 text-amber-800' :
                'bg-blue-100 text-blue-800'
              }>
                {unit.status === 'occupied' ? 'Belegt' : unit.status === 'vacant' ? 'Frei' : 'Renovierung'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-slate-600">Etage</p>
              <p className="font-semibold text-slate-900">{unit.floor}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Wohnfläche</p>
              <p className="font-semibold text-slate-900">{unit.sqm} m²</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Zimmer</p>
              <p className="font-semibold text-slate-900">{unit.rooms}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Kaltmiete</p>
              <p className="font-semibold text-blue-600">{unit.base_rent?.toLocaleString('de-DE')}€</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Lage</p>
              <p className="font-semibold text-slate-900">
                {unit.position === 'left' ? 'Links' : unit.position === 'center' ? 'Mitte' : 'Rechts'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Ausstattung</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {unit.has_balcony ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-slate-300" />}
                <span className="text-sm">Balkon</span>
              </div>
              <div className="flex items-center gap-2">
                {unit.has_fitted_kitchen ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-slate-300" />}
                <span className="text-sm">Einbauküche</span>
              </div>
              <div className="flex items-center gap-2">
                {unit.has_basement ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-slate-300" />}
                <span className="text-sm">Keller</span>
              </div>
              <div className="flex items-center gap-2">
                {unit.has_parking ? <Check className="w-4 h-4 text-green-600" /> : <X className="w-4 h-4 text-slate-300" />}
                <span className="text-sm">Stellplatz</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="text-sm">Badezimmer: {unit.bathroom_type === 'shower' ? 'Dusche' : unit.bathroom_type === 'bathtub' ? 'Badewanne' : 'Beides'}</span>
              </div>
            </div>
          </div>

          {unit.notes && (
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Notizen</h3>
              <p className="text-sm text-slate-600">{unit.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}