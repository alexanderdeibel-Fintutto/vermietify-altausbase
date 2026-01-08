import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Archive } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ArchiveManagementCard() {
  const [yearsOld, setYearsOld] = useState(2);
  const [onlyAccepted, setOnlyAccepted] = useState(true);
  const [archiving, setArchiving] = useState(false);
  const [result, setResult] = useState(null);

  const handleArchive = async () => {
    setArchiving(true);
    try {
      const response = await base44.functions.invoke('archiveOldSubmissions', {
        years_old: yearsOld,
        only_accepted: onlyAccepted
      });

      if (response.data.success) {
        setResult(response.data);
        toast.success(`${response.data.archived_count} Submissions archiviert`);
      }
    } catch (error) {
      toast.error('Archivierung fehlgeschlagen');
      console.error(error);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5" />
          Archivierungs-Manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!result ? (
          <>
            <div>
              <Label className="text-xs">Älter als (Jahre)</Label>
              <Input
                type="number"
                value={yearsOld}
                onChange={(e) => setYearsOld(parseInt(e.target.value) || 1)}
                min={1}
                max={10}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={onlyAccepted}
                onCheckedChange={setOnlyAccepted}
              />
              <span className="text-sm">Nur akzeptierte Submissions</span>
            </div>

            <Button onClick={handleArchive} disabled={archiving} className="w-full">
              {archiving ? 'Archiviere...' : 'Archivierung starten'}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span>Archiviert:</span>
                <span className="font-bold">{result.archived_count}</span>
              </div>
              {result.failed_count > 0 && (
                <div className="flex justify-between p-2 bg-red-50 rounded">
                  <span>Fehler:</span>
                  <span className="font-bold">{result.failed_count}</span>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setResult(null)} className="w-full">
              Zurück
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}