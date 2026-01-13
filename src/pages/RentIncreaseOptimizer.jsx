import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RentIncreaseOptimizer() {
  const queryClient = useQueryClient();
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const { data: proposals = [] } = useQuery({
    queryKey: ['rent-increases'],
    queryFn: () => base44.entities.RentIncreaseProposal.list('-created_date', 50)
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const sendProposalMutation = useMutation({
    mutationFn: async (proposalId) => {
      return await base44.entities.RentIncreaseProposal.update(proposalId, { 
        status: 'sent',
        proposed_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rent-increases'] });
      toast.success('Mieterhöhung versendet');
    }
  });

  const draftProposals = proposals.filter(p => p.status === 'draft');
  const sentProposals = proposals.filter(p => p.status === 'sent');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <TrendingUp className="w-8 h-8" />
          Mieterhöhungs-Engine
        </h1>
        <p className="text-slate-600 mt-1">Rechtssichere & marktorientierte Mieterhöhungen automatisieren</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{draftProposals.length}</div>
            <p className="text-sm text-slate-600">Entwürfe</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{sentProposals.length}</div>
            <p className="text-sm text-slate-600">Versendet</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600">
              +€{proposals.reduce((sum, p) => sum + (p.proposed_rent - p.current_rent) * 12, 0).toLocaleString()}
            </div>
            <p className="text-sm text-slate-600">Jahresrendite</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entwürfe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {draftProposals.map(proposal => (
              <div key={proposal.id} className="border rounded p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">Einheit {proposal.unit_id}</p>
                    <p className="text-sm text-slate-600">
                      €{proposal.current_rent} → €{proposal.proposed_rent}
                      <Badge className="ml-2 bg-blue-100 text-blue-800">
                        +{proposal.increase_percentage}%
                      </Badge>
                    </p>
                  </div>
                  <Button 
                    onClick={() => sendProposalMutation.mutate(proposal.id)}
                    size="sm"
                  >
                    Versenden
                  </Button>
                </div>
                {proposal.ai_recommendation && (
                  <div className="text-xs text-slate-600 flex gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5" />
                    {proposal.ai_recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}