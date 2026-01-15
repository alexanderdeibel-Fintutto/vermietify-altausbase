import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RentIncreaseProposalManager({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [generatingLetter, setGeneratingLetter] = useState(null);
  const [formData, setFormData] = useState({
    lease_id: '',
    proposed_rent: '',
    effective_date: '',
    justification: 'INDEX',
    notice_period_months: 3,
    market_comparable_price: ''
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: proposals = [], refetch } = useQuery({
    queryKey: ['rentIncreaseProposals', buildingId],
    queryFn: async () => {
      const all = await base44.entities.RentIncreaseProposal.list();
      return all.filter(p => p.building_id === buildingId).sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    }
  });

  const buildingLeases = leases.filter(l => {
    const prop = proposals.find(p => p.lease_contract_id === l.id);
    return !prop || prop.status !== 'IMPLEMENTED';
  });

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    const lease = leases.find(l => l.id === formData.lease_id);
    if (!lease) {
      toast.error('Mietvertrag wählen');
      return;
    }

    try {
      const proposedRent = parseFloat(formData.proposed_rent);
      await base44.entities.RentIncreaseProposal.create({
        lease_contract_id: formData.lease_id,
        unit_id: lease.unit_id,
        building_id: buildingId,
        tenant_name: lease.tenant_name,
        current_rent: lease.monthly_rent,
        proposed_rent: proposedRent,
        increase_amount: proposedRent - lease.monthly_rent,
        increase_percentage: ((proposedRent - lease.monthly_rent) / lease.monthly_rent * 100),
        effective_date: formData.effective_date,
        notice_period_months: parseInt(formData.notice_period_months),
        justification: formData.justification,
        market_comparable_price: formData.market_comparable_price ? parseFloat(formData.market_comparable_price) : null,
        status: 'DRAFT'
      });

      toast.success('Erhöhungsantrag erstellt');
      setShowForm(false);
      setFormData({
        lease_id: '',
        proposed_rent: '',
        effective_date: '',
        justification: 'INDEX',
        notice_period_months: 3,
        market_comparable_price: ''
      });
      refetch();
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleGenerateLetter = async (proposalId) => {
    setGeneratingLetter(proposalId);
    try {
      const response = await base44.functions.invoke('generateRentIncreaseNotice', {
        proposalId
      });
      const element = document.createElement('a');
      const file = new Blob([response.data.letter_html], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = `Mieterhöhung_${proposalId}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success('Brief heruntergeladen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setGeneratingLetter(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'bg-gray-50 border-gray-200',
      PROPOSED: 'bg-blue-50 border-blue-200',
      ACCEPTED: 'bg-green-50 border-green-200',
      REJECTED: 'bg-red-50 border-red-200',
      IMPLEMENTED: 'bg-green-100 border-green-300'
    };
    return colors[status] || 'bg-white border-gray-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Mieterhöhungen</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? 'Abbrechen' : '+ Antrag erstellen'}
        </Button>
      </div>

      {showForm && buildingLeases.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Mietvertrag</label>
                <select
                  value={formData.lease_id}
                  onChange={(e) => setFormData({...formData, lease_id: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                >
                  <option value="">Wählen...</option>
                  {buildingLeases.map(lease => (
                    <option key={lease.id} value={lease.id}>
                      {lease.tenant_name} - €{lease.monthly_rent.toFixed(2)}/Monat
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Neue Miete (EUR)"
                  value={formData.proposed_rent}
                  onChange={(e) => setFormData({...formData, proposed_rent: e.target.value})}
                  className="text-sm"
                  required
                />
                <Input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                  className="text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  value={formData.justification}
                  onChange={(e) => setFormData({...formData, justification: e.target.value})}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="INDEX">Mietindex</option>
                  <option value="MODERNIZATION">Modernisierung</option>
                  <option value="MARKET_ANALYSIS">Marktanalyse</option>
                  <option value="OPERATING_COSTS">Betriebskosten</option>
                </select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Vergleichspreis (optional)"
                  value={formData.market_comparable_price}
                  onChange={(e) => setFormData({...formData, market_comparable_price: e.target.value})}
                  className="text-sm"
                />
              </div>

              <Button type="submit" size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                Erstellen
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {proposals.length > 0 ? (
        <div className="space-y-2">
          {proposals.map(proposal => {
            const lease = leases.find(l => l.id === proposal.lease_contract_id);
            return (
              <Card key={proposal.id} className={`border ${getStatusColor(proposal.status)}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{proposal.tenant_name}</p>
                      <p className="text-sm text-gray-600">
                        €{proposal.current_rent.toFixed(2)} → €{proposal.proposed_rent.toFixed(2)} 
                        ({proposal.increase_percentage > 0 ? '+' : ''}{proposal.increase_percentage.toFixed(1)}%)
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Gültig ab: {new Date(proposal.effective_date).toLocaleDateString('de-DE')} | Status: {proposal.status}
                      </p>
                    </div>
                    {proposal.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handleGenerateLetter(proposal.id)}
                        disabled={generatingLetter === proposal.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {generatingLetter === proposal.id && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        <FileText className="w-3 h-3 mr-1" />
                        Brief
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-gray-600">
            Keine Erhöhungsanträge vorhanden
          </CardContent>
        </Card>
      )}
    </div>
  );
}