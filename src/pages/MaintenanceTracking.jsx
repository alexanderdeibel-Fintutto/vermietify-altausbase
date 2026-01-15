import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Clock, CheckCircle2, Wrench } from 'lucide-react';

export default function MaintenanceTracking() {
  const [filter, setFilter] = useState('all');

  const { data: maintenance = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceRequest.list()
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const filteredMaintenance = filter === 'all'
    ? maintenance
    : maintenance.filter(m => {
        if (filter === 'open') return !['COMPLETED', 'CLOSED'].includes(m.status);
        return m.status === filter;
      });

  const stats = {
    total: maintenance.length,
    open: maintenance.filter(m => !['COMPLETED', 'CLOSED'].includes(m.status)).length,
    emergency: maintenance.filter(m => m.urgency === 'EMERGENCY' && !['COMPLETED', 'CLOSED'].includes(m.status)).length,
    completed: maintenance.filter(m => m.status === 'COMPLETED').length
  };

  const getStatusColor = (status) => {
    const colors = {
      NEW: 'bg-blue-50 border-blue-200',
      ACKNOWLEDGED: 'bg-yellow-50 border-yellow-200',
      SCHEDULED: 'bg-purple-50 border-purple-200',
      IN_PROGRESS: 'bg-orange-50 border-orange-200',
      COMPLETED: 'bg-green-50 border-green-200',
      CLOSED: 'bg-gray-50 border-gray-200'
    };
    return colors[status] || 'bg-white border-gray-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'COMPLETED' || status === 'CLOSED') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'IN_PROGRESS') return <Wrench className="w-4 h-4 text-orange-600" />;
    if (status === 'SCHEDULED') return <Clock className="w-4 h-4 text-purple-600" />;
    return <AlertCircle className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Wartungsverfolgung</h1>
          <p className="text-slate-600 mt-2">Überwachen Sie alle Instandhaltungsanfragen</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-slate-600">Gesamt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-xs text-red-700">Notfälle offen</p>
              <p className="text-2xl font-bold text-red-900">{stats.emergency}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <p className="text-xs text-yellow-700">Offen</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.open}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <p className="text-xs text-green-700">Abgeschlossen</p>
              <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Alle' },
            { value: 'open', label: 'Offen' },
            { value: 'NEW', label: 'Neu' },
            { value: 'IN_PROGRESS', label: 'In Bearbeitung' },
            { value: 'COMPLETED', label: 'Abgeschlossen' }
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded transition-colors ${
                filter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Maintenance List */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {filteredMaintenance.map(req => {
                const unit = units.find(u => u.id === req.unit_id);
                const lease = leases.find(l => l.id === req.lease_contract_id);
                const daysOpen = Math.floor((new Date() - new Date(req.requested_date)) / (1000 * 60 * 60 * 24));

                return (
                  <div key={req.id} className={`p-4 border rounded-lg ${getStatusColor(req.status)}`}>
                    <div className="flex items-start gap-3">
                      {getStatusIcon(req.status)}
                      <div className="flex-1">
                        <p className="font-bold">{req.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{req.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs">
                          <span>Einheit: {unit?.unit_number || 'N/A'}</span>
                          <span>Mieter: {lease?.tenant_name || 'N/A'}</span>
                          <span>Kategorie: {req.category}</span>
                          <span>Dringlichkeit: {req.urgency}</span>
                          <span>Status: {req.status}</span>
                          {daysOpen > 0 && <span className="font-medium">Offen seit: {daysOpen} Tage</span>}
                        </div>
                        {req.estimated_cost && (
                          <p className="text-xs mt-2 text-gray-600">
                            Geschätzte Kosten: €{req.estimated_cost.toFixed(2)}
                          </p>
                        )}
                        {req.actual_cost && (
                          <p className="text-xs mt-1 text-gray-600">
                            Tatsächliche Kosten: €{req.actual_cost.toFixed(2)}
                          </p>
                        )}
                      </div>
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