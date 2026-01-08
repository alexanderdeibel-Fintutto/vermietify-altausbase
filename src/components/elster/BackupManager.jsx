import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BackupManager({ submissionId }) {
  const [creating, setCreating] = useState(false);

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await base44.functions.invoke('createSubmissionBackup', {
        submission_id: submissionId
      });

      if (response.data.success) {
        toast.success('Backup erfolgreich erstellt');
      }
    } catch (error) {
      toast.error('Backup fehlgeschlagen');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Backup & Recovery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Erstellen Sie ein Backup dieser Submission für GoBD-Compliance
        </p>
        
        <Button onClick={createBackup} disabled={creating} className="w-full">
          {creating ? (
            'Erstelle Backup...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Backup jetzt erstellen
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}