import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Loader2, TrendingUp, AlertCircle, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import PriorityHeatMap from '@/components/reporting/PriorityHeatMap';
import BusinessImpactMatrix from '@/components/reporting/BusinessImpactMatrix';
import AdvancedFilters from '@/components/reporting/AdvancedFilters';

export default function ReportGenerator() {
  const [reportType, setReportType] = useState('weekly');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    business_priority: 'all',
    business_area: 'all',
    problem_type: 'all',
    status: 'all',
    fix_effort: 'all',
    user_journey: 'all',
    minScore: 0,
    maxScore: 1000
  });

  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['problem-reports'],
    queryFn: () => base44.entities.UserProblem.list('-created_date')
  });

  const { data: summaries = [] } = useQuery({
    queryKey: ['report-summaries'],
    queryFn: () => base44.entities.ProblemReportSummary.list('-created_date')
  });

  const filteredReports = reports.filter(r => {
    if (!r.created_date) return false;
    const created = new Date(r.created_date);
    if (created < new Date(dateFrom) || created > new Date(dateTo)) return false;
    
    if (filters.search && !r.problem_titel?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.business_priority !== 'all' && r.business_priority !== filters.business_priority) return false;
    if (filters.business_area !== 'all' && r.business_area !== filters.business_area) return false;
    if (filters.problem_type !== 'all' && r.problem_type !== filters.problem_type) return false;
    if (filters.status !== 'all' && r.status !== filters.status) return false;
    if (filters.fix_effort !== 'all' && r.estimated_fix_effort !== filters.fix_effort) return false;
    if (filters.user_journey !== 'all' && r.user_journey_stage !== filters.user_journey) return false;
    if ((r.priority_score || 0) < filters.minScore || (r.priority_score || 0) > filters.maxScore) return false;
    
    return true;
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateIntelligentReportSummary', {
        date_from: dateFrom,
        date_to: dateTo,
        summary_type: reportType
      });

      if (response.data.error) {
        toast.error(response.data.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['report-summaries'] });
      toast.success('Report erfolgreich generiert! 📊');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Fehler beim Generieren des Reports');
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = {
    total: filteredReports.length,
    p1: filteredReports.filter(r => r.business_priority === 'p1_critical').length,
    p2: filteredReports.filter(r => r.business_priority === 'p2_high').length,
    avgPriority: filteredReports.length > 0 
      ? Math.round(filteredReports.reduce((sum, r) => sum + (r.priority_score || 0), 0) / filteredReports.length)
      : 0
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Report Generator</h1>
          <p className="text-slate-500 mt-1">Intelligente Analyse und Berichte generieren</p>
        </div>
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Report generieren
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt Reports', value: stats.total, icon: FileText, color: 'blue' },
          { label: 'P1 Kritisch', value: stats.p1, icon: AlertCircle, color: 'red' },
          { label: 'P2 Hoch', value: stats.p2, icon: TrendingUp, color: 'orange' },
          { label: 'Ø Priority Score', value: stats.avgPriority, icon: TrendingUp, color: 'purple' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Report-Typ</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">📅 Täglich</SelectItem>
                    <SelectItem value="weekly">📆 Wöchentlich</SelectItem>
                    <SelectItem value="monthly">📊 Monatlich</SelectItem>
                    <SelectItem value="sprint">🏃 Sprint</SelectItem>
                    <SelectItem value="custom">🎯 Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Von Datum</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Bis Datum</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AdvancedFilters 
        filters={filters} 
        onFilterChange={setFilters} 
        onReset={() => setFilters({
          search: '',
          business_priority: 'all',
          business_area: 'all',
          problem_type: 'all',
          status: 'all',
          fix_effort: 'all',
          user_journey: 'all',
          minScore: 0,
          maxScore: 1000
        })}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Tabs defaultValue="heatmap">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="heatmap">🗺️ Heat Map</TabsTrigger>
            <TabsTrigger value="matrix">📊 Impact Matrix</TabsTrigger>
            <TabsTrigger value="reports">📋 Reports</TabsTrigger>
            <TabsTrigger value="summaries">📑 Summaries</TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="mt-6">
            <PriorityHeatMap reports={filteredReports} />
          </TabsContent>

          <TabsContent value="matrix" className="mt-6">
            <BusinessImpactMatrix reports={filteredReports} />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gefilterte Problem Reports ({filteredReports.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredReports.slice(0, 20).map((report, idx) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={
                              report.business_priority === 'p1_critical' ? 'bg-red-600' :
                              report.business_priority === 'p2_high' ? 'bg-orange-600' :
                              report.business_priority === 'p3_medium' ? 'bg-yellow-600' :
                              'bg-slate-600'
                            }>
                              {report.business_priority || 'Unbewertet'}
                            </Badge>
                            <Badge variant="outline">{report.business_area}</Badge>
                            {report.priority_score && (
                              <Badge variant="outline">Score: {report.priority_score}</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900">{report.problem_titel}</h3>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-2">{report.problem_beschreibung}</p>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          {report.tester_name || 'Anonym'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="summaries" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Generierte Summaries ({summaries.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summaries.map((summary, idx) => (
                    <motion.div
                      key={summary.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>{summary.summary_type}</Badge>
                            <span className="text-sm text-slate-500">
                              {new Date(summary.date_from).toLocaleDateString('de-DE')} - {new Date(summary.date_to).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                          <div className="text-sm space-y-1">
                            <div>📊 Total: {summary.total_reports} Reports</div>
                            <div>🔴 Critical: {summary.reports_by_priority?.p1 || 0}</div>
                            <div>🟠 High: {summary.reports_by_priority?.p2 || 0}</div>
                          </div>
                          {summary.stakeholder_summary && (
                            <pre className="mt-3 p-3 bg-slate-50 rounded text-xs whitespace-pre-wrap">
                              {summary.stakeholder_summary}
                            </pre>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}