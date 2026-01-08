import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import QuickStats from '@/components/shared/QuickStats';

export default function FinanzenPage() {
  const monthlyData = [
    { month: 'Jan', income: 12500, expenses: 8200, profit: 4300 },
    { month: 'Feb', income: 13200, expenses: 8500, profit: 4700 },
    { month: 'Mär', income: 13200, expenses: 9100, profit: 4100 },
    { month: 'Apr', income: 14000, expenses: 8800, profit: 5200 },
    { month: 'Mai', income: 13800, expenses: 9200, profit: 4600 },
    { month: 'Jun', income: 14500, expenses: 9500, profit: 5000 },
  ];

  const stats = [
    { label: 'Einnahmen (YTD)', value: '€82,200' },
    { label: 'Ausgaben (YTD)', value: '€53,300' },
    { label: 'Gewinn (YTD)', value: '€28,900' },
    { label: 'Gewinnmarge', value: '35.2%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💰 Finanzen</h1>
        <p className="text-slate-600 mt-1">Finanzübersicht und Analysen</p>
      </div>

      <QuickStats stats={stats} accentColor="green" />

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="income">Einnahmen</TabsTrigger>
          <TabsTrigger value="expenses">Ausgaben</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Einnahmen vs. Ausgaben</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" name="Einnahmen" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Ausgaben" />
                  <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Gewinn" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Einnahmequellen</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                  <Bar dataKey="income" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-6">
          <Card className="border border-slate-200">
            <CardHeader>
              <CardTitle>Ausgabenstruktur</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                  <Bar dataKey="expenses" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}