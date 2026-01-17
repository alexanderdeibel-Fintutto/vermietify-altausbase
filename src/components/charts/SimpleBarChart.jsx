import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SimpleBarChart({ 
  data = [], 
  dataKey = 'value',
  xKey = 'name',
  color = '#1E3A8A',
  height = 300 
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" />
        <XAxis dataKey={xKey} stroke="var(--theme-text-muted)" />
        <YAxis stroke="var(--theme-text-muted)" />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'var(--theme-elevated)',
            border: '1px solid var(--theme-border)',
            borderRadius: '8px'
          }}
        />
        <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}