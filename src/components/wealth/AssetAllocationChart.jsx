import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AssetAllocationChart({ holdings = [], assets = [] }) {
  const getAllocationData = () => {
    const assetClasses = {};
    
    holdings.forEach(holding => {
      const asset = assets.find(a => a.id === holding.asset_id);
      if (!asset) return;
      
      const className = asset.asset_class;
      if (!assetClasses[className]) {
        assetClasses[className] = 0;
      }
      assetClasses[className] += holding.current_value || 0;
    });

    return Object.entries(assetClasses).map(([name, value]) => ({
      name: name === 'stock' ? 'Aktien' :
            name === 'etf' ? 'ETFs' :
            name === 'crypto' ? 'Krypto' :
            name === 'bond' ? 'Anleihen' :
            name,
      value
    }));
  };

  const data = getAllocationData();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset-Allokation</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center text-slate-500 py-8">
            Keine Daten verfügbar
          </div>
        ) : (
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {data.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">
                      {formatCurrency(item.value)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {((item.value / total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}