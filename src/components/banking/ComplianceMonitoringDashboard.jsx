import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { AlertTriangle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceMonitoringDashboard() {
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState(null);

  const handleMonitor = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('monitorComplianceViolations', {});
      setViolations(response.data);
      
      if (response.data.critical > 0) {
        toast.warning(`${response.data.critical} kritische Verstöße gefunden!`);
      } else {
        toast.success('Alle Compliance-Checks bestanden');
      }
    } catch (error) {
      toast.error('Überwachung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Compliance-Überwachung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleMonitor}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Überwache...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Compliance-Check starten
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {violations && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-slate-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-600">Gesamt Verstöße</p>
                  <p className="text-2xl font-bold">{violations.total_violations}</p>
                </div>
                <div>
                  <p className="text-sm text-red-600">Kritisch</p>
                  <p className="text-2xl font-bold text-red-600">{violations.critical}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Status</p>
                  <p className="text-lg font-semibold text-green-600">
                    {violations.critical === 0 ? '✓ OK' : '⚠️ Aktion erforderlich'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Violations List */}
          {violations.violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Gefundene Verstöße</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {violations.violations.map((violation, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                    {violation.severity === 'HIGH' ? (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{violation.type}</p>
                      <p className="text-xs text-slate-600 mt-1">{violation.message}</p>
                    </div>
                    <Badge className={getSeverityColor(violation.severity)}>
                      {violation.severity}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}