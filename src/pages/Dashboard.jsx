import React from 'react';
import SmartHints from '@/components/navigation/SmartHints';
import OnboardingProgress from '@/components/navigation/OnboardingProgress';
import TesterDashboardWidget from '@/components/testing/TesterDashboardWidget';
import UnlockProgressTracker from '@/components/navigation/UnlockProgressTracker';
import FeatureDiscoveryPanel from '@/components/navigation/FeatureDiscoveryPanel';
import NewFeaturesWidget from '@/components/dashboard/NewFeaturesWidget';
import NavigationRoadmap from '@/components/navigation/NavigationRoadmap';
import LifecycleHints from '@/components/navigation/LifecycleHints';
import ExtendedSmartHints from '@/components/navigation/ExtendedSmartHints';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import QuickStats from '@/components/shared/QuickStats';
import { TrendingUp, Users, Home, FileText, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const revenueData = [
    { month: 'Jan', revenue: 4000, expenses: 2400 },
    { month: 'Feb', revenue: 3000, expenses: 1398 },
    { month: 'Mär', revenue: 2000, expenses: 1800 },
    { month: 'Apr', revenue: 2780, expenses: 1908 },
    { month: 'Mai', revenue: 1890, expenses: 1200 },
    { month: 'Jun', revenue: 2390, expenses: 1500 },
  ];

  const occupancyData = [
    { name: 'Vermietet', value: 75 },
    { name: 'Leer', value: 20 },
    { name: 'In Renovierung', value: 5 },
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  const stats = [
    { label: 'Portfoliowert', value: '€2.4M' },
    { label: 'Belegungsquote', value: '87%' },
    { label: 'Monatliche Einnahmen', value: '€24K' },
    { label: 'Ausstehende Zahlungen', value: '€3.2K' },
  ];

  return (
    <div className="space-y-6">
      <TesterDashboardWidget />
      <LifecycleHints />
      <FeatureDiscoveryPanel />
      <OnboardingProgress />
      <UnlockProgressTracker />
      <ExtendedSmartHints />
      <SmartHints />
      <div className="mb-8">
        <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Dashboard</h1>
        <p className="text-sm font-extralight text-slate-400 mt-1">Übersicht Ihrer Immobilienportfolios</p>
      </div>

      <QuickStats stats={stats} />

      <div className="grid grid-cols-2 gap-8">
        <Card className="border border-slate-100 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-sm font-light text-slate-600">
              <TrendingUp className="w-4 h-4 text-slate-400" /> 
              Einnahmen vs. Ausgaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#cbd5e1" />
                <Bar dataKey="expenses" fill="#e2e8f0" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-sm font-light text-slate-600">
              <Home className="w-4 h-4 text-slate-400" /> 
              Belegungsquote
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#cbd5e1" dataKey="value">
                  {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#cbd5e1', '#e2e8f0', '#f1f5f9'][index % 3]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <Card className="border border-slate-100 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xs font-extralight text-slate-500">
              <FileText className="w-4 h-4 text-slate-300" /> 
              Offene Verträge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extralight text-slate-700">12</p>
            <p className="text-xs font-extralight text-slate-400 mt-3">Zur Überprüfung ausstehend</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xs font-extralight text-slate-500">
              <AlertCircle className="w-4 h-4 text-slate-300" /> 
              Ausstehende Zahlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extralight text-slate-700">5</p>
            <p className="text-xs font-extralight text-slate-400 mt-3">Erfordert Aufmerksamkeit</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 bg-white shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xs font-extralight text-slate-500">
              <Users className="w-4 h-4 text-slate-300" /> 
              Aktive Mieter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extralight text-slate-700">47</p>
            <p className="text-xs font-extralight text-slate-400 mt-3">In Ihren Gebäuden</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}