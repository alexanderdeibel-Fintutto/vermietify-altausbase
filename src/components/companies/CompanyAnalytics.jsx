import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function CompanyAnalytics({ company }) {
  const documentCompletionRate = company.documents ? (company.documents.length / 5) * 100 : 0;
  const contactCount = company.contacts?.length || 0;
  const bankAccountCount = company.bank_accounts?.length || 0;

  // Sample financial data
  const financialData = [
    { month: 'Jan', revenue: company.annual_revenue ? Math.round(company.annual_revenue / 12) : 0 },
    { month: 'Feb', revenue: company.annual_revenue ? Math.round(company.annual_revenue / 12) : 0 },
    { month: 'Mär', revenue: company.annual_revenue ? Math.round(company.annual_revenue / 12) : 0 }
  ];

  const distributionData = [
    { name: 'Dokumente', value: company.documents?.length || 0 },
    { name: 'Kontakte', value: contactCount },
    { name: 'Konten', value: bankAccountCount }
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Dokumentation</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {Math.round(documentCompletionRate)}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
              <div
                className="bg-blue-600 h-1 rounded-full"
                style={{ width: `${documentCompletionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Kontakte</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{contactCount}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              {contactCount > 0 ? 'Vollständig' : 'Fehlt'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Bankkonten</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{bankAccountCount}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              {bankAccountCount > 0 ? 'Aktiv' : 'Fehlt'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600">Mitarbeiter</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{company.employees_count || 0}</p>
            <Badge variant="outline" className="mt-2 text-xs">
              {company.employees_count && company.employees_count > 0 ? 'Aktiv' : 'Solo'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geschätzter monatlicher Umsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={financialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `€${value.toLocaleString('de-DE')}`} />
                <Bar dataKey="revenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daten-Übersicht</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color) => (
                    <Cell key={`cell`} fill={color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zusammenfassung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Jährlicher Umsatz:</span>
            <span className="font-medium">€{(company.annual_revenue || 0).toLocaleString('de-DE')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Status:</span>
            <Badge className={company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
              {company.status === 'active' ? 'Aktiv' : 'Inaktiv'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Gegründet:</span>
            <span className="font-medium">
              {company.founding_date
                ? new Date(company.founding_date).toLocaleDateString('de-DE')
                : 'Nicht angegeben'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}