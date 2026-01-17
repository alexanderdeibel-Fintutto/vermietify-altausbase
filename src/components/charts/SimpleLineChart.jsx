import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SimpleLineChart({ 
  data = [], 
  dataKey = 'value',
  xKey = 'name',
  color = '#1E3A8A',
  height = 300 
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
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
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}