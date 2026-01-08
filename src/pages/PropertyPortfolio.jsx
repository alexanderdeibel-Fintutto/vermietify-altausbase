import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Users, DollarSign, TrendingUp } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function PropertyPortfolioPage() {
  const properties = [
    { id: 1, name: 'Hauptstr. 10', city: 'Berlin', units: 8, tenants: 7, value: '€850.000', roi: '6.2%' },
    { id: 2, name: 'Neubauweg 42', city: 'Munich', units: 12, tenants: 11, value: '€1.200.000', roi: '7.1%' },
    { id: 3, name: 'Marktplatz 5', city: 'Hamburg', units: 6, tenants: 6, value: '€625.000', roi: '5.8%' },
  ];

  const stats = [
    { label: 'Gesamtportfolio', value: properties.length },
    { label: 'Gesamtwert', value: '€2.675.000' },
    { label: 'Durchsch. ROI', value: '6.4%' },
    { label: 'Belegte Einheiten', value: '24/26' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🏘️ Immobilienportfolio</h1>
          <p className="text-slate-600 mt-1">Übersicht aller Immobilien und deren Performance</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700"><Building2 className="w-4 h-4 mr-2" />Neue Immobilie</Button>
      </div>

      <QuickStats stats={stats} accentColor="emerald" />

      <div className="grid gap-4">
        {properties.map((property) => (
          <Card key={property.id} className="border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-lg font-bold text-slate-900">{property.name}</h3>
                    <Badge className="bg-emerald-100 text-emerald-800">{property.city}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-4 ml-8">
                    <div>
                      <p className="text-xs text-slate-600">Wohneinheiten</p>
                      <p className="text-xl font-bold text-slate-900">{property.units}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Mieter</p>
                      <p className="text-xl font-bold text-slate-900">{property.tenants}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Wert</p>
                      <p className="text-lg font-bold text-slate-900">{property.value}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">ROI</p>
                      <p className="text-lg font-bold text-green-600">{property.roi}</p>
                    </div>
                  </div>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}