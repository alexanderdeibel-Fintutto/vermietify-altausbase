import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Download, Upload } from 'lucide-react';

export default function BackupRestore() {
  const handleBackup = () => {
    console.log('Creating backup...');
  };

  const handleRestore = () => {
    console.log('Restoring backup...');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Backup & Wiederherstellung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--vf-info-50)] rounded-lg">
            <p className="text-sm text-[var(--vf-info-700)]">
              Letzte Sicherung: Heute, 03:00 Uhr
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Button variant="outline" onClick={handleBackup}>
              <Download className="h-4 w-4 mr-2" />
              Backup erstellen
            </Button>
            <Button variant="outline" onClick={handleRestore}>
              <Upload className="h-4 w-4 mr-2" />
              Wiederherstellen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}