import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckCircle, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BulkValidationTool({ selectedSubmissions = [] }) {
  const [autoFix, setAutoFix] = useState(false);
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState(null);

  const runValidation = async () => {
    if (selectedSubmissions.length === 0) {
      toast.error('Keine Submissions ausgewählt');
      return;
    }

    setValidating(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('bulkValidateAndFix', {
        submission_ids: selectedSubmissions,
        auto_fix: autoFix
      });

      if (response.data.success) {
        setResults(response.data.results);
        toast.success(`${response.data.results.validated} Submissions validiert`);
      }
    } catch (error) {
      toast.error('Validierung fehlgeschlagen');
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Bulk-Validierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-slate-600">
          {selectedSubmissions.length} Submissions ausgewählt
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="auto-fix"
            checked={autoFix}
            onCheckedChange={setAutoFix}
          />
          <Label htmlFor="auto-fix" className="text-sm">
            Automatische Fehlerkorrektur
          </Label>
        </div>

        <Button
          onClick={runValidation}
          disabled={validating || selectedSubmissions.length === 0}
          className="w-full"
        >
          <Wrench className="w-4 h-4 mr-2" />
          {validating ? 'Validiere...' : 'Validierung starten'}
        </Button>

        {results && (
          <div className="pt-4 border-t space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{results.validated}</div>
                <div className="text-xs">Validiert</div>
              </div>
              {autoFix && (
                <div className="p-2 bg-blue-50 rounded">
                  <div className="text-lg font-bold text-blue-600">{results.fixed}</div>
                  <div className="text-xs">Korrigiert</div>
                </div>
              )}
              <div className="p-2 bg-red-50 rounded">
                <div className="text-lg font-bold text-red-600">{results.failed}</div>
                <div className="text-xs">Fehler</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}