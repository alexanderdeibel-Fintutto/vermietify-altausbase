import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, MessageSquare, Share2 } from 'lucide-react';

export default function TaxAdvisorPortalPage() {
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const { data: advisors = [], isLoading } = useQuery({
    queryKey: ['taxAdvisors'],
    queryFn: async () => {
      try {
        // Fetch user data to get advisors list
        const user = await base44.auth.me();
        return user.tax_advisors || [];
      } catch {
        return [];
      }
    }
  });

  const handleInviteAdvisor = async () => {
    if (!advisorEmail) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(advisorEmail, 'user');
      setAdvisorEmail('');
      alert('Steuerberater eingeladen');
    } catch (error) {
      alert('Einladung fehlgeschlagen');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">👨‍💼 Steuerberater Portal</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie Ihre Steuerberater und teilen Sie Dokumente</p>
      </div>

      {/* Invite Advisor */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Steuerberater einladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Steuerberater E-Mail"
              value={advisorEmail}
              onChange={(e) => setAdvisorEmail(e.target.value)}
              disabled={inviting}
            />
            <Button
              onClick={handleInviteAdvisor}
              disabled={inviting || !advisorEmail}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Einladen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advisors List */}
      {advisors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Meine Steuerberater
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {advisors.map((advisor, i) => (
              <div key={i} className="border rounded-lg p-3 bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{advisor.name}</p>
                    <p className="text-xs text-slate-600">{advisor.email}</p>
                  </div>
                  <Badge>Aktiv</Badge>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Dokumente
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Nachricht
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Shared Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Geteilte Dokumente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 text-center py-4">Keine geteilten Dokumente vorhanden</p>
        </CardContent>
      </Card>
    </div>
  );
}