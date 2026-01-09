import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, MapPin, Ruler } from 'lucide-react';

export default function BuildingInfoPanel({ building }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Grunddaten
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Name</p>
            <p className="font-semibold text-slate-900">{building.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Baujahr</p>
            <p className="font-semibold text-slate-900">{building.year_built || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Nutzungsart</p>
            <p className="font-semibold text-slate-900">{building.usage_type || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Rechtsform</p>
            <p className="font-semibold text-slate-900">{building.owner_legal_form || '-'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-slate-600">Adresse</p>
            <p className="font-semibold text-slate-900">
              {building.address} {building.house_number}, {building.postal_code} {building.city}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Flächen & Einheiten
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Gesamteinheiten</p>
            <p className="font-semibold text-slate-900">{building.total_units || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Gesamtfläche</p>
            <p className="font-semibold text-slate-900">{building.total_sqm || 0} m²</p>
          </div>
          {building.garages_parking_spaces > 0 && (
            <div>
              <p className="text-sm text-slate-600">Stellplätze</p>
              <p className="font-semibold text-slate-900">{building.garages_parking_spaces}</p>
            </div>
          )}
          {building.notes && (
            <div className="col-span-2">
              <p className="text-sm text-slate-600">Notizen</p>
              <p className="text-sm text-slate-900">{building.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {building.kubatur && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kubatur</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-600">Länge</p>
              <p className="font-semibold text-slate-900">{building.kubatur.grundriss_laenge} m</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Breite</p>
              <p className="font-semibold text-slate-900">{building.kubatur.grundriss_breite} m</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Geschosse</p>
              <p className="font-semibold text-slate-900">{building.kubatur.anzahl_vollgeschosse}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Geschosshöhe</p>
              <p className="font-semibold text-slate-900">{building.kubatur.geschosshoehe_standard} m</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}