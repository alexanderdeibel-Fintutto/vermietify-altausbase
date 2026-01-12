import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Leaf } from 'lucide-react';

export default function BuildingTechnicalTab({ building }) {
  return (
    <div className="space-y-6">
      {/* Heizung */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-slate-600" />
            <CardTitle>Heizung & Warmwasser</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Heizungsart</p>
            <p className="font-medium">{building.heizungsart || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Heizungsbaujahr</p>
            <p className="font-medium">{building.heizungsbaujahr || '-'}</p>
          </div>
          {building.heizungsbaujahr && (
            <div>
              <p className="text-xs text-slate-500">Alter</p>
              <p className="font-medium">{new Date().getFullYear() - building.heizungsbaujahr} Jahre</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Energie */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Leaf className="w-5 h-5 text-slate-600" />
            <CardTitle>Energieeffizienz</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500">Energieausweis-Typ</p>
            <p className="font-medium">{building.energieausweis_typ || 'Keiner'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Effizienzklasse</p>
            {building.energieeffizienzklasse ? (
              <Badge 
                className={
                  ['A+', 'A', 'B'].includes(building.energieeffizienzklasse) 
                    ? 'bg-green-100 text-green-700' 
                    : ['C', 'D', 'E'].includes(building.energieeffizienzklasse)
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {building.energieeffizienzklasse}
              </Badge>
            ) : (
              <p className="font-medium">-</p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">Energiekennwert</p>
            <p className="font-medium">{building.energiekennwert ? `${building.energiekennwert} kWh/(m²·a)` : '-'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}