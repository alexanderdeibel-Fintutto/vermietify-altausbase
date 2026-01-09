import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageSquare, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function TaxAdvisorPortal() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteRole, setInviteRole] = useState('tax_advisor');
  const [isInviting, setIsInviting] = useState(false);

  const queryClient = useQueryClient();

  // Fetch shared portfolios with tax advisors
  const { data: shares = [] } = useQuery({
    queryKey: ['advisorShares'],
    queryFn: async () => {
      return await base44.entities.PortfolioShare.filter({
        advisor_role: 'tax_advisor'
      }, '-shared_at') || [];
    }
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.users.inviteUser(inviteEmail, inviteRole === 'tax_advisor' ? 'user' : 'user');
      // Also create a share record
      await base44.entities.PortfolioShare.create({
        portfolio_id: 'all',
        shared_by_user_id: await base44.auth.me().then(u => u.id),
        shared_with_email: inviteEmail,
        permission_level: 'comment',
        share_type: 'advisor',
        advisor_role: inviteRole,
        shared_at: new Date().toISOString()
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisorShares'] });
      setInviteEmail('');
      setInviteMessage('');
      setIsInviting(false);
    }
  });

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsInviting(true);
    inviteMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">👨‍💼 Tax Advisor Portal</h1>
        <p className="text-slate-500 mt-1">Collaborieren Sie mit Ihren Steuerberatern und Finanzfachleuten</p>
      </div>

      <Tabs defaultValue="advisors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="advisors">
            <Users className="w-4 h-4 mr-2" /> Berater
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <FileText className="w-4 h-4 mr-2" /> Einladungen
          </TabsTrigger>
          <TabsTrigger value="collaboration">
            <MessageSquare className="w-4 h-4 mr-2" /> Zusammenarbeit
          </TabsTrigger>
        </TabsList>

        {/* Advisors Tab */}
        <TabsContent value="advisors" className="space-y-4 mt-4">
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">➕ Neuen Berater einladen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">E-Mail des Beraters</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="berater@example.com"
                  className="mt-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Berater-Typ</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg"
                >
                  <option value="tax_advisor">Steuerberater</option>
                  <option value="financial_advisor">Finanzberater</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Nachricht (optional)</label>
                <Textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Hinterlassen Sie eine Nachricht für den Berater..."
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleInvite}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isInviting || !inviteEmail}
              >
                {isInviting ? '⏳ Sende Einladung...' : '📧 Einladung senden'}
              </Button>
            </CardContent>
          </Card>

          {/* Advisor List */}
          <div className="space-y-3">
            {shares.length === 0 ? (
              <Card className="text-center py-8 text-slate-500">
                Keine Berater eingeladen. Laden Sie einen Berater ein, um zu beginnen.
              </Card>
            ) : (
              shares.map(share => (
                <Card key={share.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{share.shared_with_email}</p>
                        <p className="text-sm text-slate-600 mt-1">
                          {share.advisor_role === 'tax_advisor' ? '👨‍⚖️ Steuerberater' : '💼 Finanzberater'}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          Zugriff seit {new Date(share.shared_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{share.permission_level === 'comment' ? '💬 Kommentieren' : share.permission_level === 'edit' ? '✏️ Bearbeiten' : '👁️ Ansehen'}</Badge>
                        {share.access_count > 0 && (
                          <Badge variant="outline">{share.access_count} Zugriffe</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">📨 Ausstehende Einladungen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shares
                  .filter(s => !s.last_accessed)
                  .map(share => (
                    <Card key={share.id} className="border-yellow-300 bg-yellow-50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold">{share.shared_with_email}</p>
                            <p className="text-sm text-slate-600 mt-1">Einladung ausstehend</p>
                            <p className="text-xs text-slate-500 mt-2">
                              Gesendet am {new Date(share.shared_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              {shares.filter(s => !s.last_accessed).length === 0 && (
                <p className="text-center text-slate-500 py-4">Alle Einladungen wurden angenommen</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">🤝 Aktive Zusammenarbeit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {shares
                .filter(s => s.last_accessed)
                .map(share => (
                  <Card key={share.id} className="border-green-300 bg-green-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <p className="font-semibold">{share.shared_with_email}</p>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Letzter Zugriff: {new Date(share.last_accessed).toLocaleDateString('de-DE')}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Insgesamt {share.access_count} Zugriffe
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Nachricht senden
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </CardContent>
          </Card>

          {/* Collaboration Tips */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">💡 Tipps zur Zusammenarbeit</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-slate-700">
              <p>✓ Teilen Sie Ihre Steuererklärungen mit Ihrem Berater für eine optimale Beratung</p>
              <p>✓ Nutzen Sie Kommentare für schnelle Fragen und Anmerkungen</p>
              <p>✓ Halten Sie alle wichtigen Dokumente aktuell</p>
              <p>✓ Regelmäßige Besprechungen verbessern das Ergebnis</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}