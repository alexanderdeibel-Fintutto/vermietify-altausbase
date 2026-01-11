import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, User } from 'lucide-react';

export default function PersonalizedUpdateGenerator({ companyId }) {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [generatedUpdate, setGeneratedUpdate] = useState('');

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', companyId],
    queryFn: () => base44.entities.Tenant.filter({ company_id: companyId })
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('generatePersonalizedTenantUpdates', {
        tenant_id: selectedTenantId,
        company_id: companyId
      }),
    onSuccess: (response) => setGeneratedUpdate(response.data.update)
  });

  const sendToAllMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const tenant of tenants.slice(0, 10)) {
        const response = await base44.functions.invoke('generatePersonalizedTenantUpdates', {
          tenant_id: tenant.id,
          company_id: companyId
        });
        results.push({ tenant: tenant.first_name, sent: true });
      }
      return results;
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Personalisierte Updates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm mb-2 block">Mieter auswählen</label>
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger>
              <SelectValue placeholder="Mieter wählen..." />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t.id} value={t.id}>
                  {t.first_name} {t.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!selectedTenantId || generateMutation.isPending}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Update generieren
          </Button>
          <Button
            variant="outline"
            onClick={() => sendToAllMutation.mutate()}
            disabled={sendToAllMutation.isPending}
          >
            <Send className="w-4 h-4 mr-2" />
            An alle (Top 10)
          </Button>
        </div>

        {generatedUpdate && (
          <div className="p-4 bg-slate-50 rounded border">
            <p className="text-sm font-medium mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              Generiertes Update:
            </p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedUpdate}</p>
            <Badge className="mt-3 bg-green-100 text-green-800">
              ✓ Als Benachrichtigung versendet
            </Badge>
          </div>
        )}

        {sendToAllMutation.isSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-900">
              ✓ Updates an {sendToAllMutation.data.length} Mieter versendet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}