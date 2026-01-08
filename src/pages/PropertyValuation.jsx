import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Home } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function PropertyValuationPage() {
  const valuationData = [
    { year: 2020, value: 850000, market: 820000 },
    { year: 2021, value: 895000, market: 880000 },
    { year: 2022, value: 945000, market: 930000 },
    { year: 2023, value: 1020000, market: 1010000 },
    { year: 2024, value: 1125000, market: 1115000 },
    { year: 2025, value: 1245000, market: 1240000 },
  ];

  const properties = [
    { id: 1, name: 'Hauptgebäude', valuation: '€1.245.000', change: '+12.5%', units: 12 },
    { id: 2, name: 'Nebengebäude', valuation: '€245.000', change: '+8.2%', units: 3 },
  ];

  const stats = [
    { label: 'Gesamtwert', value: '€1.490.000' },
    { label: 'YoY Wachstum', value: '+10.8%' },
    { label: 'Marktvergleich', value: '+0.4%' },
    { label: 'Letzte Bewertung', value: '08.01.2026' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏠 Immobilienbewertung</h1>
        <p className="text-slate-600 mt-1">Aktuelle Marktbewertung und Wertentwicklung</p>
      </div>

      <QuickStats stats={stats} accentColor="blue" />

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Wertentwicklung</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={valuationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Bewertung" />
              <Line type="monotone" dataKey="market" stroke="#10b981" strokeWidth={2} name="Marktpreis" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-semibold text-slate-900 mb-3">Objekte im Portfolio</h3>
        <div className="space-y-3">
          {properties.map((prop) => (
            <Card key={prop.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Home className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">{prop.name}</p>
                      <p className="text-xs text-slate-600">{prop.units} Einheiten</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{prop.valuation}</p>
                    <Badge className="bg-green-600 text-xs">{prop.change}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}