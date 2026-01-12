import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  Calendar,
  Settings,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AutoSubmitScheduler() {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: scheduledTasks = [], isLoading } = useQuery({
    queryKey: ['scheduled-tasks-elster'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('listScheduledTasks', {});
        return response.data?.tasks || [];
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        return [];
      }
    }
  });

  const autoSubmitTask = scheduledTasks.find(t => t.function_name === 'autoSubmitElsterReturns');

  const { data: readySubmissions = [] } = useQuery({
    queryKey: ['ready-submissions'],
    queryFn: async () => {
      const items = await base44.entities.ElsterSubmission.filter({ status: 'ready' });
      return items;
    }
  });

  const handleCreateSchedule = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createScheduledTask', {
        name: 'ELSTER Auto-Übermittlung',
        description: 'Automatische Übermittlung aller bereiten ELSTER-Submissions',
        function_name: 'autoSubmitElsterReturns',
        schedule_type: 'simple',
        repeat_interval: 1,
        repeat_unit: 'days',
        start_time: '00:00',
        is_active: true
      });

      if (response.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-elster'] });
        toast.success('Automatische Übermittlung aktiviert');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSchedule = async () => {
    if (!autoSubmitTask) return;
    
    setLoading(true);
    try {
      const response = await base44.functions.invoke('toggleScheduledTask', {
        task_id: autoSubmitTask.id
      });

      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-elster'] });
      toast.success(autoSubmitTask.is_active ? 'Auto-Übermittlung pausiert' : 'Auto-Übermittlung aktiviert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRun = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('autoSubmitElsterReturns', {});
      
      if (response.data?.success) {
        const { results } = response.data;
        toast.success(`Abgeschlossen: ${results.successful} erfolgreich, ${results.failed} fehlgeschlagen`);
        queryClient.invalidateQueries({ queryKey: ['ready-submissions'] });
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async () => {
    if (!autoSubmitTask) return;
    if (!confirm('Automatische Übermittlung wirklich deaktivieren?')) return;

    setLoading(true);
    try {
      await base44.functions.invoke('deleteScheduledTask', {
        task_id: autoSubmitTask.id
      });

      queryClient.invalidateQueries({ queryKey: ['scheduled-tasks-elster'] });
      toast.success('Automatische Übermittlung deaktiviert');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-6 text-slate-600">Lade Einstellungen...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={autoSubmitTask?.is_active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className={`w-6 h-6 ${autoSubmitTask?.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
              <div>
                <CardTitle>Automatische ELSTER-Übermittlung</CardTitle>
                <CardDescription>
                  {autoSubmitTask 
                    ? autoSubmitTask.is_active 
                      ? 'Aktiv - Täglich um Mitternacht'
                      : 'Pausiert'
                    : 'Nicht konfiguriert'
                  }
                </CardDescription>
              </div>
            </div>
            <Badge className={autoSubmitTask?.is_active ? 'bg-emerald-600' : 'bg-slate-400'}>
              {autoSubmitTask?.is_active ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Aktiv
                </>
              ) : (
                <>
                  <Pause className="w-3 h-3 mr-1" />
                  Inaktiv
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info */}
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Bereite Submissions:</span>
              <Badge variant="outline" className="text-base font-semibold">
                {readySubmissions.length}
              </Badge>
            </div>
            {autoSubmitTask && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Zeitplan:</span>
                  <span className="font-medium">Täglich um 00:00 Uhr</span>
                </div>
                {autoSubmitTask.last_run && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Letzte Ausführung:</span>
                    <span className="font-medium">
                      {format(new Date(autoSubmitTask.last_run), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                    </span>
                  </div>
                )}
                {autoSubmitTask.next_run && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Nächste Ausführung:</span>
                    <span className="font-medium">
                      {format(new Date(autoSubmitTask.next_run), 'dd.MM.yyyy HH:mm', { locale: de })} Uhr
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!autoSubmitTask ? (
              <Button
                onClick={handleCreateSchedule}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Automatische Übermittlung aktivieren
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleToggleSchedule}
                  disabled={loading}
                  variant="outline"
                >
                  {autoSubmitTask.is_active ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausieren
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Aktivieren
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleDeleteSchedule}
                  disabled={loading}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  Deaktivieren
                </Button>
              </>
            )}
            
            <Button
              onClick={handleManualRun}
              disabled={loading || readySubmissions.length === 0}
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              Jetzt manuell ausführen
            </Button>
          </div>

          {/* Warning */}
          {readySubmissions.length === 0 && (
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="flex items-center gap-2 text-blue-900">
                <AlertCircle className="w-4 h-4" />
                Aktuell sind keine Submissions bereit zur Übermittlung.
              </AlertDescription>
            </Alert>
          )}

          {readySubmissions.length > 0 && !autoSubmitTask?.is_active && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertDescription className="flex items-center gap-2 text-yellow-900">
                <Bell className="w-4 h-4" />
                {readySubmissions.length} Submission{readySubmissions.length !== 1 ? 's' : ''} bereit zur Übermittlung. 
                Aktivieren Sie die automatische Übermittlung oder führen Sie sie manuell aus.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            So funktioniert's
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p>Prüft alle Submissions im Status "ready"</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p>Validiert Zertifikat-Gültigkeit und Status</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p>Führt Übermittlung für jede bereite Submission durch</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p>Sendet Benachrichtigungen über Erfolg/Misserfolg</p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
            <p>Läuft täglich um Mitternacht (wenn aktiviert)</p>
          </div>
        </CardContent>
      </Card>

      {/* Ready Submissions */}
      {readySubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bereite Submissions ({readySubmissions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readySubmissions.slice(0, 5).map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">
                      {sub.submission_type} • {sub.tax_year}
                    </p>
                    <p className="text-xs text-slate-600">
                      ID: {sub.id.substring(0, 8)}...
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">Bereit</Badge>
                </div>
              ))}
              {readySubmissions.length > 5 && (
                <p className="text-xs text-slate-500 text-center pt-2">
                  ...und {readySubmissions.length - 5} weitere
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}