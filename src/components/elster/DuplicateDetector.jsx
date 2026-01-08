import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DuplicateDetector({ submissionId }) {
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  const checkDuplicates = async () => {
    setChecking(true);
    try {
      const response = await base44.functions.invoke('detectDuplicateSubmissions', {
        submission_id: submissionId
      });

      if (response.data.success) {
        setResult(response.data);
        if (response.data.is_duplicate) {
          toast.warning(`${response.data.duplicates.length} mögliche Duplikate gefunden`);
        } else {
          toast.success('Keine Duplikate gefunden');
        }
      }
    } catch (error) {
      toast.error('Duplikatsprüfung fehlgeschlagen');
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Duplikats-Erkennung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={checkDuplicates} disabled={checking} className="w-full">
          {checking ? 'Prüfe...' : 'Auf Duplikate prüfen'}
        </Button>

        {result && (
          <div className="space-y-3 pt-3 border-t">
            {result.is_duplicate ? (
              <>
                <div className="flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">
                    {result.duplicates.length} mögliche Duplikate
                  </span>
                </div>
                <div className="space-y-2">
                  {result.duplicates.map((dup, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="font-medium">Submission {dup.id.slice(0, 8)}...</div>
                          <div className="text-xs text-slate-600">
                            {new Date(dup.created_date).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {dup.similarity}% ähnlich
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Keine Duplikate gefunden</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}