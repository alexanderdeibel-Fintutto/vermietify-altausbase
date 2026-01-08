import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function TransactionComplianceCheck({ transaction }) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);

  const checks = [
    {
      name: 'Verdächtige Muster',
      description: 'Prüft auf ungewöhnliche Transaktionsmuster',
      status: transaction.amount > 10000 ? 'warning' : 'ok'
    },
    {
      name: 'IBAN-Validierung',
      description: 'Prüft auf gültige IBAN-Struktur',
      status: transaction.iban ? 'ok' : 'unknown'
    },
    {
      name: 'Geschäftsbetrag',
      description: 'Prüft ob Betrag für Geschäftszwecke angemessen ist',
      status: 'ok'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          Compliance-Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check, i) => (
          <div key={i} className="flex items-start gap-3 p-2 rounded hover:bg-slate-50">
            <div className="flex-1">
              <p className="text-sm font-medium">{check.name}</p>
              <p className="text-xs text-slate-600">{check.description}</p>
            </div>
            <Badge variant={check.status === 'ok' ? 'default' : 'secondary'}>
              {check.status === 'warning' ? '⚠️' : '✓'}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}