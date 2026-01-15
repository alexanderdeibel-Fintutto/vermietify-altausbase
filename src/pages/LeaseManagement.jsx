import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function LeaseManagement() {
  const [selectedStatus, setSelectedStatus] = useState('active');

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const now = new Date();
  const filtered = selectedStatus === 'active'
    ? leases.filter(l => new Date(l.end_date || new Date(9999, 0, 1)) > now)
    : selectedStatus === 'expiring'
    ? leases.filter(l => {
        const end = new Date(l.end_date);
        const daysDiff = (end - now) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 90;
      })
    : leases.filter(l => new Date(l.end_date || new Date(9999, 0, 1)) <= now);

  const getStatusIcon = (lease) => {
    const daysDiff = (new Date(lease.end_date || new Date(9999, 0, 1)) - now) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 0) return <AlertCircle className="w-4 h-4 text-red-600" />;
    if (daysDiff <= 90) return <Clock className="w-4 h-4 text-yellow-600" />;
    return <CheckCircle2 className="w-4 h-4 text-green-600" />;
  };

  const getDaysRemaining = (lease) => {
    const days = Math.floor((new Date(lease.end_date || new Date(9999, 0, 1)) - now) / (1000 * 60 * 60 * 24));
    if (days < 0) return `Abgelaufen vor ${Math.abs(days)} Tagen`;
    if (days === 0) return 'Läuft heute ab';
    return `${days} Tage verbleibend`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Mietverwaltung</h1>
          <p className="text-slate-600 mt-2">Übersicht aller Mietverträge</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-slate-600">Aktive Verträge</p>
              <p className="text-2xl font-bold">
                {leases.filter(l => new Date(l.end_date || new Date(9999, 0, 1)) > now).length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-xs text-yellow-700">In den nächsten 90 Tagen auslaufend</p>
              <p className="text-2xl font-bold text-yellow-900">
                {leases.filter(l => {
                  const days = (new Date(l.end_date || new Date(9999, 0, 1)) - now) / (1000 * 60 * 60 * 24);
                  return days > 0 && days <= 90;
                }).length}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-xs text-red-700">Abgelaufene Verträge</p>
              <p className="text-2xl font-bold text-red-900">
                {leases.filter(l => new Date(l.end_date || new Date(9999, 0, 1)) <= now).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { value: 'active', label: 'Aktiv' },
            { value: 'expiring', label: 'Auslaufend' },
            { value: 'expired', label: 'Abgelaufen' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-4 py-2 rounded transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Lease List */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {filtered.map(lease => {
                const unit = units.find(u => u.id === lease.unit_id);
                const building = buildings.find(b => b.id === unit?.building_id);

                return (
                  <div key={lease.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(lease)}
                      <div className="flex-1">
                        <p className="font-bold">{lease.tenant_name}</p>
                        <p className="text-sm text-gray-600">
                          {building?.name} • Einheit {unit?.unit_number}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">€{lease.monthly_rent.toFixed(2)}/Monat</p>
                        <p className="text-xs text-gray-600">{getDaysRemaining(lease)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                      <span>Start: {new Date(lease.start_date).toLocaleDateString('de-DE')}</span>
                      {lease.end_date && (
                        <span>Ende: {new Date(lease.end_date).toLocaleDateString('de-DE')}</span>
                      )}
                      {lease.security_deposit && (
                        <span>Kaution: €{lease.security_deposit.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                      {selectedStatus === 'expiring' && (
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Verlängerung initiieren
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}