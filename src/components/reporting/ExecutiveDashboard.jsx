import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock, 
  DollarSign, Shield, Users, Zap, Download, Mail 
} from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function ExecutiveDashboard({ problems, onNavigate }) {
  const [timeframe, setTimeframe] = useState('week');

  const { data: summaries = [] } = useQuery({
    queryKey: ['report-summaries'],
    queryFn: () => base44.entities.ProblemReportSummary.list('-created_date', 10)
  });

  // Zeitraum-Filter
  const getFilteredProblems = () => {
    const now = new Date();
    let cutoff = new Date();
    
    switch(timeframe) {
      case 'today':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case 'quarter':
        cutoff.setMonth(cutoff.getMonth() - 3);
        break;
      default:
        cutoff.setDate(cutoff.getDate() - 7);
    }
    
    return problems.filter(p => new Date(p.created_date) >= cutoff);
  };

  const filteredProblems = getFilteredProblems();

  // KPI Berechnungen
  const criticalCount = filteredProblems.filter(p => p.business_priority === 'p1_critical').length;
  const revenueBlocking = filteredProblems.filter(p => p.business_impact === 'revenue_blocking').length;
  const complianceRisk = filteredProblems.filter(p => p.business_impact === 'compliance_risk').length;
  const avgResolutionTime = filteredProblems.filter(p => p.resolution_time).length > 0
    ? Math.round(filteredProblems.filter(p => p.resolution_time).reduce((sum, p) => sum + p.resolution_time, 0) / filteredProblems.filter(p => p.resolution_time).length)
    : 0;
  const resolvedPercentage = filteredProblems.length > 0
    ? Math.round((filteredProblems.filter(p => p.status === 'resolved').length / filteredProblems.length) * 100)
    : 0;

  // Trend-Berechnung (verglichen mit vorherigem Zeitraum)
  const previousPeriodProblems = problems.filter(p => {
    const date = new Date(p.created_date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    const previous = new Date();
    previous.setDate(previous.getDate() - 7);
    return date >= cutoff && date < previous;
  });

  const criticalTrend = previousPeriodProblems.length > 0 
    ? Math.round(((criticalCount - previousPeriodProblems.filter(p => p.business_priority === 'p1_critical').length) / previousPeriodProblems.filter(p => p.business_priority === 'p1_critical').length) * 100)
    : 0;

  // Visualisierungs-Daten
  const priorityData = [
    { name: 'P1 Critical', value: filteredProblems.filter(p => p.business_priority === 'p1_critical').length, color: '#dc2626' },
    { name: 'P2 High', value: filteredProblems.filter(p => p.business_priority === 'p2_high').length, color: '#ea580c' },
    { name: 'P3 Medium', value: filteredProblems.filter(p => p.business_priority === 'p3_medium').length, color: '#facc15' },
    { name: 'P4 Low', value: filteredProblems.filter(p => p.business_priority === 'p4_low').length, color: '#94a3b8' }
  ];

  const areaData = Object.entries(
    filteredProblems.reduce((acc, p) => {
      acc[p.business_area] = (acc[p.business_area] || 0) + 1;
      return acc;
    }, {})
  ).map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  const handleExportPDF = async () => {
    if (summaries.length === 0) {
      toast.error('Keine Reports zum Exportieren verfügbar');
      return;
    }

    try {
      const response = await base44.functions.invoke('exportReportToPDF', {
        summary_id: summaries[0].id
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive-report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      toast.success('PDF erfolgreich exportiert!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
          <p className="text-slate-600">Business-kritische Übersicht für Management</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Heute</SelectItem>
              <SelectItem value="week">Diese Woche</SelectItem>
              <SelectItem value="month">Dieser Monat</SelectItem>
              <SelectItem value="quarter">Dieses Quartal</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF Export
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(revenueBlocking > 0 || complianceRisk > 0 || criticalCount > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-bold text-red-900">⚠️ Kritische Business-Probleme</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {revenueBlocking > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-bold text-red-900">{revenueBlocking}</div>
                      <div className="text-sm text-red-700">Revenue Blocking</div>
                    </div>
                  </div>
                )}
                {complianceRisk > 0 && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-bold text-orange-900">{complianceRisk}</div>
                      <div className="text-sm text-orange-700">Compliance Risk</div>
                    </div>
                  </div>
                )}
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-bold text-red-900">{criticalCount}</div>
                      <div className="text-sm text-red-700">P1 Critical</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Reports',
            value: filteredProblems.length,
            icon: Users,
            color: 'blue',
            trend: null
          },
          {
            title: 'Critical Issues',
            value: criticalCount,
            icon: AlertCircle,
            color: 'red',
            trend: criticalTrend
          },
          {
            title: 'Avg Resolution',
            value: `${avgResolutionTime}h`,
            icon: Clock,
            color: 'purple',
            trend: null
          },
          {
            title: 'Resolved',
            value: `${resolvedPercentage}%`,
            icon: CheckCircle2,
            color: 'green',
            trend: null
          }
        ].map((kpi, idx) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{kpi.title}</p>
                    <p className="text-3xl font-bold mt-2">{kpi.value}</p>
                    {kpi.trend !== null && (
                      <div className={`flex items-center gap-1 mt-2 text-sm ${kpi.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {kpi.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {Math.abs(kpi.trend)}% vs. vorher
                      </div>
                    )}
                  </div>
                  <kpi.icon className={`w-10 h-10 text-${kpi.color}-600`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Problem Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Top Problem Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Empfohlene Maßnahmen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {criticalCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-semibold text-red-900">Kritische Issues sofort adressieren</div>
                    <div className="text-sm text-red-700">{criticalCount} P1-Issues benötigen sofortige Bearbeitung</div>
                  </div>
                </div>
                <Button size="sm" onClick={() => onNavigate('tickets')}>
                  Ansehen
                </Button>
              </div>
            )}
            {revenueBlocking > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-semibold text-orange-900">Revenue-blockierende Issues</div>
                    <div className="text-sm text-orange-700">{revenueBlocking} Issues verhindern Umsatz-Generierung</div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Priorisieren
                </Button>
              </div>
            )}
            {resolvedPercentage < 70 && (
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <div>
                    <div className="font-semibold text-yellow-900">Resolution Rate erhöhen</div>
                    <div className="text-sm text-yellow-700">Aktuell nur {resolvedPercentage}% der Issues gelöst</div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Optimieren
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}