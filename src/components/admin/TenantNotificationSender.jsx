import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Send, Building2, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantNotificationSender() {
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [formData, setFormData] = useState({
    type: 'announcement',
    title: '',
    message: '',
    priority: 'normal'
  });

  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => base44.entities.Tenant.list()
  });

  const { data: leases } = useQuery({
    queryKey: ['leases'],
    queryFn: () => base44.entities.LeaseContract.filter({ status: 'active' })
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendTenantNotifications', data),
    onSuccess: () => {
      toast.success('Benachrichtigungen versendet');
      setSelectedTenants([]);
      setFormData({ type: 'announcement', title: '', message: '', priority: 'normal' });
      setSelectedBuilding('');
    },
    onError: (error) => {
      toast.error('Fehler beim Versenden: ' + error.message);
    }
  });

  const filteredTenants = selectedBuilding
    ? leases
      ?.filter(lease => lease.gebaeude_id === selectedBuilding)
      .map(lease => lease.tenant_id)
      .filter(Boolean) || []
    : tenants?.map(t => t.id) || [];

  const selectedTenantObjects = tenants?.filter(t =>
    selectedTenants.includes(t.id)
  ) || [];

  const handleTenantToggle = (tenantId) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.message) {
      toast.error('Titel und Nachricht sind erforderlich');
      return;
    }

    if (selectedTenants.length === 0) {
      toast.error('Mindestens ein Mieter muss ausgewählt sein');
      return;
    }

    sendNotificationMutation.mutate({
      tenant_ids: selectedTenants,
      ...formData
    });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Benachrichtigung versenden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Typ</label>
              <Select value={formData.type} onValueChange={(value) =>
                setFormData({ ...formData, type: value })
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Ankündigung</SelectItem>
                  <SelectItem value="invoice">Rechnung</SelectItem>
                  <SelectItem value="operating_costs">Betriebskostenabrechnung</SelectItem>
                  <SelectItem value="payment_reminder">Zahlungserinnerung</SelectItem>
                  <SelectItem value="other">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Priorität</label>
              <Select value={formData.priority} onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Titel</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Benachrichtigungstitel"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Nachricht</label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Benachrichtigungsnachricht"
              className="mt-1 min-h-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tenant Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Mieter auswählen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter by Building */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Nach Gebäude filtern (optional)
            </label>
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Alle Gebäude" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Alle Gebäude</SelectItem>
                {buildings?.map(building => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Count */}
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">{selectedTenants.length}</span> Mieter ausgewählt
            </p>
          </div>

          {/* Tenant List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tenants
              ?.filter(tenant =>
                selectedBuilding === '' || filteredTenants.includes(tenant.id)
              )
              .map(tenant => (
                <div
                  key={tenant.id}
                  className="flex items-center gap-3 p-2 border rounded hover:bg-slate-50 transition-colors"
                >
                  <Checkbox
                    checked={selectedTenants.includes(tenant.id)}
                    onCheckedChange={() => handleTenantToggle(tenant.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">
                      {tenant.first_name} {tenant.last_name}
                    </p>
                    <p className="text-sm text-slate-500">{tenant.email}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {selectedTenantObjects.length > 0 && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-base">Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-semibold">Empfänger:</span> {selectedTenantObjects
                  .map(t => `${t.first_name} ${t.last_name}`)
                  .join(', ')}
              </p>
              <p>
                <span className="font-semibold">Typ:</span>{' '}
                {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
              </p>
              <p>
                <span className="font-semibold">Priorität:</span>{' '}
                {formData.priority === 'high' && '🔴 Hoch'}
                {formData.priority === 'normal' && '🟡 Normal'}
                {formData.priority === 'low' && '🟢 Niedrig'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={sendNotificationMutation.isPending || selectedTenants.length === 0}
        className="w-full gap-2 h-10"
      >
        <Send className="w-4 h-4" />
        Benachrichtigungen versenden ({selectedTenants.length})
      </Button>
    </div>
  );
}