import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function DuplicateDetector({ submissionId }) {
  const [scanning, setScanning] = useState(false);
  const [duplicates, setDuplicates] = useState(null);
  const queryClient = useQueryClient();

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await base44.functions.invoke('detectDuplicateSubmissions', {});
      setDuplicates(response.data.duplicates || []);
      toast.info(`${response.data.duplicates_found} Duplikate gefunden`);
    } catch (error) {
      toast.error('Scan fehlgeschlagen');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async (dupId) => {
    try {
      await base44.entities.ElsterSubmission.delete(dupId);
      setDuplicates(duplicates.filter(d => 
        d.submission_1.id !== dupId && d.submission_2.id !== dupId
      ));
      queryClient.invalidateQueries({ queryKey: ['elster-submissions'] });
      toast.success('Duplikat gelöscht');
    } catch (error) {
      toast.error('Löschung fehlgeschlagen');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Duplikat-Erkennung</span>
          <Button 
            size="sm" 
            onClick={handleScan}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanne...
              </>
            ) : (
              'Scan starten'
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!duplicates ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Klicke "Scan starten" um nach Duplikaten zu suchen
          </p>
        ) : duplicates.length === 0 ? (
          <p className="text-sm text-green-600 text-center py-4">
            ✓ Keine Duplikate gefunden
          </p>
        ) : (
          <div className="space-y-3">
            {duplicates.map((dup, idx) => (
              <div key={idx} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Duplikat erkannt</div>
                    <div className="text-xs text-slate-600 mt-1 space-y-1">
                      <div>Submission 1: {dup.submission_1.id.slice(0, 8)}... ({dup.submission_1.status})</div>
                      <div>Submission 2: {dup.submission_2.id.slice(0, 8)}... ({dup.submission_2.status})</div>
                      <div className="pt-1 text-yellow-700">💡 {dup.recommendation}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(dup.submission_2.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}