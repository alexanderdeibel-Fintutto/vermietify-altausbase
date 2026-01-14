import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, MousePointerClick, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AnalyticsDashboard() {
  // This would fetch from your analytics backend
  // For demo purposes, showing mock structure
  
  const mockOnboardingData = [
    { step: 'Schritt 1', avgTime: 45, completions: 150, dropoffs: 5 },
    { step: 'Schritt 2', avgTime: 60, completions: 145, dropoffs: 12 },
    { step: 'Schritt 3', avgTime: 90, completions: 133, dropoffs: 8 },
    { step: 'Schritt 4', avgTime: 30, completions: 125, dropoffs: 3 }
  ];

  const mockFeatureUsage = [
    { name: 'BK-Wizard', uses: 342, avgDuration: 185 },
    { name: 'Vertrag anlegen', uses: 256, avgDuration: 120 },
    { name: 'Mieterhöhung', uses: 189, avgDuration: 95 },
    { name: 'Rechnung erfassen', uses: 567, avgDuration: 45 },
    { name: 'Bulk-Kategorisierung', uses: 89, avgDuration: 60 }
  ];

  const mockErrorTypes = [
    { name: 'Validierungsfehler', value: 45, color: '#f59e0b' },
    { name: 'API-Fehler', value: 12, color: '#ef4444' },
    { name: 'Netzwerkfehler', value: 8, color: '#3b82f6' },
    { name: 'Andere', value: 5, color: '#6b7280' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-light text-slate-900">Analytics Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Wizard-Abschlüsse</p>
                <p className="text-2xl font-bold text-emerald-600">125</p>
                <p className="text-xs text-slate-500">+12% vs. letzte Woche</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Aktive Nutzer</p>
                <p className="text-2xl font-bold text-blue-600">48</p>
                <p className="text-xs text-slate-500">Letzte 7 Tage</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Feature-Nutzung</p>
                <p className="text-2xl font-bold text-purple-600">1,443</p>
                <p className="text-xs text-slate-500">Events gesamt</p>
              </div>
              <MousePointerClick className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fehlerrate</p>
                <p className="text-2xl font-bold text-amber-600">1.2%</p>
                <p className="text-xs text-slate-500">70 Fehler</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Onboarding-Funnel Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockOnboardingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completions" fill="#10b981" name="Abschlüsse" />
              <Bar dataKey="dropoffs" fill="#ef4444" name="Abbrüche" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Feature Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature-Nutzung (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockFeatureUsage.map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{feature.name}</p>
                    <p className="text-xs text-slate-500">{feature.uses} Nutzungen · Ø {feature.avgDuration}s</p>
                  </div>
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600"
                      style={{ width: `${(feature.uses / 567) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fehlerverteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={mockErrorTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockErrorTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Spent per Step */}
      <Card>
        <CardHeader>
          <CardTitle>Durchschnittliche Zeit pro Wizard-Schritt</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockOnboardingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step" />
              <YAxis label={{ value: 'Sekunden', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgTime" stroke="#8b5cf6" name="Ø Zeit (s)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}