import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Zap } from 'lucide-react';

export default function EfficiencyMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Task Completion Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Aufgabenabschlussquote</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.task_completion_rate || 0}%
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {metrics?.completed_tasks || 0} von {metrics?.total_tasks || 0} abgeschlossen
          </p>
        </CardContent>
      </Card>

      {/* Avg Document Processing Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Durchschn. Verarbeitungszeit</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.avg_document_processing_time || 0}h
          </div>
          <p className="text-xs text-slate-600 mt-2">
            pro Dokument
          </p>
        </CardContent>
      </Card>

      {/* Avg Task Completion Time */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Aufgaben-Bearbeitungsdauer</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.avg_task_completion_time || 0}d
          </div>
          <p className="text-xs text-slate-600 mt-2">
            durchschnittlich bis Abschluss
          </p>
        </CardContent>
      </Card>

      {/* Rule Executions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Regel-Ausführungen</span>
            <Zap className="w-4 h-4 text-purple-600" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.total_rule_executions || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            automatisierte Aktionen
          </p>
        </CardContent>
      </Card>

      {/* Overdue Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Überfällige Aufgaben</span>
            {(metrics?.overdue_tasks || 0) > 0 && <Badge className="bg-red-100 text-red-700 text-xs">Warnung</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${(metrics?.overdue_tasks || 0) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {metrics?.overdue_tasks || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            benötigen Aufmerksamkeit
          </p>
        </CardContent>
      </Card>

      {/* Workflow Efficiency */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Workflow-Automatisierung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {metrics?.total_rules || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            aktive Automatisierungsregeln
          </p>
        </CardContent>
      </Card>
    </div>
  );
}