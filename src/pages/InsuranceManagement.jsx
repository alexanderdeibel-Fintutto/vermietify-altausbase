import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus, FileText, AlertTriangle } from 'lucide-react';

export default function InsuranceManagementPage() {
  const policies = [
    { id: 1, type: 'Gebäudeversicherung', provider: 'Allianz', premium: '€2.450/Jahr', expiresAt: '31.12.2026', coverage: '€850.000', status: 'active' },
    { id: 2, type: 'Haftpflicht', provider: 'AXA', premium: '€980/Jahr', expiresAt: '15.06.2026', coverage: '€500.000', status: 'active' },
    { id: 3, type: 'Rechtsschutz', provider: 'ERGO', premium: '€420/Jahr', expiresAt: '30.04.2026', coverage: 'Unbegrenzt', status: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extralight text-slate-700 tracking-wide">Versicherungsverwaltung</h1>
          <p className="text-sm font-extralight text-slate-400 mt-1">Verwaltung aller Versicherungspolicen</p>
        </div>
        <Button className="bg-slate-700 hover:bg-slate-800 font-extralight"><Plus className="w-4 h-4 mr-2" />Neue Police</Button>
      </div>

      <div className="space-y-3">
        {policies.map((policy) => (
          <Card key={policy.id} className={`border ${policy.status === 'active' ? 'border-slate-200' : 'border-orange-200 bg-orange-50'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{policy.type}</h3>
                    <Badge className={policy.status === 'active' ? 'bg-green-600' : 'bg-orange-600'}>
                      {policy.status === 'active' ? '✓ Aktiv' : '⚠ Warnung'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-slate-600 ml-8">
                    <div><span className="font-semibold">{policy.provider}</span> • {policy.premium}</div>
                    <div>Deckung: <span className="font-semibold">{policy.coverage}</span></div>
                    <div>Läuft ab: <span className="font-semibold">{policy.expiresAt}</span></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"><FileText className="w-4 h-4" /> Dokument</Button>
                  <Button size="sm" variant="ghost">Bearbeiten</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-orange-200 bg-orange-50">
        <CardContent className="pt-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-900">Eine Police läuft bald ab</p>
            <p className="text-xs text-orange-800">Rechtsschutz (ERGO) läuft am 30.04.2026 aus. Bitte erneuern Sie die Police rechtzeitig.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}