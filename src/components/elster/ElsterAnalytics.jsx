import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, FileText, CheckCircle, Sparkles } from 'lucide-react';

export default function ElsterAnalytics({ submissions }) {
  // Submissions pro Monat
  const monthlyData = {};
  submissions.forEach(sub => {
    if (!sub.created_date) return;
    const month = sub.created_date.substring(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + 1;
  });

  const monthlyChartData = Object.entries(monthlyData)
    .sort()
    .slice(-6)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }),
      anzahl: count
    }));

  // Formulare nach Typ
  const typeData = {};
  submissions.forEach(sub => {
    typeData[sub.tax_form_type] = (typeData[sub.tax_form_type] || 0) + 1;
  });

  const typeChartData = Object.entries(typeData).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value
  }));

  // Status-Verteilung
  const statusData = {};
  submissions.forEach(sub => {
    statusData[sub.status] = (statusData[sub.status] || 0) + 1;
  });

  const statusChartData = Object.entries(statusData).map(([name, value]) => ({ name, value }));

  // KI-Confidence über Zeit
  const confidenceData = submissions
    .filter(s => s.ai_confidence_score && s.created_date)
    .sort((a, b) => a.created_date.localeCompare(b.created_date))
    .slice(-10)
    .map(s => ({
      datum: new Date(s.created_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      confidence: s.ai_confidence_score
    }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Übermittlungen pro Monat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="anzahl" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Formulare nach Typ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Status-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              KI-Vertrauen Entwicklung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="datum" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="confidence" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}