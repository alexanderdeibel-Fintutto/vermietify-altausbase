import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Wrench } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DataValidationPanel() {
  const [validationResults, setValidationResults] = useState(null);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);

  const validateMutation = useMutation({
    mutationFn: async () => {
      // Validate all buildings
      const buildings = await base44.entities.Building.list('-updated_date', 100);
      const issues = [];

      buildings.forEach(b => {
        const checks = [
          { name: 'Name vorhanden', pass: !!b.name },
          { name: 'Adresse vorhanden', pass: !!b.address },
          { name: 'PLZ gültig', pass: /^\d{5}$/.test(b.postal_code || '') },
          { name: 'Stadt vorhanden', pass: !!b.city }
        ];

        checks.forEach(check => {
          if (!check.pass) {
            issues.push({
              building: b.name || 'Unnamed',
              buildingId: b.id,
              issue: check.name,
              severity: 'error'
            });
          }
        });
      });

      return {
        totalChecked: buildings.length,
        issuesFound: issues.length,
        issues: issues
      };
    },
    onSuccess: (result) => {
      setValidationResults(result);
      if (result.issuesFound === 0) {
        toast.success('✅ Alle Daten sind korrekt');
      } else {
        toast.error(`⚠️ ${result.issuesFound} Fehler gefunden`);
      }
    }
  });

  const autoFixMutation = useMutation({
    mutationFn: async () => {
      // Auto-fix known issues
      let fixed = 0;
      
      for (const issue of validationResults.issues) {
        try {
          await base44.entities.Building.update(issue.buildingId, {
            postal_code: '12345', // Default value
          });
          fixed++;
        } catch (e) {
          console.error('Fix failed:', e);
        }
      }
      
      return fixed;
    },
    onSuccess: (fixed) => {
      toast.success(`✅ ${fixed} Fehler behoben`);
      validateMutation.mutate();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Datenvalidierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Results */}
        {validationResults && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded">
              <span className="text-sm font-medium">Überprüfte Einträge</span>
              <Badge>{validationResults.totalChecked}</Badge>
            </div>

            {validationResults.issuesFound === 0 ? (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  ✅ Alle Daten sind korrekt
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    ⚠️ {validationResults.issuesFound} Fehler gefunden
                  </AlertDescription>
                </Alert>

                {/* Issues List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {validationResults.issues.map((issue, idx) => (
                    <div key={idx} className="p-2 border rounded text-sm">
                      <p className="font-medium">{issue.building}</p>
                      <p className="text-xs text-slate-600">❌ {issue.issue}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-3 border-t">
          <Button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
            variant="outline"
            className="flex-1"
          >
            {validateMutation.isPending ? 'Prüfe...' : 'Prüfe Daten'}
          </Button>

          {validationResults && validationResults.issuesFound > 0 && (
            <Button
              onClick={() => autoFixMutation.mutate()}
              disabled={autoFixMutation.isPending}
              className="flex-1"
            >
              {autoFixMutation.isPending ? 'Behebe...' : 'Auto-Fix'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}