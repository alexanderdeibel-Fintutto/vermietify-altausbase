import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Share2, MessageSquare } from 'lucide-react';

export default function TaxAdvisorCollaborationHub() {
  const [advisorEmail, setAdvisorEmail] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const [sharing, setSharing] = useState(false);

  const { data: shares = [] } = useQuery({
    queryKey: ['taxShares'],
    queryFn: async () => {
      const response = await base44.entities.PortfolioShare.filter({ share_type: 'advisor' });
      return response || [];
    }
  });

  const handleShareWithAdvisor = async () => {
    if (!advisorEmail) return;
    setSharing(true);
    await base44.functions.invoke('shareWithTaxAdvisor', {
      advisor_email: advisorEmail,
      tax_year: taxYear,
      country: 'DE',
      data_types: ['comprehensive', 'compliance']
    });
    setAdvisorEmail('');
    setSharing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">👥 Steuerberater-Collaboration</h1>
        <p className="text-slate-500 mt-1">Teilen Sie Daten und arbeiten Sie mit Steuerfachleuten zusammen</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Mit Steuerberater teilen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="email"
              placeholder="advisor@example.com"
              value={advisorEmail}
              onChange={(e) => setAdvisorEmail(e.target.value)}
              disabled={sharing}
            />
            <Input
              type="number"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              disabled={sharing}
            />
            <Button
              onClick={handleShareWithAdvisor}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              disabled={sharing || !advisorEmail}
            >
              <Share2 className="w-4 h-4" />
              Teilen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Gemeinsame Zugriffe
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <p className="text-sm text-slate-500">Noch keine Steuerberater hinzugefügt</p>
          ) : (
            <div className="space-y-2">
              {shares.map(share => (
                <div key={share.id} className="p-3 bg-slate-50 rounded flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{share.shared_with_email}</p>
                    <p className="text-xs text-slate-600">Rolle: {share.advisor_role}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Nachricht
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}