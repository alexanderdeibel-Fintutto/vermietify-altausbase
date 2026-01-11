import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentLockManager({ documentId, companyId }) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(30);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: lockStatus } = useQuery({
    queryKey: ['lock-status', documentId],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageDocumentLock', {
        action: 'check',
        document_id: documentId
      });
      return result.data;
    },
    refetchInterval: 10000 // Check every 10s
  });

  const lockMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageDocumentLock', {
        action: 'lock',
        document_id: documentId,
        company_id: companyId,
        reason,
        duration_minutes: duration
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lock-status'] });
      setReason('');
    }
  });

  const unlockMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageDocumentLock', {
        action: 'unlock',
        document_id: documentId
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lock-status'] })
  });

  const isLocked = lockStatus?.is_locked;
  const lock = lockStatus?.lock;
  const canUnlock = lock?.locked_by === user?.email || user?.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          {isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
          Dokument-Sperre
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLocked ? (
          <div className="space-y-3">
            <div className="bg-red-50 p-3 rounded">
              <p className="text-sm font-medium text-red-900">Gesperrt</p>
              <p className="text-xs text-red-700 mt-1">Von: {lock.locked_by}</p>
              <p className="text-xs text-red-700">Grund: {lock.reason}</p>
              <p className="text-xs text-red-700">
                Läuft ab: {format(new Date(lock.expires_at), 'dd.MM.yyyy HH:mm')}
              </p>
            </div>
            {canUnlock && (
              <Button
                onClick={() => unlockMutation.mutate()}
                disabled={unlockMutation.isPending}
                variant="destructive"
                className="w-full gap-2"
              >
                <Unlock className="w-3 h-3" />
                Entsperren
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Grund für Sperre"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex-1 p-2 border rounded text-sm"
              >
                <option value={15}>15 Minuten</option>
                <option value={30}>30 Minuten</option>
                <option value={60}>1 Stunde</option>
                <option value={240}>4 Stunden</option>
              </select>
            </div>
            <Button
              onClick={() => lockMutation.mutate()}
              disabled={lockMutation.isPending}
              className="w-full gap-2"
            >
              <Lock className="w-3 h-3" />
              Sperren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}