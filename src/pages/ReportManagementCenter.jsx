import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { FileText, Clock, Edit2, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportManagementCenter() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await base44.entities.ReportSchedule.list('-created_date', 20);
        setSchedules(data);
      } catch (error) {
        toast.error('Fehler beim Laden der Report-Zeitpläne');
      } finally {
        setLoading(false);
      }
    };
    loadSchedules();
  }, []);

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Zeitplan wirklich löschen?')) return;

    try {
      await base44.entities.ReportSchedule.delete(scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      toast.success('Zeitplan gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const frequencyLabels = {
    daily: '📅 Täglich',
    weekly: '📅 Wöchentlich',
    monthly: '📅 Monatlich'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Clock className="w-10 h-10 text-purple-600" />
            Report-Verwaltung
          </h1>
          <p className="text-slate-600">Verwwalten Sie Ihre automatischen Report-Zeitpläne</p>
        </div>

        {/* Create New Schedule */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <Button className="bg-green-600 hover:bg-green-700 w-full gap-2">
              <Plus className="w-5 h-5" />
              Neuer Report-Zeitplan
            </Button>
          </CardContent>
        </Card>

        {/* Schedules List */}
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Wird geladen...
            </CardContent>
          </Card>
        ) : schedules.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Keine Report-Zeitpläne vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map(schedule => (
              <Card key={schedule.id} className="bg-white shadow-md hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-slate-900">{schedule.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.enabled ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm text-slate-600 mb-4">
                        <div>
                          <p className="text-xs text-slate-500">Typ</p>
                          <p className="font-medium text-slate-900">{schedule.reportType}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Häufigkeit</p>
                          <p className="font-medium">{frequencyLabels[schedule.frequency]}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Format</p>
                          <p className="font-medium uppercase">{schedule.format}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Empfänger</p>
                          <p className="font-medium">{schedule.recipients?.length || 0} Personen</p>
                        </div>
                      </div>

                      {schedule.recipients && (
                        <p className="text-xs text-slate-500 mb-3">
                          Emails: {schedule.recipients.join(', ')}
                        </p>
                      )}

                      <p className="text-xs text-slate-400">
                        Erstellt: {new Date(schedule.created_date).toLocaleDateString('de-DE')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(schedule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}