import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Bell, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantBulkManagement() {
  const [selectedTenants, setSelectedTenants] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkAction, setBulkAction] = useState('notify');
  const [notificationMessage, setNotificationMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: tenants = [] } = useQuery({
    queryKey: ['allTenants'],
    queryFn: () => base44.entities.Tenant.list('-created_date')
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ['allContracts'],
    queryFn: () => base44.entities.LeaseContract.list()
  });

  const filteredTenants = tenants.filter(t =>
    `${t.first_name} ${t.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const bulkNotifyMutation = useMutation({
    mutationFn: async (tenantIds) => {
      for (const tenantId of tenantIds) {
        await base44.entities.TenantNotification.create({
          tenant_id: tenantId,
          type: 'announcement',
          title: 'Wichtige Mitteilung',
          message: notificationMessage,
          priority: 'normal'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTenants'] });
      toast.success(`${selectedTenants.size} Benachrichtigungen versendet`);
      setNotificationMessage('');
      setSelectedTenants(new Set());
    },
    onError: () => toast.error('Fehler beim Versand')
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (tenantIds) => {
      for (const tenantId of tenantIds) {
        await base44.entities.Tenant.delete(tenantId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allTenants'] });
      toast.success(`${selectedTenants.size} Mieter gelöscht`);
      setSelectedTenants(new Set());
    },
    onError: () => toast.error('Fehler beim Löschen')
  });

  const toggleTenant = (tenantId) => {
    const newSelected = new Set(selectedTenants);
    if (newSelected.has(tenantId)) {
      newSelected.delete(tenantId);
    } else {
      newSelected.add(tenantId);
    }
    setSelectedTenants(newSelected);
  };

  const toggleAll = () => {
    if (selectedTenants.size === filteredTenants.length) {
      setSelectedTenants(new Set());
    } else {
      setSelectedTenants(new Set(filteredTenants.map(t => t.id)));
    }
  };

  const handleBulkAction = async () => {
    if (selectedTenants.size === 0) {
      toast.error('Bitte mindestens einen Mieter auswählen');
      return;
    }

    const tenantIds = Array.from(selectedTenants);

    switch (bulkAction) {
      case 'notify':
        if (!notificationMessage.trim()) {
          toast.error('Bitte eine Nachricht eingeben');
          return;
        }
        bulkNotifyMutation.mutate(tenantIds);
        break;
      case 'delete':
        if (window.confirm(`${selectedTenants.size} Mieter wirklich löschen?`)) {
          bulkDeleteMutation.mutate(tenantIds);
        }
        break;
    }
  };

  const getTenantContractStatus = (tenantId) => {
    const contract = contracts.find(c => c.tenant_id === tenantId);
    return contract?.status || 'keine';
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Mieter Verwaltung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Nach Name oder Email suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notify">Benachrichtigung senden</SelectItem>
                <SelectItem value="delete">Löschen</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleBulkAction}
              disabled={selectedTenants.size === 0}
              className="gap-2"
            >
              {bulkAction === 'notify' ? (
                <>
                  <Bell className="w-4 h-4" />
                  Benachrichtigung senden
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Löschen
                </>
              )}
            </Button>
          </div>

          {bulkAction === 'notify' && (
            <textarea
              placeholder="Benachrichtigungsnachricht eingeben..."
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg"
              rows="3"
            />
          )}

          {selectedTenants.size > 0 && (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
              {selectedTenants.size} von {filteredTenants.length} Mietern ausgewählt
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenants List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Mieterliste ({filteredTenants.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="gap-2"
            >
              <Checkbox checked={selectedTenants.size === filteredTenants.length} />
              {selectedTenants.size === filteredTenants.length ? 'Alle abwählen' : 'Alle auswählen'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 w-10">
                    <Checkbox
                      checked={selectedTenants.size === filteredTenants.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="text-left py-2 px-3">Name</th>
                  <th className="text-left py-2 px-3">Email</th>
                  <th className="text-left py-2 px-3">Vertrag</th>
                  <th className="text-left py-2 px-3">Registriert</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <Checkbox
                        checked={selectedTenants.has(tenant.id)}
                        onChange={() => toggleTenant(tenant.id)}
                      />
                    </td>
                    <td className="py-3 px-3 font-medium">
                      {tenant.first_name} {tenant.last_name}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{tenant.email}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getTenantContractStatus(tenant.id) === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getTenantContractStatus(tenant.id)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {new Date(tenant.created_date).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}