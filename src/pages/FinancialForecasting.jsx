import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';
import QuickStats from '@/components/shared/QuickStats';

export default function FinancialForecastingPage() {
  const forecastData = [
    { month: 'Jan', actual: 45000, forecast: 44000, variance: 1000 },
    { month: 'Feb', actual: 48000, forecast: 47000, variance: 1000 },
    { month: 'Mär', actual: 52000, forecast: 51000, variance: 1000 },
    { month: 'Apr', actual: 55000, forecast: 54000, variance: 1000 },
    { month: 'Mai', actual: 58000, forecast: 58500, variance: -500 },
    { month: 'Jun', actual: 62000, forecast: 63000, variance: -1000 },
  ];

  const stats = [
    { label: 'Prognose Q2', value: '€187.500' },
    { label: 'Genauigkeit', value: '94.2%' },
    { label: 'Abweichung', value: '+€500' },
    { label: 'Trend', value: '↑ +8.7%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📈 Financial Forecasting</h1>
        <p className="text-slate-600 mt-1">KI-gestützte Finanzprognosen und Trend-Analyse</p>
      </div>

      <QuickStats stats={stats} accentColor="blue" />

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Einnahmeprognose</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
              <Legend />
              <Area type="monotone" dataKey="actual" stroke="#3b82f6" fillOpacity={1} fill="url(#colorActual)" name="Tatsächlich" />
              <Area type="monotone" dataKey="forecast" stroke="#10b981" fillOpacity={1} fill="url(#colorForecast)" name="Prognose" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader><CardTitle>Prognose Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Durchschnittliche Genauigkeit:</span><span className="font-semibold">94.2%</span></div>
            <div className="flex justify-between"><span>Modell-Typ:</span><span className="font-semibold">ARIMA + Neural Network</span></div>
            <div className="flex justify-between"><span>Zuletzt aktualisiert:</span><span className="font-semibold">08.01.2026 14:30</span></div>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardHeader><CardTitle>Risikofaktoren</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>⚠️ Saisonale Schwankungen: Mittel</div>
            <div>⚠️ Wirtschaftliche Volatilität: Niedrig</div>
            <div>✓ Mieterfluktuationsrisiko: Beherrschbar</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}