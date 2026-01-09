import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Mail, TestTube, Clock, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TesterManagementPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: invitations = [] } = useQuery({
    queryKey: ['testerInvitations'],
    queryFn: () => base44.entities.TesterInvitation.list()
  });

  const { data: testAccounts = [] } = useQuery({
    queryKey: ['testAccounts'],
    queryFn: () => base44.entities.TestAccount.list()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['testAssignments'],
    queryFn: () => base44.entities.TestAssignment.list()
  });

  const inviteMutation = useMutation({
    mutationFn: async (email) => {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const user = await base44.auth.me();
      
      return base44.entities.TesterInvitation.create({
        invitation_token: token,
        invited_by: user.id,
        invited_email: email,
        invitation_type: 'individual',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        welcome_message: 'Willkommen zum Beta-Testing unserer Immobilienverwaltungs-App!'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['testerInvitations']);
      setInviteEmail('');
      setShowInviteDialog(false);
      toast.success('Einladung verschickt!');
    }
  });

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/tester-onboarding?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Link kopiert!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🧪 Tester-Verwaltung</h1>
          <p className="text-slate-600 mt-1">Verwalte dein Beta-Testing Team</p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="w-4 h-4 mr-2" />Tester einladen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Tester einladen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email-Adresse</label>
                <Input 
                  type="email"
                  placeholder="tester@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => inviteMutation.mutate(inviteEmail)}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? 'Wird gesendet...' : 'Einladung senden'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <TestTube className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Aktive Tester</p>
            <p className="text-2xl font-bold text-slate-900">{testAccounts.length}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <Mail className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Einladungen</p>
            <p className="text-2xl font-bold text-slate-900">{invitations.filter(i => i.status === 'pending').length}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Laufende Tests</p>
            <p className="text-2xl font-bold text-slate-900">{assignments.filter(a => a.status === 'in_progress').length}</p>
          </CardContent>
        </Card>
        <Card className="border border-slate-200">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Abgeschlossen</p>
            <p className="text-2xl font-bold text-slate-900">{assignments.filter(a => a.status === 'testing_complete').length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invitations">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invitations">Einladungen</TabsTrigger>
          <TabsTrigger value="accounts">Test-Accounts</TabsTrigger>
          <TabsTrigger value="assignments">Aufgaben</TabsTrigger>
        </TabsList>

        <TabsContent value="invitations" className="space-y-3">
          {invitations.map((invite) => (
            <Card key={invite.id} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{invite.invited_email}</p>
                  <p className="text-xs text-slate-600">Eingeladen am {new Date(invite.created_date).toLocaleDateString('de-DE')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={
                    invite.status === 'pending' ? 'bg-orange-600' :
                    invite.status === 'accepted' ? 'bg-green-600' :
                    'bg-slate-600'
                  }>
                    {invite.status}
                  </Badge>
                  {invite.status === 'pending' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyInviteLink(invite.invitation_token)}
                    >
                      <Copy className="w-3 h-3 mr-1" />Link
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-3">
          {testAccounts.map((account) => (
            <Card key={account.id} className="border border-slate-200">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{account.account_name}</p>
                  <p className="text-xs text-slate-600">{account.test_email} • {account.simulated_role}</p>
                </div>
                <Badge className={account.is_active ? 'bg-green-600' : 'bg-slate-600'}>
                  {account.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="border border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{assignment.title}</h3>
                  <Badge className={
                    assignment.status === 'assigned' ? 'bg-blue-600' :
                    assignment.status === 'in_progress' ? 'bg-purple-600' :
                    assignment.status === 'testing_complete' ? 'bg-green-600' :
                    'bg-slate-600'
                  }>
                    {assignment.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{assignment.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Priorität: {assignment.priority}</span>
                  <span>Typ: {assignment.test_type}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}