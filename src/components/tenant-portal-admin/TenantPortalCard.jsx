import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';

export default function TenantPortalCard({ tenant, contract, pendingLocks, onSelect }) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{tenant.full_name}</h3>
              <p className="text-xs text-slate-600 mt-1">{tenant.email}</p>
            </div>
            <Badge
              className={
                tenant.portal_enabled
                  ? 'bg-green-100 text-green-800'
                  : 'bg-slate-100 text-slate-800'
              }
            >
              {tenant.portal_enabled ? '✓ Aktiv' : 'Inaktiv'}
            </Badge>
          </div>

          {/* Contract Info */}
          {contract && (
            <div className="p-2 bg-slate-50 rounded text-xs">
              <p className="font-medium text-slate-900">
                {contract.property_address || 'Mietvertrag'}
              </p>
              <p className="text-slate-600 mt-1">
                Miete: <span className="font-semibold">{contract.rent_amount}€/Monat</span>
              </p>
            </div>
          )}

          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            {pendingLocks > 0 && (
              <Badge className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {pendingLocks} ausstehend
              </Badge>
            )}
            {pendingLocks === 0 && contract && (
              <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Bereit
              </Badge>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs gap-1">
              <Mail className="w-3 h-3" />
              Nachricht
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs gap-1">
              <Lock className="w-3 h-3" />
              Locks
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}