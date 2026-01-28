import React from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OccupancyChart({ data, chartType = "bar" }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Belegungsquote</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const ChartComponent = chartType === "line" ? LineChart : BarChart;
  const DataComponent = chartType === "line" ? Line : Bar;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Belegungsquote</span>
          <span className="text-sm font-normal text-gray-500">
            Durchschnitt: {(data.reduce((sum, d) => sum + d.occupancy, 0) / data.length).toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => `${value}%`}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            {chartType === "bar" ? (
              <Bar dataKey="occupancy" fill="#3B82F6" name="Belegungsquote" radius={[8, 8, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            ) : (
              <Line 
                type="monotone" 
                dataKey="occupancy" 
                stroke="#3B82F6" 
                name="Belegungsquote"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}