import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, FileText, TrendingUp, AlertTriangle } from 'lucide-react';

export default function TaxAdminDashboard() {
  const { data: calculations = [] } = useQuery({
    queryKey: ['allTaxCalculations'],
    queryFn: async () => {
      const calcs = await base44.entities.TaxCalculation.list('-calculated_at', 100) || [];
      return calcs;
    }
  });

  const { data: deadlines = [] } = useQuery({
    queryKey: ['allTaxDeadlines'],
    queryFn: async () => {
      const dlines = await base44.entities.TaxDeadline.list('-deadline_date', 100) || [];
      return dlines;
    }
  });

  // Statistics by country
  const statsByCountry = {
    AT: calculations.filter(c => c.country === 'AT').length,
    CH: calculations.filter(c => c.country === 'CH').length,
    DE: calculations.filter(c => c.country === 'DE').length
  };

  const totalTax = calculations.reduce((s, c) => s + (c.total_tax || 0), 0);
  const totalUsers = new Set(calculations.map(c => c.user_email)).size;

  // Chart data
  const countryChartData = [
    { name: 'Österreich', value: statsByCountry.AT, fill: '#ef4444' },
    { name: 'Schweiz', value: statsByCountry.CH, fill: '#10b981' },
    { name: 'Deutschland', value: statsByCountry.DE, fill: '#f59e0b' }
  ];

  const overdudeDeadlines = deadlines.filter(d => {
    const daysUntil = Math.ceil((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil < 0;
  });

  const upcomingDeadlines = deadlines.filter(d => {
    const daysUntil = Math.ceil((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 30;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">🔐 Admin Dashboard - Steuerverwaltung</h1>
        <p className="text-slate-500 mt-2">Übersicht aller Benutzer & Steuerdaten</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <p className="text-sm text-slate-600">Aktive Benutzer</p>
            <p className="text-3xl font-bold">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <p className="text-sm text-slate-600">Berechnungen</p>
            <p className="text-3xl font-bold">{calculations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <p className="text-sm text-slate-600">Gesamtsteuern</p>
            <p className="text-2xl font-bold">€{(totalTax / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })}K</p>
          </CardContent>
        </Card>
        <Card className={overdudeDeadlines.length > 0 ? 'border-2 border-red-500' : ''}>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className={`w-8 h-8 mx-auto mb-2 ${overdudeDeadlines.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
            <p className="text-sm text-slate-600">Überfällige Fristen</p>
            <p className={`text-3xl font-bold ${overdudeDeadlines.length > 0 ? 'text-red-600' : 'text-yellow-600'}`}>
              {overdudeDeadlines.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Berechnungen nach Land</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={countryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {countryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {countryChartData.map(c => (
                <div key={c.name} className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.fill }} />
                    {c.name}
                  </span>
                  <span className="font-semibold">{c.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Berechnungen im Zeitverlauf</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { month: 'Jan', AT: 5, CH: 8, DE: 3 },
                  { month: 'Feb', AT: 7, CH: 6, DE: 4 },
                  { month: 'Mär', AT: 9, CH: 10, DE: 6 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="AT" fill="#ef4444" />
                <Bar dataKey="CH" fill="#10b981" />
                <Bar dataKey="DE" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calculations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculations">Berechnungen</TabsTrigger>
          <TabsTrigger value="deadlines">Fristen</TabsTrigger>
        </TabsList>

        <TabsContent value="calculations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Letzte Berechnungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {calculations.slice(0, 10).map((calc) => (
                  <div key={calc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{calc.user_email}</p>
                        <Badge className={
                          calc.country === 'AT' ? 'bg-red-100 text-red-800' :
                          calc.country === 'CH' ? 'bg-green-100 text-green-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {calc.country}
                        </Badge>
                        <Badge variant="outline">{calc.tax_year}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {new Date(calc.calculated_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">€{(calc.total_tax || 0).toLocaleString('de-DE')}</p>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">{calc.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          {upcomingDeadlines.length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle>⚠️ Nächste 30 Tage ({upcomingDeadlines.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingDeadlines.map(d => (
                  <div key={d.id} className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-orange-500">
                    <div>
                      <p className="font-semibold text-sm">{d.title}</p>
                      <p className="text-xs text-slate-600">{d.country} - {new Date(d.deadline_date).toLocaleDateString('de-DE')}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {overdudeDeadlines.length > 0 && (
            <Card className="border-2 border-red-500 bg-red-50">
              <CardHeader>
                <CardTitle>🚨 Überfällig ({overdudeDeadlines.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdudeDeadlines.map(d => {
                  const daysOverdue = Math.abs(Math.ceil((new Date(d.deadline_date) - new Date()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div key={d.id} className="flex justify-between items-center p-2 bg-white rounded border-l-4 border-red-500">
                      <div>
                        <p className="font-semibold text-sm">{d.title}</p>
                        <p className="text-xs text-red-600">{d.country} - {daysOverdue} Tage überfällig</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}