import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Zap, Calendar, Building2, FileText, 
  Settings, CheckCircle, AlertCircle 
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutomatedFormGeneration() {
  const [triggers, setTriggers] = useState([
    {
      id: 'year-end',
      name: 'Jahresabschluss',
      description: 'Automatisch Anlage V für alle Objekte am Jahresende erstellen',
      icon: Calendar,
      enabled: false,
      schedule: '31. Dezember, 23:00 Uhr'
    },
    {
      id: 'new-building',
      name: 'Neues Objekt',
      description: 'Formular-Entwurf erstellen wenn neues Objekt hinzugefügt wird',
      icon: Building2,
      enabled: false,
      schedule: 'Bei Objekt-Erstellung'
    },
    {
      id: 'monthly-vat',
      name: 'Monatliche USt-VA',
      description: 'Umsatzsteuer-Voranmeldung am Monatsende automatisch vorbereiten',
      icon: FileText,
      enabled: false,
      schedule: 'Letzter Tag des Monats'
    },
    {
      id: 'quarterly-prep',
      name: 'Quartals-Vorbereitung',
      description: 'Quartalsabschluss-Dokumente 7 Tage vor Frist erstellen',
      icon: Calendar,
      enabled: false,
      schedule: 'Q1: 24.03, Q2: 24.06, Q3: 24.09, Q4: 24.12'
    }
  ]);

  const [configuring, setConfiguring] = useState(false);

  const handleToggleTrigger = async (triggerId, enabled) => {
    setConfiguring(true);
    
    try {
      await base44.functions.invoke('configureAutomationTrigger', {
        trigger_id: triggerId,
        enabled
      });

      setTriggers(triggers.map(t => 
        t.id === triggerId ? { ...t, enabled } : t
      ));

      toast.success(
        enabled 
          ? 'Automatisierung aktiviert' 
          : 'Automatisierung deaktiviert'
      );
    } catch (error) {
      toast.error('Konfiguration fehlgeschlagen');
      console.error(error);
    } finally {
      setConfiguring(false);
    }
  };

  const activeCount = triggers.filter(t => t.enabled).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Automatisierte Formular-Generierung
          </CardTitle>
          <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
            {activeCount} aktiv
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <strong>Automatisierung:</strong> Aktivierte Trigger erstellen automatisch Formular-Entwürfe 
              basierend auf definierten Ereignissen und Zeitplänen. Sie können diese dann prüfen und einreichen.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {triggers.map(trigger => {
            const Icon = trigger.icon;
            return (
              <div 
                key={trigger.id}
                className={`p-4 border rounded-lg transition-colors ${
                  trigger.enabled ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      trigger.enabled ? 'bg-green-100' : 'bg-slate-200'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        trigger.enabled ? 'text-green-600' : 'text-slate-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium mb-1">{trigger.name}</div>
                      <div className="text-sm text-slate-600 mb-2">
                        {trigger.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {trigger.schedule}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={trigger.enabled}
                    onCheckedChange={(checked) => handleToggleTrigger(trigger.id, checked)}
                    disabled={configuring}
                  />
                </div>
                
                {trigger.enabled && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Aktiv - Wird automatisch ausgeführt</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => toast.info('Erweiterte Einstellungen kommen bald')}
        >
          <Settings className="w-4 h-4 mr-2" />
          Erweiterte Einstellungen
        </Button>

        {activeCount > 0 && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>
                <strong>{activeCount}</strong> Automatisierung{activeCount !== 1 ? 'en' : ''} aktiv
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}