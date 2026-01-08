import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Mail, Clock, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TesterInvitationManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    invited_email: '',
    invitation_type: 'individual',
    welcome_message: '',
    assigned_projects: []
  });

  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ['tester-invitations'],
    queryFn: () => base44.entities.TesterInvitation.list('-created_date')
  });

  const createInvitationMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      const token = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      return base44.entities.TesterInvitation.create({
        ...data,
        invitation_token: token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tester-invitations'] });
      toast.success('Einladung erfolgreich erstellt! 📧');
      setShowDialog(false);
      setFormData({
        invited_email: '',
        invitation_type: 'individual',
        welcome_message: '',
        assigned_projects: []
      });
    }
  });

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/tester-signup?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopiert! 📋');
  };

  const getStatusBadge = (invitation) => {
    const statusConfig = {
      pending: { label: 'Ausstehend', color: 'bg-yellow-500' },
      accepted: { label: 'Angenommen', color: 'bg-green-500' },
      expired: { label: 'Abgelaufen', color: 'bg-slate-500' },
      revoked: { label: 'Widerrufen', color: 'bg-red-500' }
    };
    const config = statusConfig[invitation.status] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'accepted': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'expired': return <Clock className="w-5 h-5 text-slate-600" />;
      case 'revoked': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Mail className="w-5 h-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Tester-Einladungen</h2>
          <p className="text-sm text-slate-600">Neue Tester einladen und verwalten</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Tester einladen
        </Button>
      </div>

      <div className="grid gap-4">
        {invitations.map((invitation, idx) => (
          <motion.div
            key={invitation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getStatusIcon(invitation.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{invitation.invited_email}</span>
                        {getStatusBadge(invitation)}
                      </div>
                      <div className="text-sm text-slate-600">
                        Eingeladen am: {new Date(invitation.created_date).toLocaleDateString('de-DE')}
                      </div>
                      {invitation.welcome_message && (
                        <p className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                          {invitation.welcome_message}
                        </p>
                      )}
                    </div>
                  </div>
                  {invitation.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteLink(invitation.invitation_token)}
                      className="gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Link kopieren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tester einladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Email-Adresse *</Label>
              <Input
                type="email"
                value={formData.invited_email}
                onChange={(e) => setFormData(prev => ({ ...prev, invited_email: e.target.value }))}
                placeholder="tester@example.com"
              />
            </div>

            <div>
              <Label>Einladungstyp</Label>
              <Select 
                value={formData.invitation_type} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, invitation_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">👤 Einzelperson</SelectItem>
                  <SelectItem value="team">👥 Team-Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Persönliche Nachricht (optional)</Label>
              <Textarea
                value={formData.welcome_message}
                onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                placeholder="Willkommen im Testing-Team! Wir freuen uns auf deine Hilfe..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createInvitationMutation.mutate(formData)}
                disabled={!formData.invited_email || createInvitationMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Einladung senden
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}