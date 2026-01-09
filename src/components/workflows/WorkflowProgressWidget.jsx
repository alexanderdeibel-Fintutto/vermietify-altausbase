import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkflowProgressWidget({ workflow }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!workflow) {
    return null;
  }

  const approvers = workflow.approvers || [];
  const approved = approvers.filter(a => a.status === 'approved').length;
  const rejected = approvers.filter(a => a.status === 'rejected').length;
  const pending = approvers.filter(a => a.status === 'pending').length;

  const progressPercentage = approvers.length > 0 ? (approved / approvers.length) * 100 : 0;

  const statusColor = {
    pending: 'bg-yellow-50 border-yellow-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
    withdrawn: 'bg-gray-50 border-gray-200',
    cancelled: 'bg-gray-50 border-gray-200'
  };

  const statusIcon = {
    pending: <Clock className="w-5 h-5 text-yellow-600" />,
    approved: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    rejected: <XCircle className="w-5 h-5 text-red-600" />,
    withdrawn: <AlertCircle className="w-5 h-5 text-gray-600" />,
    cancelled: <AlertCircle className="w-5 h-5 text-gray-600" />
  };

  const isOverdue = workflow.deadline && new Date() > new Date(workflow.deadline);

  return (
    <Card className={statusColor[workflow.status]}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {statusIcon[workflow.status]}
            <div className="flex-1">
              <CardTitle className="text-sm">{workflow.workflow_name}</CardTitle>
              <p className="text-xs text-slate-600 mt-1">Von: {workflow.requester_email}</p>
            </div>
          </div>
          <Badge className={
            workflow.status === 'approved' ? 'bg-green-100 text-green-800' :
            workflow.status === 'rejected' ? 'bg-red-100 text-red-800' :
            workflow.status === 'withdrawn' ? 'bg-gray-100 text-gray-800' :
            workflow.escalated ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }>
            {workflow.escalated && '🚨 '}
            {workflow.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-semibold text-slate-700">Genehmigungsprozess</p>
            <p className="text-xs text-slate-600">
              {approved}/{approvers.length} genehmigt
            </p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Approver Status */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Genehmiger</p>
          {approvers.map((approver, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-slate-200">
              <div className="flex items-center gap-2 flex-1">
                <div className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      approver.status === 'approved' ? '#10b981' :
                      approver.status === 'rejected' ? '#ef4444' :
                      '#f59e0b'
                  }}
                />
                <div className="flex-1">
                  <p className="text-xs font-semibold">{approver.approver_email}</p>
                  {approver.comment && (
                    <p className="text-xs text-slate-600 italic">"{approver.comment}"</p>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold ml-2">
                {approver.status === 'approved' ? '✓' :
                 approver.status === 'rejected' ? '✗' :
                 '⏳'}
              </span>
            </div>
          ))}
        </div>

        {/* Deadline Warning */}
        {isOverdue && (
          <div className="p-2 bg-red-100 border border-red-300 rounded text-xs text-red-800">
            ⚠️ Frist überschritten seit {new Date(workflow.deadline).toLocaleDateString('de-DE')}
          </div>
        )}

        {/* Withdrawal Info */}
        {workflow.withdrawn && (
          <div className="p-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-800">
            Zurückgezogen: {workflow.withdrawal_reason}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-white rounded border">
            <p className="text-lg font-bold text-green-600">{approved}</p>
            <p className="text-xs text-slate-600">Genehmigt</p>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <p className="text-lg font-bold text-yellow-600">{pending}</p>
            <p className="text-xs text-slate-600">Ausstehend</p>
          </div>
          <div className="text-center p-2 bg-white rounded border">
            <p className="text-lg font-bold text-red-600">{rejected}</p>
            <p className="text-xs text-slate-600">Abgelehnt</p>
          </div>
        </div>

        {/* Details Button */}
        <Button
          onClick={() => setDetailsOpen(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Details anzeigen
        </Button>
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{workflow.workflow_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold mb-1">Workflow-Historie</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {workflow.history?.map((entry, idx) => (
                  <div key={idx} className="text-xs p-2 bg-slate-50 rounded border">
                    <p className="font-semibold">{entry.action.toUpperCase()}</p>
                    <p className="text-slate-600">Von: {entry.actor}</p>
                    <p className="text-slate-600">Zeit: {new Date(entry.timestamp).toLocaleString('de-DE')}</p>
                    {entry.details && <p className="text-slate-700 mt-1">"{entry.details}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}