import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function AlertManager({ buildingId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newAlert, setNewAlert] = useState({
    alertType: '',
    severity: 'MEDIUM',
    message: '',
    slackNotify: false
  });

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await base44.entities.AlertRule.filter({ building_id: buildingId }, '-created_date', 10);
        setAlerts(data);
      } catch (error) {
        toast.error('Fehler beim Laden der Alerts');
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, [buildingId]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!newAlert.alertType || !newAlert.message) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      await base44.functions.invoke('sendReportAlert', {
        buildingId,
        alertType: newAlert.alertType,
        severity: newAlert.severity,
        message: newAlert.message,
        recipients: { slack: newAlert.slackNotify ? '#alerts' : null }
      });

      setNewAlert({ alertType: '', severity: 'MEDIUM', message: '', slackNotify: false });
      setShowNew(false);
      toast.success('Alert erstellt');

      // Neuladen
      const data = await base44.entities.AlertRule.filter({ building_id: buildingId }, '-created_date', 10);
      setAlerts(data);
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity === 'HIGH') return 'bg-red-100 text-red-900 border-red-300';
    if (severity === 'MEDIUM') return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    return 'bg-blue-100 text-blue-900 border-blue-300';
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setShowNew(!showNew)}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Bell className="w-4 h-4 mr-2" />
          {showNew ? 'Abbrechen' : 'Neuer Alert'}
        </Button>
      </div>

      {showNew && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <form onSubmit={handleCreateAlert} className="space-y-3">
              <input
                type="text"
                placeholder="Alert-Typ"
                value={newAlert.alertType}
                onChange={(e) => setNewAlert({...newAlert, alertType: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
              <select
                value={newAlert.severity}
                onChange={(e) => setNewAlert({...newAlert, severity: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
              </select>
              <textarea
                placeholder="Nachricht"
                value={newAlert.message}
                onChange={(e) => setNewAlert({...newAlert, message: e.target.value})}
                className="w-full border rounded px-3 py-2 text-sm h-20"
                required
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newAlert.slackNotify}
                  onChange={(e) => setNewAlert({...newAlert, slackNotify: e.target.checked})}
                  className="rounded"
                />
                <span>An Slack benachrichtigen</span>
              </label>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Alert erstellen
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center text-slate-600">
            Wird geladen...
          </CardContent>
        </Card>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-8 text-slate-600">
            Keine Alerts vorhanden
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <Card key={alert.id} className={`border-2 ${getSeverityColor(alert.severity)}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{alert.alert_type}</p>
                    <p className="text-sm mt-1">{alert.message}</p>
                    <p className="text-xs mt-2 opacity-75">
                      {new Date(alert.created_date).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                    {alert.severity}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}