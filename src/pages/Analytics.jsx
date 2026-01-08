import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QuickStats from '@/components/shared/QuickStats';

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month');

  const userData = [
    { date: '01 Jan', users: 120, activeUsers: 89, newUsers: 12 },
    { date: '05 Jan', users: 145, activeUsers: 110, newUsers: 18 },
    { date: '10 Jan', users: 175, activeUsers: 135, newUsers: 22 },
    { date: '15 Jan', users: 200, activeUsers: 155, newUsers: 28 },
    { date: '20 Jan', users: 230, activeUsers: 180, newUsers: 35 },
    { date: '25 Jan', users: 265, activeUsers: 210, newUsers: 42 },
  ];

  const featureData = [
    { name: 'Gebäudeverwaltung', value: 28, color: '#3b82f6' },
    { name: 'Mieterverwaltung', value: 24, color: '#10b981' },
    { name: 'Finanzen', value: 22, color: '#f59e0b' },
    { name: 'Verträge', value: 18, color: '#8b5cf6' },
    { name: 'Reports', value: 8, color: '#ef4444' },
  ];

  const stats = [
    { label: 'Gesamtnutzer', value: 265 },
    { label: 'Aktiv heute', value: 210 },
    { label: 'Wachstum (Woche)', value: '+35' },
    { label: 'Retention', value: '92%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">📈 Analytics</h1>
          <p className="text-slate-600 mt-1">Benutzer- und Funktionsanalysen</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Diese Woche</SelectItem>
            <SelectItem value="month">Diesen Monat</SelectItem>
            <SelectItem value="year">Dieses Jahr</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <QuickStats stats={stats} accentColor="sky" />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Benutzerwachstum</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="users" fill="#3b82f6" stroke="#3b82f6" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Feature-Nutzung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={featureData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {featureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-2 border border-slate-200">
          <CardHeader>
            <CardTitle>Benutzeraktivität</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="activeUsers" fill="#10b981" name="Aktive Nutzer" />
                <Bar dataKey="newUsers" fill="#f59e0b" name="Neue Nutzer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}