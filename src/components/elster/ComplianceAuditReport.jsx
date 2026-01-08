import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ComplianceAuditReport() {
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [audit, setAudit] = useState(null);
  const [running, setRunning] = useState(false);

  const runAudit = async () => {
    setRunning(true);
    try {
      const response = await base44.functions.invoke('runComplianceAudit', {
        tax_year: year
      });

      if (response.data.success) {
        setAudit(response.data);
        toast.success('Compliance-Audit abgeschlossen');
      }
    } catch (error) {
      toast.error('Audit fehlgeschlagen');
      console.error(error);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          Compliance-Audit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            placeholder="Jahr"
            className="w-32"
          />
          <Button onClick={runAudit} disabled={running}>
            {running ? 'Prüfe...' : 'Audit starten'}
          </Button>
        </div>

        {audit && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600">
                {audit.compliance_score}%
              </div>
              <div className="text-sm text-slate-600">Compliance-Score</div>
              <Progress value={audit.compliance_score} className="mt-2" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-green-50 rounded text-center">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <div className="text-xs text-slate-600">Bestanden</div>
                <div className="font-bold">
                  {audit.audit.checks.filter(c => c.passed).length}
                </div>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <div className="text-xs text-slate-600">Verstöße</div>
                <div className="font-bold">{audit.audit.violations.length}</div>
              </div>
              <div className="p-2 bg-yellow-50 rounded text-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                <div className="text-xs text-slate-600">Warnungen</div>
                <div className="font-bold">{audit.audit.warnings.length}</div>
              </div>
            </div>

            {audit.audit.violations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-red-600">Kritische Verstöße:</div>
                {audit.audit.violations.map((v, idx) => (
                  <div key={idx} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <Badge variant="destructive" className="mb-1">{v.severity}</Badge>
                    <div>{v.message}</div>
                  </div>
                ))}
              </div>
            )}

            {audit.audit.warnings.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-yellow-600">Warnungen:</div>
                {audit.audit.warnings.map((w, idx) => (
                  <div key={idx} className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div>{w.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}