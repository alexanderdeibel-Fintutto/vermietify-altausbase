import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Database } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function BackupRestore() {
  const backups = [
    { id: 1, created_date: new Date(), size: '2.4 MB', type: 'auto' },
    { id: 2, created_date: new Date(Date.now() - 86400000), size: '2.3 MB', type: 'manual' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Wiederherstellung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4">
          {backups.map((backup) => (
            <div key={backup.id} className="flex items-center justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div>
                <div className="text-sm font-medium">
                  {backup.type === 'auto' ? 'Automatisch' : 'Manuell'}
                </div>
                <TimeAgo date={backup.created_date} className="text-xs text-[var(--theme-text-muted)]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--theme-text-muted)]">{backup.size}</span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="gradient" className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Backup erstellen
        </Button>
      </CardContent>
    </Card>
  );
}