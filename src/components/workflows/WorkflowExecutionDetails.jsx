import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { X, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function WorkflowExecutionDetails({ execution, onClose }) {
  return (
    <Card>
      <CardHeader className="flex items-start justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Workflow-Details</CardTitle>
          <p className="text-xs text-slate-600 mt-1">ID: {execution.id}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs font-medium text-slate-700">Status</p>
            <div className="mt-1">
              {execution.status === 'running' && (
                <Badge className="bg-blue-100 text-blue-700 animate-pulse">Läuft</Badge>
              )}
              {execution.status === 'completed' && (
                <Badge className="bg-green-100 text-green-700">Abgeschlossen</Badge>
              )}
              {execution.status === 'failed' && (
                <Badge className="bg-red-100 text-red-700">Fehler</Badge>
              )}
              {execution.status === 'cancelled' && (
                <Badge className="bg-amber-100 text-amber-700">Abgebrochen</Badge>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">Gestartet</p>
            <p className="text-sm text-slate-900 mt-1">
              {format(new Date(execution.started_at), 'dd.MM.yyyy HH:mm', { locale: de })}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700">Von</p>
            <p className="text-sm text-slate-900 mt-1">{execution.started_by}</p>
          </div>
          {execution.execution_time_seconds && (
            <div>
              <p className="text-xs font-medium text-slate-700">Dauer</p>
              <p className="text-sm text-slate-900 mt-1">
                {Math.round(execution.execution_time_seconds / 60)}m
              </p>
            </div>
          )}
        </div>

        {/* Steps */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Schritte</h4>
          <div className="space-y-2">
            {execution.steps_completed?.map((step, idx) => (
              <div key={step.step_id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Schritt {idx + 1}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{step.status}</Badge>
                    <span className="text-xs text-slate-600">
                      {format(new Date(step.started_at), 'HH:mm:ss', { locale: de })} - {format(new Date(step.completed_at), 'HH:mm:ss', { locale: de })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        {execution.pending_approvals?.length > 0 && (
          <div>
            <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Ausstehende Genehmigungen ({execution.pending_approvals.length})
            </h4>
            <div className="space-y-2">
              {execution.pending_approvals.map(approval => (
                <div key={approval.approval_id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {approval.approval_type === 'sequential' ? 'Sequenzielle' : 'Parallele'} Genehmigung
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Genehmiger: {approval.required_approvers.join(', ')}
                      </p>
                      {approval.approved_by?.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          Genehmigt von: {approval.approved_by.join(', ')}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1">
                        Verfällt: {format(new Date(approval.expires_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {execution.error_message && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Fehler</p>
              <p className="text-sm text-red-800 mt-1">{execution.error_message}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}