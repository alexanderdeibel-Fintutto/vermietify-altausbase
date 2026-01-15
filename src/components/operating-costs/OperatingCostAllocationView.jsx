import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OperatingCostAllocationView({ operatingCostItemId, item }) {
  const [loading, setLoading] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [allocated, setAllocated] = useState(false);

  const handleAllocate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('allocateOperatingCosts', {
        operatingCostItemId
      });

      setAllocations(response.data.allocations);
      setAllocated(true);
      toast.success(`${response.data.allocationsCount} Verteilungen berechnet`);
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!allocated ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-4">
              {item.cost_type} in Höhe von €{item.amount.toFixed(2)} 
              <br />
              Verteilungsschlüssel: {item.allocation_method}
            </p>
            <Button onClick={handleAllocate} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Auf Einheiten verteilen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Verteilt auf {allocations.length} Einheiten</span>
          </div>

          {allocations.map((alloc, idx) => (
            <Card key={idx} className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{alloc.tenant_email || 'Einheit'}</p>
                    <p className="text-sm text-gray-600">{alloc.allocation_basis}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">€{alloc.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{alloc.allocation_percentage.toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}