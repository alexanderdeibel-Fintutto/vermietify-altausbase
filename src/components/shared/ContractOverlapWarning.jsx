import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ContractOverlapWarning({ unitId, startDate, endDate, excludeId }) {
  const [overlaps, setOverlaps] = useState([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!unitId || !startDate) {
      setOverlaps([]);
      return;
    }

    const checkOverlaps = async () => {
      setChecking(true);
      try {
        const allContracts = await base44.entities.LeaseContract.filter({ unit_id: unitId });
        
        const startMs = new Date(startDate).getTime();
        const endMs = endDate ? new Date(endDate).getTime() : Infinity;
        
        const overlappingContracts = allContracts.filter(contract => {
          if (excludeId && contract.id === excludeId) return false;
          if (contract.status === 'terminated') return false;
          
          const contractStartMs = new Date(contract.start_date).getTime();
          const contractEndMs = contract.end_date ? new Date(contract.end_date).getTime() : Infinity;
          
          // Check for overlap
          const hasOverlap = (startMs <= contractEndMs) && (endMs >= contractStartMs);
          
          return hasOverlap;
        });
        
        setOverlaps(overlappingContracts);
      } catch (error) {
        console.error('Overlap check failed:', error);
      } finally {
        setChecking(false);
      }
    };

    const debounce = setTimeout(checkOverlaps, 500);
    return () => clearTimeout(debounce);
  }, [unitId, startDate, endDate, excludeId]);

  if (checking || overlaps.length === 0) return null;

  return (
    <Alert className="border-red-500 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-900">
        <p className="font-semibold mb-2">⚠️ Überlappende Verträge gefunden ({overlaps.length})</p>
        <div className="space-y-2 mb-3">
          {overlaps.map(overlap => (
            <div key={overlap.id} className="text-sm flex items-center justify-between bg-white p-2 rounded border border-red-200">
              <div>
                <span className="font-medium">{overlap.tenant_name}</span>
                <span className="text-slate-600 ml-2">
                  {format(new Date(overlap.start_date), 'dd.MM.yy', { locale: de })} - 
                  {overlap.end_date ? format(new Date(overlap.end_date), 'dd.MM.yy', { locale: de }) : 'unbefristet'}
                </span>
                {overlap.status === 'active' && (
                  <span className="ml-2 text-green-600 font-medium">Aktiv</span>
                )}
              </div>
              <a href={createPageUrl('ContractDetail') + '?id=' + overlap.id} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Ansehen
                </Button>
              </a>
            </div>
          ))}
        </div>
        <p className="text-xs text-red-700">
          Eine Einheit kann nicht gleichzeitig an mehrere Mieter vermietet sein. Bitte vorhandenen Vertrag beenden.
        </p>
      </AlertDescription>
    </Alert>
  );
}