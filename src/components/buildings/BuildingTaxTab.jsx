import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, Landmark } from 'lucide-react';

export default function BuildingTaxTab({ building }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Grundbuch */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-slate-600" />
            <CardTitle>Grundbuchdaten</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Grundbuch-Blatt</p>
            <p className="font-medium">{building.grundbuch_blatt || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Amtsgericht</p>
            <p className="font-medium">{building.grundbuch_amtsgericht || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Flurstück</p>
            <p className="font-medium">{building.flurstueck_nummer || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Grundsteuer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Landmark className="w-5 h-5 text-slate-600" />
            <CardTitle>Grundsteuer</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Einheitswert</p>
            <p className="font-medium">{formatCurrency(building.einheitswert)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Messbetrag</p>
            <p className="font-medium">{formatCurrency(building.grundsteuer_messbetrag)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Hebesatz</p>
            <p className="font-medium">{building.grundsteuer_hebesatz ? `${building.grundsteuer_hebesatz}%` : '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Besonderheiten */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-slate-600" />
            <CardTitle>Steuerliche Besonderheiten</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {building.denkmalschutz && (
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-100 text-amber-700">Denkmalschutz</Badge>
              <p className="text-sm text-slate-600">Erhöhte AfA möglich (9% für Sanierungskosten)</p>
            </div>
          )}
          {building.sanierungsgebiet && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">Sanierungsgebiet</Badge>
              <p className="text-sm text-slate-600">Erhöhte AfA möglich</p>
            </div>
          )}
          {!building.denkmalschutz && !building.sanierungsgebiet && (
            <p className="text-sm text-slate-500">Keine steuerlichen Besonderheiten</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}