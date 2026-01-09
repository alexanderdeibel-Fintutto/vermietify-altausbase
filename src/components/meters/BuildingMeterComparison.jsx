import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, AlertCircle } from 'lucide-react';

export default function BuildingMeterComparison({ buildings, allMeters }) {
  const [selectedMetric, setSelectedMetric] = useState('average');

  // Calculate comparison data
  const comparisonData = buildings.map(building => {
    const buildingMeters = allMeters.filter(m => m.building_id === building.id);
    const metersWithReadings = buildingMeters.filter(m => m.current_reading);
    
    const avgReading = metersWithReadings.length > 0
      ? metersWithReadings.reduce((acc, m) => acc + (m.current_reading || 0), 0) / metersWithReadings.length
      : 0;

    const readingRate = buildingMeters.length > 0
      ? (metersWithReadings.length / buildingMeters.length) * 100
      : 0;

    return {
      name: building.name,
      id: building.id,
      totalMeters: buildingMeters.length,
      metersWithReadings: metersWithReadings.length,
      avgReading: Math.round(avgReading),
      readingRate: Math.round(readingRate),
      efficiency: readingRate >= 80 ? 'high' : readingRate >= 50 ? 'medium' : 'low'
    };
  }).filter(d => d.totalMeters > 0);

  // Sort by selected metric
  const sortedData = [...comparisonData].sort((a, b) => {
    if (selectedMetric === 'average') return b.avgReading - a.avgReading;
    if (selectedMetric === 'rate') return b.readingRate - a.readingRate;
    return b.totalMeters - a.totalMeters;
  });

  // Find best and worst performers
  const bestPerformer = sortedData.reduce((best, current) => 
    current.readingRate > (best?.readingRate || 0) ? current : best, null);
  
  const needsAttention = sortedData.filter(d => d.readingRate < 50);

  return (
    <div className="space-y-6">
      {/* Metric Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('average')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                selectedMetric === 'average' ? 'bg-blue-600 text-white' : 'bg-slate-100'
              }`}
            >
              Durchschnittswert
            </button>
            <button
              onClick={() => setSelectedMetric('rate')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                selectedMetric === 'rate' ? 'bg-blue-600 text-white' : 'bg-slate-100'
              }`}
            >
              Erfassungsquote
            </button>
            <button
              onClick={() => setSelectedMetric('total')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                selectedMetric === 'total' ? 'bg-blue-600 text-white' : 'bg-slate-100'
              }`}
            >
              Anzahl Zähler
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bestPerformer && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Beste Erfassungsquote
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-900">{bestPerformer.name}</p>
              <p className="text-lg font-semibold text-green-600 mt-2">
                {bestPerformer.readingRate}% erfasst
              </p>
              <p className="text-sm text-green-700 mt-1">
                {bestPerformer.metersWithReadings} von {bestPerformer.totalMeters} Zählern
              </p>
            </CardContent>
          </Card>
        )}

        {needsAttention.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Benötigen Aufmerksamkeit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-900">{needsAttention.length}</p>
              <p className="text-sm text-orange-700 mt-2">
                Gebäude mit Erfassungsquote unter 50%
              </p>
              <div className="mt-3 space-y-1">
                {needsAttention.slice(0, 3).map(building => (
                  <p key={building.id} className="text-xs text-orange-800">
                    • {building.name}: {building.readingRate}%
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Gebäudevergleich</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sortedData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={150} />
                <Tooltip />
                <Legend />
                {selectedMetric === 'average' && (
                  <Bar dataKey="avgReading" fill="#3b82f6" name="Durchschnittswert" />
                )}
                {selectedMetric === 'rate' && (
                  <Bar dataKey="readingRate" fill="#10b981" name="Erfassungsquote %" />
                )}
                {selectedMetric === 'total' && (
                  <>
                    <Bar dataKey="totalMeters" fill="#3b82f6" name="Gesamt" />
                    <Bar dataKey="metersWithReadings" fill="#10b981" name="Erfasst" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-600">
              Keine Vergleichsdaten verfügbar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaillierte Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Gebäude</th>
                  <th className="text-center py-2 px-3">Zähler</th>
                  <th className="text-center py-2 px-3">Erfasst</th>
                  <th className="text-center py-2 px-3">Quote</th>
                  <th className="text-right py-2 px-3">Ø Wert</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map(building => (
                  <tr key={building.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold">{building.name}</td>
                    <td className="py-3 px-3 text-center">{building.totalMeters}</td>
                    <td className="py-3 px-3 text-center">{building.metersWithReadings}</td>
                    <td className="py-3 px-3 text-center">
                      <Badge className={
                        building.efficiency === 'high' ? 'bg-green-100 text-green-800' :
                        building.efficiency === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {building.readingRate}%
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold">
                      {building.avgReading.toLocaleString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}