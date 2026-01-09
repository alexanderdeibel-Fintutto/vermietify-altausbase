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
      <div>
        <h1 className="text-3xl font-medium text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Übersicht Ihrer Immobilienportfolios</p>
      </div>

      <QuickStats stats={stats} accentColor="emerald" />

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /> Einnahmen vs. Ausgaben</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" />
                <Bar dataKey="expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Home className="w-5 h-5 text-blue-600" /> Belegungsquote</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={occupancyData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name} ${value}%`} outerRadius={80} fill="#3b82f6" dataKey="value">
                  {occupancyData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="border border-slate-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><FileText className="w-5 h-5 text-blue-600" /> Offene Verträge</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-blue-700">12</p>
            <p className="text-sm text-blue-600 mt-2">Zur Überprüfung ausstehend</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><AlertCircle className="w-5 h-5 text-yellow-600" /> Ausstehende Zahlungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-yellow-700">5</p>
            <p className="text-sm text-yellow-600 mt-2">Erfordert Aufmerksamkeit</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="w-5 h-5 text-green-600" /> Aktive Mieter</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium text-green-700">47</p>
            <p className="text-sm text-green-600 mt-2">In Ihren Gebäuden</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}