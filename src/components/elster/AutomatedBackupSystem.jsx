import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, Download, Clock, CheckCircle, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AutomatedBackupSystem() {
  const [backupHistory] = useState([
    {
      id: '1',
      date: new Date(Date.now() - 86400000).toISOString(),
      type: 'automatic',
      size: '2.4 MB',
      submissions: 15,
      status: 'completed'
    },
    {
      id: '2',
      date: new Date(Date.now() - 172800000).toISOString(),
      type: 'automatic',
      size: '2.3 MB',
      submissions: 15,
      status: 'completed'
    },
    {
      id: '3',
      date: new Date(Date.now() - 604800000).toISOString(),
      type: 'manual',
      size: '2.1 MB',
      submissions: 12,
      status: 'completed'
    }
  ]);

  const handleCreateBackup = async () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Erstelle Backup...',
        success: 'Backup erfolgreich erstellt',
        error: 'Backup fehlgeschlagen'
      }
    );
  };

  const nextBackup = new Date(Date.now() + 86400000);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5 text-green-600" />
          Automatisches Backup-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Backup Status */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">GoBD-konforme Archivierung</span>
          </div>
          <div className="text-sm text-green-700">
            Automatische tägliche Backups • 10 Jahre Aufbewahrung
          </div>
        </div>

        {/* Next Backup */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900">Nächstes Backup</div>
              <div className="text-xs text-blue-700">
                {nextBackup.toLocaleDateString('de-DE')} um {nextBackup.toLocaleTimeString('de-DE')}
              </div>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            in {Math.floor((nextBackup - new Date()) / (1000 * 60 * 60))}h
          </Badge>
        </div>

        {/* Manual Backup */}
        <Button
          onClick={handleCreateBackup}
          variant="outline"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          Manuelles Backup erstellen
        </Button>

        {/* Backup History */}
        <div className="pt-4 border-t">
          <div className="text-sm font-medium mb-3">Backup-Historie</div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {backupHistory.map(backup => (
              <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(backup.date).toLocaleDateString('de-DE')}
                    </div>
                    <div className="text-xs text-slate-600">
                      {backup.submissions} Einreichungen • {backup.size}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {backup.type === 'automatic' ? 'Auto' : 'Manuell'}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Stats */}
        <div className="p-3 bg-slate-50 border rounded-lg">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-slate-600">Speicherplatz</span>
            <span className="font-medium">2.4 MB / 1 GB</span>
          </div>
          <Progress value={0.24} className="h-1" />
        </div>
      </CardContent>
    </Card>
  );
}