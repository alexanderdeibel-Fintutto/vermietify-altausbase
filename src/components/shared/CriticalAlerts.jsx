import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays } from 'date-fns';

export default function CriticalAlerts({ buildingId }) {
  const [alerts, setAlerts] = useState([]);

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-for-alerts', buildingId],
    queryFn: async () => {
      const units = await base44.entities.Unit.filter({ building_id: buildingId });
      const unitIds = units.map(u => u.id);
      return base44.entities.LeaseContract.filter({ unit_id: { $in: unitIds } });
    },
    enabled: !!buildingId
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-for-alerts', buildingId],
    queryFn: async () => {
      return base44.entities.Invoice.filter({ building_id: buildingId });
    },
    enabled: !!buildingId
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments-for-alerts', buildingId],
    queryFn: async () => {
      return base44.entities.Payment.filter({ building_id: buildingId, status: 'pending' });
    },
    enabled: !!buildingId
  });

  useEffect(() => {
    const newAlerts = [];
    const today = new Date();

    // Check expiring contracts
    contracts.forEach(contract => {
      if (!contract.end_date) return;
      const daysUntilEnd = differenceInDays(new Date(contract.end_date), today);
      
      if (daysUntilEnd < 0) {
        newAlerts.push({
          id: `expired-${contract.id}`,
          type: 'error',
          title: 'Mietvertrag abgelaufen',
          description: `Vertrag "${contract.contract_number}" ist seit ${Math.abs(daysUntilEnd)} Tagen abgelaufen`,
          severity: 'critical'
        });
      } else if (daysUntilEnd < 30) {
        newAlerts.push({
          id: `expiring-${contract.id}`,
          type: 'warning',
          title: 'Mietvertrag läuft bald ab',
          description: `Vertrag "${contract.contract_number}" endet in ${daysUntilEnd} Tagen`,
          severity: 'high'
        });
      }
    });

    // Check overdue invoices
    invoices.forEach(invoice => {
      if (invoice.status !== 'pending') return;
      const daysOverdue = differenceInDays(today, new Date(invoice.due_date));
      
      if (daysOverdue > 0) {
        newAlerts.push({
          id: `overdue-${invoice.id}`,
          type: 'error',
          title: 'Rechnung überfällig',
          description: `Rechnung ${invoice.invoice_number} ist seit ${daysOverdue} Tagen überfällig`,
          severity: 'critical'
        });
      }
    });

    // Check pending payments
    if (payments.length > 0) {
      newAlerts.push({
        id: `pending-payments`,
        type: 'info',
        title: 'Ausstehende Zahlungen',
        description: `${payments.length} Zahlungen warten auf Freigabe`,
        severity: 'medium'
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    setAlerts(newAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]));
  }, [contracts, invoices, payments]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 5).map(alert => (
        <Alert
          key={alert.id}
          className={
            alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
            alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
            alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
            'border-blue-200 bg-blue-50'
          }
        >
          <div className="flex items-start gap-3">
            {alert.severity === 'critical' && <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />}
            {alert.severity === 'high' && <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />}
            {alert.severity === 'medium' && <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />}
            {alert.severity === 'low' && <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5" />}
            
            <div className="flex-1">
              <AlertDescription className={
                alert.severity === 'critical' ? 'text-red-800' :
                alert.severity === 'high' ? 'text-orange-800' :
                alert.severity === 'medium' ? 'text-yellow-800' :
                'text-blue-800'
              }>
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs mt-1">{alert.description}</p>
              </AlertDescription>
            </div>

            <Badge
              variant="outline"
              className="flex-shrink-0 text-xs"
            >
              {alert.severity}
            </Badge>
          </div>
        </Alert>
      ))}

      {alerts.length > 5 && (
        <p className="text-xs text-slate-500 text-center">
          +{alerts.length - 5} weitere Alerts
        </p>
      )}
    </div>
  );
}