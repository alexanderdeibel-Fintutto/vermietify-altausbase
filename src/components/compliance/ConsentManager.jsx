import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield } from 'lucide-react';

export default function ConsentManager() {
  const { data: users = [] } = useQuery({
    queryKey: ['users-consent'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const consentStats = {
    total: users.length,
    withConsent: users.filter(u => u.gdpr_consent).length,
    withoutConsent: users.filter(u => !u.gdpr_consent).length
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Einwilligungsverwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg text-center">
            <div className="text-2xl font-bold">{consentStats.total}</div>
            <div className="text-sm text-slate-600">Gesamt</div>
          </div>
          <div className="p-4 border rounded-lg text-center bg-green-50">
            <div className="text-2xl font-bold text-green-600">{consentStats.withConsent}</div>
            <div className="text-sm text-slate-600">Mit Einwilligung</div>
          </div>
          <div className="p-4 border rounded-lg text-center bg-red-50">
            <div className="text-2xl font-bold text-red-600">{consentStats.withoutConsent}</div>
            <div className="text-sm text-slate-600">Ohne Einwilligung</div>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {users.slice(0, 10).map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {user.gdpr_consent ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <div>
                  <div className="font-medium text-sm">{user.full_name || user.email}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
              <Badge variant={user.gdpr_consent ? 'default' : 'destructive'}>
                {user.gdpr_consent ? 'Einwilligung' : 'Keine Einwilligung'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
          <strong>GDPR Art. 7:</strong> Dokumentation und Nachweispflicht der Einwilligung.
        </div>
      </CardContent>
    </Card>
  );
}