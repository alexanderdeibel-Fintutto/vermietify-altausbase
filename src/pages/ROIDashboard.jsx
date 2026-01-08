import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Percent } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function ROIDashboardPage() {
  const roiData = [
    { month: 'Jan', investment: 50000, returns: 4200, roi: 8.4 },
    { month: 'Feb', investment: 50000, returns: 4500, roi: 9.0 },
    { month: 'Mär', investment: 55000, returns: 5100, roi: 9.3 },
    { month: 'Apr', investment: 55000, returns: 5800, roi: 10.5 },
    { month: 'Mai', investment: 60000, returns: 6400, roi: 10.7 },
    { month: 'Jun', investment: 60000, returns: 7200, roi: 12.0 },
  ];

  const stats = [
    { label: 'Gesamtinvestition', value: '€330.000' },
    { label: 'Gesamt Returns', value: '€33.200' },
    { label: 'Durchsch. ROI', value: '10.1%' },
    { label: 'YoY Wachstum', value: '+24%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💹 ROI Dashboard</h1>
        <p className="text-slate-600 mt-1">Analyse der Return on Investment</p>
      </div>

      <QuickStats stats={stats} accentColor="green" />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5" /> Investitionen vs. Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                <Legend />
                <Bar dataKey="investment" fill="#3b82f6" name="Investment" />
                <Bar dataKey="returns" fill="#10b981" name="Returns" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Percent className="w-5 h-5" /> ROI Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Line type="monotone" dataKey="roi" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}