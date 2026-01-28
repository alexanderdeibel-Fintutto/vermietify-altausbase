import React from "react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RentIncomeChart({ data, chartType = "area" }) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mieteinnahmen</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Keine Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const totalIncome = data.reduce((sum, d) => sum + (d.income || 0), 0);
  const avgIncome = (totalIncome / data.length).toFixed(2);

  const ChartComponent = chartType === "line" ? LineChart : AreaChart;
  const DataComponent = chartType === "line" ? Line : Area;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Mieteinnahmen Trend</span>
          <div className="text-sm font-normal text-gray-500 flex gap-4">
            <span>Ø: €{parseFloat(avgIncome).toLocaleString()}</span>
            <span>Gesamt: €{totalIncome.toLocaleString()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={data}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value) => `€${value.toLocaleString()}`}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            />
            <Legend />
            {chartType === "area" ? (
              <>
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)"
                  name="Mieteinnahmen"
                />
                {data[0]?.paid && (
                  <Area 
                    type="monotone" 
                    dataKey="paid" 
                    stroke="#3B82F6" 
                    fillOpacity={0.3} 
                    fill="#3B82F6"
                    name="Eingegangen"
                  />
                )}
              </>
            ) : (
              <>
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Mieteinnahmen"
                  dot={{ fill: '#10B981', r: 4 }}
                />
                {data[0]?.paid && (
                  <Line 
                    type="monotone" 
                    dataKey="paid" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Eingegangen"
                    dot={{ fill: '#3B82F6', r: 4 }}
                  />
                )}
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}