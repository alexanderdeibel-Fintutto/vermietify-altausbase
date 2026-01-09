import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, UserPlus, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function TenantOnboardingManager({ tenantId, tenant }) {
  const [selectedLock, setSelectedLock] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [actionType, setActionType] = useState('approve');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: locks = [] } = useQuery({
    queryKey: ['adminLocks', tenantId],
    queryFn: () => base44.entities.TenantAdministrationLock.filter({ tenant_id: tenantId }, '-created_at', 50)
  });

  const { data: admins = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.role === 'admin');
    }
  });

  const approveRejectMutation = useMutation({
    mutationFn: async ({ lockId, action, notes }) => {
      return await base44.functions.invoke('processOnboardingAction', {
        lock_id: lockId,
        action,
        notes,
        tenant_id: tenantId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocks', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['onboardingAudit', tenantId] });
      toast.success('Aktion erfolgreich verarbeitet');
      setShowApprovalDialog(false);
      setNotes('');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const assignTaskMutation = useMutation({
    mutationFn: async ({ lockId, adminEmail }) => {
      return await base44.entities.TenantAdministrationLock.update(lockId, {
        assigned_to: adminEmail,
        status: 'in_progress'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocks', tenantId] });
      toast.success('Aufgabe zugewiesen');
    }
  });

  const handleAction = (lock, type) => {
    setSelectedLock(lock);
    setActionType(type);
    setShowApprovalDialog(true);
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: { color: 'bg-amber-100 text-amber-800', icon: Clock, label: 'Ausstehend' },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Bearbeitung' },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Abgeschlossen' },
      blocked: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Blockiert' }
    };
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {variant.label}
      </Badge>
    );
  };

  const groupedLocks = locks.reduce((acc, lock) => {
    if (!acc[lock.status]) acc[lock.status] = [];
    acc[lock.status].push(lock);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900 mb-2">Ausstehend</p>
            <p className="text-3xl font-bold text-amber-700">{groupedLocks.pending?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 mb-2">In Bearbeitung</p>
            <p className="text-3xl font-bold text-blue-700">{groupedLocks.in_progress?.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-900 mb-2">Abgeschlossen</p>
            <p className="text-3xl font-bold text-green-700">{groupedLocks.completed?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding-Aufgaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locks.map(lock => (
            <div key={lock.id} className="p-4 border border-slate-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-slate-900">{lock.title}</p>
                    {getStatusBadge(lock.status)}
                    <Badge className={`${lock.priority === 'urgent' ? 'bg-red-600' : lock.priority === 'high' ? 'bg-orange-600' : 'bg-blue-600'} text-white`}>
                      {lock.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{lock.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Fällig: {new Date(lock.due_date).toLocaleDateString('de-DE')}</span>
                    {lock.assigned_to && <span>Zugewiesen: {lock.assigned_to}</span>}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {lock.status !== 'completed' && (
                  <>
                    <Select
                      value={lock.assigned_to || ''}
                      onValueChange={(adminEmail) => assignTaskMutation.mutate({ lockId: lock.id, adminEmail })}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Admin zuweisen" />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map(admin => (
                          <SelectItem key={admin.email} value={admin.email}>
                            {admin.full_name || admin.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(lock, 'approve')}
                      className="text-green-700 border-green-300 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Genehmigen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(lock, 'reject')}
                      className="text-red-700 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Ablehnen
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Aufgabe genehmigen' : 'Aufgabe ablehnen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">{selectedLock?.title}</p>
            <Textarea
              placeholder="Notizen hinzufügen..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => approveRejectMutation.mutate({
                  lockId: selectedLock?.id,
                  action: actionType,
                  notes
                })}
                disabled={approveRejectMutation.isPending}
                className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {actionType === 'approve' ? 'Genehmigen' : 'Ablehnen'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}