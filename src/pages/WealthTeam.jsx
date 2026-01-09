import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useParams } from 'react-router-dom';
import PortfolioSharingDialog from '@/components/wealth/PortfolioSharingDialog';
import TeamActivityFeed from '@/components/wealth/TeamActivityFeed';
import { Share2, Users } from 'lucide-react';

export default function WealthTeamPage() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const { portfolioId } = useParams();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return null;
      const result = await base44.entities.AssetPortfolio.filter({ id: portfolioId });
      return result?.[0];
    },
    enabled: !!portfolioId
  });

  const { data: shares = [] } = useQuery({
    queryKey: ['shares', portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      return await base44.entities.PortfolioShare.filter({ portfolio_id: portfolioId }) || [];
    },
    enabled: !!portfolioId
  });

  if (!user) return <div className="p-6">Bitte melden Sie sich an.</div>;
  if (!portfolio) return <div className="p-6">Portfolio nicht gefunden.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Team & Zusammenarbeit</h1>
          <p className="text-slate-600 mt-2">{portfolio.name}</p>
        </div>
        <Button onClick={() => setShareDialogOpen(true)} className="gap-2">
          <Share2 className="w-4 h-4" />
          Portfolio teilen
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-400" />
              <p className="text-xs text-slate-600">Freigegebene Nutzer</p>
            </div>
            <p className="text-3xl font-bold">{shares.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Freigegebene Nutzer</CardTitle>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <p className="text-sm text-slate-500">Portfolio noch nicht geteilt</p>
          ) : (
            <div className="space-y-2">
              {shares.map(share => (
                <div key={share.id} className="flex items-center justify-between p-3 bg-slate-50 rounded text-sm">
                  <div>
                    <div className="font-medium">{share.shared_with_email}</div>
                    <div className="text-xs text-slate-500 capitalize">{share.permission_level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TeamActivityFeed portfolioId={portfolioId} sharedUsers={shares.map(s => s.shared_with_email)} />

      <PortfolioSharingDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} portfolioId={portfolioId} />
    </div>
  );
}