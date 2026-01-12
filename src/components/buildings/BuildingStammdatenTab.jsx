import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Ruler, Home } from 'lucide-react';

export default function BuildingStammdatenTab({ building }) {
  const formatNumber = (num) => num?.toLocaleString('de-DE') || '-';

  return (
    <div className="space-y-6">
      {/* Adresse */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-600" />
            <CardTitle>Adresse & Standort</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Straße</p>
            <p className="font-medium">{building.address || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">PLZ</p>
            <p className="font-medium">{building.postal_code || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Ort</p>
            <p className="font-medium">{building.city || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Bundesland</p>
            <p className="font-medium">{building.bundesland || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Land</p>
            <p className="font-medium">{building.land || 'Deutschland'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Objektdaten */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-slate-600" />
            <CardTitle>Objektdaten</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Objekttyp</p>
            <Badge variant="outline">{building.objekttyp || '-'}</Badge>
          </div>
          <div>
            <p className="text-xs text-slate-500">Eigentumsart</p>
            <Badge variant="outline">{building.eigentumsart || '-'}</Badge>
          </div>
          <div>
            <p className="text-xs text-slate-500">Baujahr</p>
            <p className="font-medium">{building.year_built || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Letzte Sanierung</p>
            <p className="font-medium">{building.letzte_sanierung || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Status</p>
            <Badge className={building.objekt_status === 'Aktiv' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}>
              {building.objekt_status || 'Aktiv'}
            </Badge>
          </div>
          {building.denkmalschutz && (
            <div>
              <p className="text-xs text-slate-500">Besonderheit</p>
              <Badge className="bg-amber-100 text-amber-700">Denkmalschutz</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flächen */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Ruler className="w-5 h-5 text-slate-600" />
            <CardTitle>Flächen & Einheiten</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Wohnfläche gesamt</p>
            <p className="font-medium text-lg">{formatNumber(building.gesamtflaeche_wohn)} m²</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Nutzfläche</p>
            <p className="font-medium">{formatNumber(building.gesamtflaeche_nutz)} m²</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Grundstück</p>
            <p className="font-medium">{formatNumber(building.grundstueck_qm)} m²</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Wohneinheiten</p>
            <p className="font-medium text-lg">{building.total_units || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Gewerbeeinheiten</p>
            <p className="font-medium">{building.anzahl_gewerbeeinheiten || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Stellplätze</p>
            <p className="font-medium">{building.anzahl_stellplaetze || 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Etagen</p>
            <p className="font-medium">{building.anzahl_etagen || '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}