import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function OccupancyPieWidget() {
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const data = [
    { name: 'Vermietet', value: units.filter(u => u.status === 'occupied').length, color: '#10b981' },
    { name: 'Leer', value: units.filter(u => u.status === 'vacant').length, color: '#f59e0b' },
    { name: 'Renovierung', value: units.filter(u => u.status === 'renovation').length, color: '#6366f1' }
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, value }) => `${name}: ${value}`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}