import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, RefreshCw } from 'lucide-react';

export default function CommunicationInsightsWidget({ companyId }) {
  const [insights, setInsights] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('aiCommunicationAnalyzer', {
        action: 'summarize_common_queries',
        company_id: companyId
      }),
    onSuccess: (response) => setInsights(response.data.summary)
  });

  const chartData = insights?.common_queries?.map(q => ({
    name: q.category.substring(0, 20),
    count: q.frequency
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Kommunikations-Analyse
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 ${analyzeMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!insights ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-4">Klicken Sie auf Aktualisieren, um Anfragen zu analysieren</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-2 font-medium">Häufigkeitsverteilung</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-2 font-medium">Kategorien-Anteil</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-medium text-slate-700 mb-2">Top 3 Kategorien:</p>
              <div className="space-y-1">
                {insights.common_queries?.slice(0, 3).map((query, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">#{i + 1} {query.category}</span>
                    <span className="font-medium text-slate-900">{query.frequency}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}