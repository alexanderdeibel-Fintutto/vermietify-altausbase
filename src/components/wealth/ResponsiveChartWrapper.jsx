import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ResponsiveChartWrapper({ type = 'bar', data, dataKey, colors }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartHeight = isMobile ? 250 : 400;

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 80 : 120}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors?.[index % colors.length] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `€${value.toFixed(0)}`} />
          {!isMobile && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={isMobile ? { top: 5, right: 5, left: -20, bottom: 5 } : { top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          {!isMobile && <XAxis dataKey="name" />}
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <LineChart data={data} margin={isMobile ? { top: 5, right: 5, left: -20, bottom: 5 } : { top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        {!isMobile && <XAxis dataKey="name" />}
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}