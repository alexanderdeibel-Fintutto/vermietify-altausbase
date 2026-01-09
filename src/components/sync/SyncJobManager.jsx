import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Play, Trash2, Plus, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function SyncJobManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newJob, setNewJob] = useState({
    job_name: '',
    sync_type: 'all',
    frequency: 'daily',
    schedule_time: '03:00',
    notify_on_failure: true,
    retry_on_failure: true,
    max_retries: 3
  });
  const [executingJobId, setExecutingJobId] = useState(null);

  const { data: syncJobs, isLoading, refetch } = useQuery({
    queryKey: ['syncJobs'],
    queryFn: async () => {
      try {
        return await base44.entities.SyncJob.list('-created_at', 20);
      } catch {
        return [];
      }
    }
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['syncAuditLogs'],
    queryFn: async () => {
      try {
        return await base44.entities.SyncAuditLog.list('-started_at', 50);
      } catch {
        return [];
      }
    }
  });

  const handleCreateJob = async () => {
    try {
      await base44.asServiceRole.entities.SyncJob.create({
        ...newJob,
        is_active: true,
        next_sync_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

      toast.success('Sync-Job erstellt');
      setNewJob({
        job_name: '',
        sync_type: 'all',
        frequency: 'daily',
        schedule_time: '03:00',
        notify_on_failure: true,
        retry_on_failure: true,
        max_retries: 3
      });
      setShowCreateDialog(false);
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const handleExecuteJob = async (jobId) => {
    try {
      setExecutingJobId(jobId);
      const response = await base44.functions.invoke('executeSyncJob', {
        sync_job_id: jobId
      });

      if (response.data.success) {
        toast.success(`Synced: ${response.data.synced.transactions} Transaktionen, ${response.data.synced.crypto} Kryptowerte`);
        refetch();
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setExecutingJobId(null);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!confirm('Diesen Job wirklich löschen?')) return;
    try {
      await base44.asServiceRole.entities.SyncJob.delete(jobId);
      toast.success('Job gelöscht');
      refetch();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-amber-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Job Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Sync-Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Job-Name</Label>
              <Input
                value={newJob.job_name}
                onChange={(e) => setNewJob({...newJob, job_name: e.target.value})}
                placeholder="z.B. Tägliche Bank-Synchronisierung"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Typ</Label>
                <select
                  value={newJob.sync_type}
                  onChange={(e) => setNewJob({...newJob, sync_type: e.target.value})}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <option value="bank">Bank</option>
                  <option value="crypto">Krypto</option>
                  <option value="all">Alle</option>
                </select>
              </div>
              <div>
                <Label className="text-sm">Häufigkeit</Label>
                <select
                  value={newJob.frequency}
                  onChange={(e) => setNewJob({...newJob, frequency: e.target.value})}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <option value="hourly">Stündlich</option>
                  <option value="daily">Täglich</option>
                  <option value="weekly">Wöchentlich</option>
                  <option value="monthly">Monatlich</option>
                </select>
              </div>
            </div>

            {newJob.frequency === 'daily' && (
              <div>
                <Label className="text-sm">Uhrzeit</Label>
                <Input
                  type="time"
                  value={newJob.schedule_time}
                  onChange={(e) => setNewJob({...newJob, schedule_time: e.target.value})}
                  className="mt-1"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newJob.notify_on_failure}
                  onChange={(e) => setNewJob({...newJob, notify_on_failure: e.target.checked})}
                />
                Bei Fehlern benachrichtigen
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={newJob.retry_on_failure}
                  onChange={(e) => setNewJob({...newJob, retry_on_failure: e.target.checked})}
                />
                Automatische Wiederholung bei Fehler
              </label>
            </div>

            <div>
              <Label className="text-sm">Max. Wiederholungen</Label>
              <Input
                type="number"
                value={newJob.max_retries}
                onChange={(e) => setNewJob({...newJob, max_retries: parseInt(e.target.value)})}
                className="mt-1"
                min="0"
                max="10"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateJob} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Erstellen
              </Button>
              <Button onClick={() => setShowCreateDialog(false)} variant="outline" className="flex-1">
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sync Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sync-Jobs</h2>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Neuer Job
          </Button>
        </div>

        {isLoading ? (
          <Card className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </Card>
        ) : syncJobs && syncJobs.length > 0 ? (
          <div className="space-y-3">
            {syncJobs.map(job => (
              <Card key={job.id} className="hover:border-slate-300 transition-colors">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <p className="font-semibold text-sm">{job.job_name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {job.frequency === 'daily' && `täglich um ${job.schedule_time}`}
                        {job.frequency !== 'daily' && `${job.frequency}`}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.last_sync_status)}
                        <div>
                          <p className="text-xs font-semibold">
                            {job.last_sync_status || 'pending'}
                          </p>
                          {job.last_sync_at && (
                            <p className="text-xs text-slate-600">
                              {new Date(job.last_sync_at).toLocaleDateString('de-DE', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs"><span className="font-semibold">Erfolg:</span> {job.sync_count || 0}</p>
                      <p className="text-xs text-red-600"><span className="font-semibold">Fehler:</span> {job.failure_count || 0}</p>
                    </div>

                    <div className="col-span-2 flex gap-2">
                      <Button
                        onClick={() => handleExecuteJob(job.id)}
                        disabled={executingJobId === job.id}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        {executingJobId === job.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDeleteJob(job.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {job.last_sync_error && (
                    <Alert className="mt-2 bg-red-50 border-red-200 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-red-700 text-xs">
                        {job.last_sync_error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {job.consecutive_failures > 1 && (
                    <Alert className="mt-2 bg-amber-50 border-amber-200 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="text-amber-700 text-xs">
                        {job.consecutive_failures} aufeinanderfolgende Fehler
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-8">
            <p className="text-slate-600 text-sm">Keine Sync-Jobs konfiguriert</p>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      {auditLogs && auditLogs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Aktuelle Aktivitäten</h2>
          <div className="space-y-2">
            {auditLogs.slice(0, 10).map(log => (
              <Card key={log.id} className="p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <div>
                      <p className="font-semibold">{log.job_name}</p>
                      <p className="text-slate-600">{log.duration_seconds}s</p>
                    </div>
                  </div>
                  <p className="text-slate-600">
                    {new Date(log.started_at).toLocaleDateString('de-DE', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}