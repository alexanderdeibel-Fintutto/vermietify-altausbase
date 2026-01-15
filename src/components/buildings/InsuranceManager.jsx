import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function InsuranceManager({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    policy_type: 'LIABILITY',
    insurance_company: '',
    policy_number: '',
    coverage_amount: '',
    annual_premium: '',
    start_date: '',
    deductible: ''
  });

  const { data: policies = [], refetch } = useQuery({
    queryKey: ['insurancePolicies', buildingId],
    queryFn: async () => {
      const all = await base44.entities.InsurancePolicy.list();
      return all.filter(p => p.building_id === buildingId);
    }
  });

  const handleAddPolicy = async (e) => {
    e.preventDefault();
    try {
      await base44.entities.InsurancePolicy.create({
        building_id: buildingId,
        ...formData,
        coverage_amount: parseFloat(formData.coverage_amount),
        annual_premium: parseFloat(formData.annual_premium),
        deductible: parseFloat(formData.deductible || 0),
        status: 'ACTIVE'
      });
      
      setShowForm(false);
      setFormData({
        policy_type: 'LIABILITY',
        insurance_company: '',
        policy_number: '',
        coverage_amount: '',
        annual_premium: '',
        start_date: '',
        deductible: ''
      });
      refetch();
    } catch (error) {
      console.error('Error adding policy:', error);
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'ACTIVE') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'RENEWAL_PENDING') return <Clock className="w-4 h-4 text-yellow-600" />;
    return <AlertCircle className="w-4 h-4 text-red-600" />;
  };

  const getDaysToRenewal = (renewalDate) => {
    const days = Math.floor((new Date(renewalDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} Tage` : 'Überfällig';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Versicherungen</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? 'Abbrechen' : '+ Versicherung'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <form onSubmit={handleAddPolicy} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium">Versicherungstyp</label>
                  <select
                    value={formData.policy_type}
                    onChange={(e) => setFormData({...formData, policy_type: e.target.value})}
                    className="w-full border rounded px-2 py-1 text-sm"
                  >
                    <option value="LIABILITY">Haftung</option>
                    <option value="PROPERTY">Gebäude</option>
                    <option value="FIRE">Brand</option>
                    <option value="LANDLORD">Vermieter</option>
                    <option value="LOSS_OF_RENT">Mietausfallschutz</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Versicherungsgesellschaft</label>
                  <Input
                    value={formData.insurance_company}
                    onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
                    placeholder="z.B. Allianz"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Versicherungsnummer"
                  value={formData.policy_number}
                  onChange={(e) => setFormData({...formData, policy_number: e.target.value})}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Deckungssumme (EUR)"
                  value={formData.coverage_amount}
                  onChange={(e) => setFormData({...formData, coverage_amount: e.target.value})}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Jahresprämie (EUR)"
                  value={formData.annual_premium}
                  onChange={(e) => setFormData({...formData, annual_premium: e.target.value})}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="Selbstbeteiligung"
                  value={formData.deductible}
                  onChange={(e) => setFormData({...formData, deductible: e.target.value})}
                  className="text-sm"
                />
              </div>

              <Button type="submit" size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                Hinzufügen
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {policies.length > 0 ? (
          policies.map(policy => (
            <Card key={policy.id}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {getStatusIcon(policy.status)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{policy.policy_type}</p>
                    <p className="text-xs text-gray-600">{policy.insurance_company} • {policy.policy_number}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">€{policy.coverage_amount?.toFixed(0) || 0}</p>
                    <p className="text-xs text-gray-600">
                      {policy.renewal_date ? getDaysToRenewal(policy.renewal_date) : 'Keine Erneuerung'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-sm text-gray-600">
              Keine Versicherungen eingetragen
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}