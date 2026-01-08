import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Mail, Clock, CheckCircle, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TesterInvitationManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    invited_email: '',
    invitation_type: 'individual',
    welcome_message: ''
  });

  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ['tester-invitations'],
    queryFn: () => base44.asServiceRole.entities.TesterInvitation.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return base44.asServiceRole.entities.TesterInvitation.create({
        invitation_token: token,
        invited_by: user.id,
        invited_email: data.invited_email,
        invitation_type: data.invitation_type,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        welcome_message: data.welcome_message
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-invitations'] });
      toast.success('Einladung verschickt!');
      setDialogOpen(false);
      setFormData({ invited_email: '', invitation_type: 'individual', welcome_message: '' });
    }
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.TesterInvitation.update(id, { status: 'revoked' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-invitations'] });
      toast.success('Einladung widerrufen');
    }
  });

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/TesterOnboarding?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopiert!');
  };

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Ausstehend' },
    accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Akzeptiert' },
    expired: { color: 'bg-slate-100 text-slate-800', icon: XCircle, label: 'Abgelaufen' },
    revoked: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Widerrufen' }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tester-Einladungen</h3>
          <p className="text-sm text-slate-600">Verwalten Sie Einladungen für neue Tester</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Tester einladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Tester einladen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>E-Mail-Adresse *</Label>
                <Input
                  type="email"
                  value={formData.invited_email}
                  onChange={(e) => setFormData({ ...formData, invited_email: e.target.value })}
                  placeholder="tester@example.com"
                />
              </div>
              <div>
                <Label>Willkommensnachricht</Label>
                <Textarea
                  value={formData.welcome_message}
                  onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                  placeholder="Optionale persönliche Nachricht..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.invited_email || createMutation.isPending}
                className="w-full"
              >
                Einladung versenden
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {invitations.map(invitation => {
          const status = statusConfig[invitation.status];
          const StatusIcon = status.icon;

          return (
            <Card key={invitation.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{invitation.invited_email}</div>
                      <div className="text-sm text-slate-600">
                        Eingeladen am {format(new Date(invitation.created_date), 'dd.MM.yyyy', { locale: de })}
                      </div>
                      {invitation.used_at && (
                        <div className="text-sm text-green-600">
                          Akzeptiert am {format(new Date(invitation.used_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      )}
                    </div>
                    <Badge className={status.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.invitation_token)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeMutation.mutate(invitation.id)}
                        >
                          Widerrufen
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}