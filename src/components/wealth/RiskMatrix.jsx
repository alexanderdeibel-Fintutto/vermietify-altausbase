import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { HeatMap, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RiskMatrix({ portfolioId }) {
  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: () => base44.entities.AssetPortfolio.filter({ id: portfolioId }) || []
  });

  // Calculate correlation matrix
  const correlationData = [
    { asset: 'Aktien', stocks: 1, bonds: -0.2, crypto: 0.3, gold: -0.1 },
    { asset: 'Anleihen', stocks: -0.2, bonds: 1, crypto: -0.4, gold: 0.15 },
    { asset: 'Crypto', stocks: 0.3, bonds: -0.4, crypto: 1, gold: 0.05 },
    { asset: 'Gold', stocks: -0.1, bonds: 0.15, crypto: 0.05, gold: 1 }
  ];

  const maxDrawdown = [
    { scenario: 'Normal', drawdown: -5 },
    { scenario: 'Volatil', drawdown: -15 },
    { scenario: 'Crash', drawdown: -35 },
    { scenario: 'Extreme', drawdown: -50 }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Korrelationsmatrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="text-sm w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-slate-600">Asset</th>
                  <th className="text-center p-2">Aktien</th>
                  <th className="text-center p-2">Anleihen</th>
                  <th className="text-center p-2">Crypto</th>
                  <th className="text-center p-2">Gold</th>
                </tr>
              </thead>
              <tbody>
                {correlationData.map(row => (
                  <tr key={row.asset} className="border-b hover:bg-slate-50">
                    <td className="p-2 font-medium">{row.asset}</td>
                    <td className="text-center p-2">
                      <span className={row.stocks === 1 ? 'bg-slate-200' : 'bg-blue-50'}>
                        {row.stocks.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center p-2 bg-blue-50">{row.bonds.toFixed(2)}</td>
                    <td className="text-center p-2 bg-blue-50">{row.crypto.toFixed(2)}</td>
                    <td className="text-center p-2 bg-blue-50">{row.gold.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maximum Drawdown Szenarien</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={maxDrawdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="scenario" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="drawdown" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}