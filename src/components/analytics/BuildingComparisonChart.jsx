import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BuildingComparisonChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gebäudevergleich</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gebäudevergleich</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" label={{ value: 'Mieteinnahmen (€)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Belegung (%)', angle: 90, position: 'insideRight' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
              formatter={(value, name) => {
                if (name === 'occupancy') return `${value}%`;
                return `€${value.toLocaleString()}`;
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Mieteinnahmen" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="occupancy" fill="#10B981" name="Belegung" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((building, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{building.name}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mieteinnahmen:</span>
                  <span className="font-medium">€{building.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Belegung:</span>
                  <span className="font-medium">{building.occupancy}%</span>
                </div>
                {building.units && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Einheiten:</span>
                    <span className="font-medium">{building.units}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}