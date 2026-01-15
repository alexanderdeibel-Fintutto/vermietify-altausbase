import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportScheduler({ buildingId, reportType }) {
  const [creating, setCreating] = useState(false);
  const [config, setConfig] = useState({
    frequency: 'weekly',
    recipients: '',
    format: 'pdf'
  });

  const handleCreate = async () => {
    if (!config.recipients.trim()) {
      toast.error('Bitte Empfänger eingeben');
      return;
    }

    setCreating(true);
    try {
      const response = await base44.functions.invoke('createReportSchedule', {
        buildingId,
        reportType,
        frequency: config.frequency,
        recipients: config.recipients.split(',').map(e => e.trim()),
        format: config.format
      });

      toast.success(response.data.message);
      setConfig({ frequency: 'weekly', recipients: '', format: 'pdf' });
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-purple-600" />
          Automatische Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">Häufigkeit</label>
          <select
            value={config.frequency}
            onChange={(e) => setConfig({...config, frequency: e.target.value})}
            className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
          >
            <option value="daily">Täglich</option>
            <option value="weekly">Wöchentlich</option>
            <option value="monthly">Monatlich</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Format</label>
          <select
            value={config.format}
            onChange={(e) => setConfig({...config, format: e.target.value})}
            className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Empfänger (Email)</label>
          <input
            type="text"
            placeholder="user1@example.com, user2@example.com"
            value={config.recipients}
            onChange={(e) => setConfig({...config, recipients: e.target.value})}
            className="w-full mt-2 border rounded-lg px-4 py-2 text-sm"
          />
          <p className="text-xs text-slate-500 mt-1">Mehrere Emails durch Komma getrennt</p>
        </div>

        <Button
          onClick={handleCreate}
          disabled={creating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {creating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Erstelle...
            </>
          ) : (
            'Automatischer Report erstellen'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}