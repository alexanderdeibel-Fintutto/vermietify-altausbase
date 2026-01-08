import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Database, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BackupManager({ submissionId = null }) {
  const [backing, setBacking] = useState(false);

  const createBackup = async () => {
    setBacking(true);
    try {
      const response = await base44.functions.invoke('createAutomatedBackup', {
        submission_id: submissionId,
        include_metadata: true
      });

      if (response.data.success) {
        toast.success(`Backup erstellt: ${response.data.submissions_backed_up} Submissions`);
      }
    } catch (error) {
      toast.error('Backup fehlgeschlagen');
      console.error(error);
    } finally {
      setBacking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Backup-System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600">
          Erstellen Sie automatische Backups Ihrer ELSTER-Einreichungen gemäß GoBD-Anforderungen (10 Jahre Aufbewahrungspflicht).
        </div>

        <div className="flex items-center gap-2 text-xs text-green-600">
          <CheckCircle className="w-4 h-4" />
          GoBD-konform • 10 Jahre Aufbewahrung • Revisionssicher
        </div>

        <Button
          onClick={createBackup}
          disabled={backing}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {backing ? 'Erstelle Backup...' : submissionId ? 'Submission sichern' : 'Alle Submissions sichern'}
        </Button>

        <div className="text-xs text-slate-500 pt-2 border-t">
          Backups werden automatisch als verschlüsselte Dokumente gespeichert und sind jederzeit wiederherstellbar.
        </div>
      </CardContent>
    </Card>
  );
}