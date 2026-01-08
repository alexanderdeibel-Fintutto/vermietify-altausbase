import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AdvancedAnalytics() {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-analytics'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date', 200)
  });

  // Analyze trends by year
  const yearData = {};
  submissions.forEach(sub => {
    const year = sub.tax_year;
    if (!yearData[year]) {
      yearData[year] = { year, count: 0, accepted: 0, rejected: 0, avgConfidence: 0 };
    }
    yearData[year].count++;
    if (sub.status === 'ACCEPTED') yearData[year].accepted++;
    if (sub.status === 'REJECTED') yearData[year].rejected++;
    yearData[year].avgConfidence += sub.ai_confidence_score || 0;
  });

  const trendData = Object.values(yearData).map(y => ({
    ...y,
    avgConfidence: Math.round(y.avgConfidence / y.count)
  })).sort((a, b) => a.year - b.year);

  // Status distribution
  const statusCounts = {};
  submissions.forEach(sub => {
    statusCounts[sub.status] = (statusCounts[sub.status] || 0) + 1;
  });

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Form type distribution
  const formCounts = {};
  submissions.forEach(sub => {
    formCounts[sub.tax_form_type] = (formCounts[sub.tax_form_type] || 0) + 1;
  });

  const formData = Object.entries(formCounts).map(([form, count]) => ({
    form,
    count
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{submissions.length}</div>
            <div className="text-xs text-slate-600 mt-1">Gesamt Einreichungen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round((submissions.filter(s => s.status === 'ACCEPTED').length / submissions.length) * 100)}%
            </div>
            <div className="text-xs text-slate-600 mt-1">Akzeptanzquote</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(submissions.reduce((sum, s) => sum + (s.ai_confidence_score || 0), 0) / submissions.length)}%
            </div>
            <div className="text-xs text-slate-600 mt-1">Ø KI-Vertrauen</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Object.keys(trendData).length}
            </div>
            <div className="text-xs text-slate-600 mt-1">Jahre analysiert</div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trend: Einreichungen & KI-Vertrauen</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#3b82f6" name="Einreichungen" />
              <Line yAxisId="right" type="monotone" dataKey="avgConfidence" stroke="#f59e0b" name="Ø KI-Vertrauen %" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formular-Typen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.map(form => (
                <div key={form.form} className="flex items-center justify-between">
                  <span className="text-sm">{form.form}</span>
                  <Badge variant="outline">{form.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}