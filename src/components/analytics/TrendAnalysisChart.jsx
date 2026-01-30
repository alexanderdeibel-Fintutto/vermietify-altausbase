import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function TrendAnalysisChart({ 
  data = [], 
  dataKey = 'value',
  xKey = 'date',
  variant = 'line',
  color = '#3B82F6',
  showGrid = true 
}) {
  const Chart = variant === 'area' ? AreaChart : LineChart;
  const DataComponent = variant === 'area' ? Area : Line;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <Chart data={data}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
        <XAxis 
          dataKey={xKey} 
          tick={{ fontSize: 12 }}
          stroke="#9CA3AF"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          stroke="#9CA3AF"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <DataComponent
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={variant === 'area' ? color : undefined}
          fillOpacity={variant === 'area' ? 0.2 : undefined}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </Chart>
    </ResponsiveContainer>
  );
}