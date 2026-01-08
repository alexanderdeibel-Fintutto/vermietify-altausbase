import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import QuickStats from '@/components/shared/QuickStats';
import { TrendingUp, Download } from 'lucide-react';

export default function AdvancedAnalyticsPage() {
  const userActivityData = [
    { month: 'Jan', logins: 4000, actions: 2400 },
    { month: 'Feb', logins: 3000, actions: 1398 },
    { month: 'Mär', logins: 2000, actions: 9800 },
    { month: 'Apr', logins: 2780, actions: 3908 },
    { month: 'Mai', logins: 1890, actions: 4800 },
    { month: 'Jun', logins: 2390, actions: 3800 },
  ];

  const moduleUsageData = [
    { name: 'Gebäude', value: 28, color: '#3b82f6' },
    { name: 'Finanzen', value: 25, color: '#10b981' },
    { name: 'Mieter', value: 20, color: '#f59e0b' },
    { name: 'Verträge', value: 15, color: '#8b5cf6' },
    { name: 'Berichte', value: 12, color: '#ef4444' },
  ];

  const stats = [
    { label: 'Aktive Nutzer', value: 156 },
    { label: 'Durchschn. Session', value: '34 Min' },
    { label: 'API Calls', value: '2.4M' },
    { label: 'Speicher genutzt', value: '12.8 GB' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📊 Advanced Analytics</h1>
          <p className="text-slate-600 mt-1">Detaillierte Analysen und Insights</p>
        </div>
        <Button className="bg-pink-600 hover:bg-pink-700"><Download className="w-4 h-4 mr-2" />Report exportieren</Button>
      </div>

      <QuickStats stats={stats} accentColor="pink" />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Benutzeraktivität</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="logins" stroke="#3b82f6" />
                <Line type="monotone" dataKey="actions" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Modul-Nutzung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={moduleUsageData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {moduleUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userActivityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="logins" fill="#3b82f6" />
              <Bar dataKey="actions" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}