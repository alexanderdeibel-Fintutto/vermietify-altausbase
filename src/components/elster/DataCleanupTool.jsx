import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DataCleanupTool() {
  const [scanning, setScanning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const scanDuplicates = async () => {
    setScanning(true);
    try {
      const response = await base44.functions.invoke('cleanupDuplicateSubmissions', {
        dry_run: true
      });

      if (response.data.success) {
        setScanResult(response.data.results);
        toast.success(`${response.data.results.found} Duplikate gefunden`);
      }
    } catch (error) {
      toast.error('Scan fehlgeschlagen');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const cleanupDuplicates = async () => {
    setCleaning(true);
    try {
      const response = await base44.functions.invoke('cleanupDuplicateSubmissions', {
        dry_run: false
      });

      if (response.data.success) {
        toast.success(`${response.data.results.deleted} Duplikate entfernt`);
        setScanResult(null);
      }
    } catch (error) {
      toast.error('Bereinigung fehlgeschlagen');
      console.error(error);
    } finally {
      setCleaning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Datenbereinigung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scanResult ? (
          <Button onClick={scanDuplicates} disabled={scanning} className="w-full">
            {scanning ? 'Scanne...' : 'Nach Duplikaten suchen'}
          </Button>
        ) : (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {scanResult.found} Duplikate gefunden
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={cleanupDuplicates}
                disabled={cleaning}
                variant="destructive"
                className="flex-1"
              >
                {cleaning ? 'Entferne...' : 'Duplikate entfernen'}
              </Button>
              <Button onClick={() => setScanResult(null)} variant="outline">
                Abbrechen
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}