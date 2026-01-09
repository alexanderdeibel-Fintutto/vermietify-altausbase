import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, FileText, Lock, Settings } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function TenantAdministrationPanel({ tenantId, tenant, contract, locks, onBack }) {
  const queryClient = useQueryClient();
  const [selectedLock, setSelectedLock] = useState(null);

  const completeLockMutation = useMutation({
    mutationFn: (lockId) =>
      base44.entities.TenantAdministrationLock.update(lockId, { status: 'completed' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantLocks'] });
      toast.success('Aufgabe abgeschlossen');
      setSelectedLock(null);
    }
  });

  const pendingLocks = locks.filter(l => l.status === 'pending');
  const completedLocks = locks.filter(l => l.status === 'completed');

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>← Zurück</Button>

      {/* Tenant Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{tenant?.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-600">Email</p>
              <p className="font-medium text-slate-900">{tenant?.email}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Portal Status</p>
              <Badge className={tenant?.portal_enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                {tenant?.portal_enabled ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            {contract && (
              <div>
                <p className="text-xs text-slate-600">Monatliche Miete</p>
                <p className="font-medium text-slate-900">{contract.rent_amount}€</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="locks" className="w-full">
        <TabsList>
          <TabsTrigger value="locks" className="gap-2">
            <Lock className="w-4 h-4" />
            Verwaltungsaufgaben
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Dokumente
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            Einstellungen
          </TabsTrigger>
        </TabsList>

        {/* Locks Tab */}
        <TabsContent value="locks" className="space-y-4">
          {/* Pending Locks */}
          {pendingLocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Ausstehende Aufgaben ({pendingLocks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingLocks.map(lock => (
                  <div
                    key={lock.id}
                    onClick={() => setSelectedLock(lock.id)}
                    className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded cursor-pointer hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">{lock.title}</p>
                        <p className="text-sm text-slate-700 mt-1">{lock.description}</p>
                      </div>
                      <Badge className="bg-amber-200 text-amber-900 whitespace-nowrap">
                        Fällig: {new Date(lock.due_date).toLocaleDateString('de-DE')}
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          completeLockMutation.mutate(lock.id);
                        }}
                        disabled={completeLockMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Abschließen
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Locks */}
          {completedLocks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Abgeschlossene Aufgaben ({completedLocks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {completedLocks.map(lock => (
                  <div
                    key={lock.id}
                    className="p-3 border border-green-200 bg-green-50 rounded opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 line-through">{lock.title}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          Abgeschlossen: {new Date(lock.completed_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {locks.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-slate-600">
                Keine Verwaltungsaufgaben
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Dokumentenverwaltung wird implementiert</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Einstellungen werden implementiert</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}