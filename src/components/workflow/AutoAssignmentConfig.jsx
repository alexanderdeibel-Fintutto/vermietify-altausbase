import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Users, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AutoAssignmentConfig({ action, onChange }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          Automatische Zuweisung - Konfiguration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-2">Intelligente Zuweisung aktiviert</h4>
              <p className="text-xs text-slate-700 mb-3">
                Das System wählt automatisch den besten Techniker basierend auf:
              </p>
              <ul className="text-xs text-slate-700 space-y-1 ml-4">
                <li>• Fachgebiet (Elektrik, Sanitär, Heizung, etc.)</li>
                <li>• Gebäudezuständigkeit</li>
                <li>• Aktuelle Verfügbarkeit</li>
                <li>• Workload-Balancierung</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-2 block">Optionen</label>
          
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-2">
            <div>
              <p className="text-sm font-medium">Sofortige Benachrichtigung</p>
              <p className="text-xs text-slate-600">Techniker wird sofort per E-Mail benachrichtigt</p>
            </div>
            <Switch
              checked={action.config?.notify_immediately !== false}
              onCheckedChange={(checked) => onChange({
                ...action,
                config: { ...action.config, notify_immediately: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Fallback auf Admins</p>
              <p className="text-xs text-slate-600">Benachrichtigung an Admins falls kein Techniker gefunden</p>
            </div>
            <Switch
              checked={action.config?.fallback_to_admin !== false}
              onCheckedChange={(checked) => onChange({
                ...action,
                config: { ...action.config, fallback_to_admin: checked }
              })}
            />
          </div>
        </div>

        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-slate-700">
            <strong>Hinweis:</strong> Stellen Sie sicher, dass Techniker in der{' '}
            <Link 
              to={createPageUrl('TechnicianManagement')}
              className="text-blue-600 hover:underline"
            >
              Techniker-Verwaltung
            </Link>
            {' '}konfiguriert sind.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}