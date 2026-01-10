import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckSquare } from 'lucide-react';

const COLORS = {
  open: '#94a3b8',
  in_progress: '#3b82f6',
  completed: '#10b981',
  cancelled: '#ef4444'
};

const labels = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert'
};

export default function TaskCompletionChart({ data }) {
  const chartData = data
    ? Object.entries(data)
        .filter(([, count]) => count > 0)
        .map(([status, count]) => ({
          name: labels[status],
          value: count
        }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="w-5 h-5" />
          Aufgabenstatus
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.values(COLORS).map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-slate-500">
            Keine Aufgaben vorhanden
          </div>
        )}
      </CardContent>
    </Card>
  );
}