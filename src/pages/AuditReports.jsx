import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Download, Calendar } from 'lucide-react';

export default function AuditReports() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('generateAuditReport', data);
      return response.data;
    },
    onSuccess: (data) => {
      setReport(data);
    }
  });

  const handleGenerate = () => {
    generateMutation.mutate({ startDate, endDate });
  };

  const exportReport = () => {
    if (!report) return;
    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activityData = report ? 
    Object.entries(report.stats.activityByType).map(([type, count]) => ({
      name: type,
      count
    })) : [];

  const resourceData = report ?
    Object.entries(report.stats.activityByResource)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([resource, count]) => ({
        name: resource,
        count
      })) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Reports</h1>
        <p className="text-slate-600">Aktivitäts- und Sicherheitsberichte</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start">Start-Datum</Label>
              <Input 
                id="start"
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end">End-Datum</Label>
              <Input 
                id="end"
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Report generieren
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">{report.stats.totalActivities}</div>
                <div className="text-sm text-slate-600">Gesamt-Aktivitäten</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">{report.stats.uniqueUsers}</div>
                <div className="text-sm text-slate-600">Aktive Benutzer</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-600">{report.stats.totalSessions}</div>
                <div className="text-sm text-slate-600">Test-Sessions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">{report.stats.averageSessionDuration}m</div>
                <div className="text-sm text-slate-600">Ø Session-Dauer</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aktivitäten nach Typ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Ressourcen</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={resourceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top 10 Aktivste Benutzer</CardTitle>
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {report.topUsers.map((user, idx) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{idx + 1}</Badge>
                      <span className="font-medium">{user.userId}</span>
                    </div>
                    <Badge>{user.count} Aktivitäten</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}