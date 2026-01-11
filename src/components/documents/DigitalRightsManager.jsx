import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye, Download, Printer, Copy, Share2 } from 'lucide-react';

export default function DigitalRightsManager({ documentId, companyId }) {
  const queryClient = useQueryClient();

  const { data: rights } = useQuery({
    queryKey: ['rights', documentId],
    queryFn: async () => {
      const result = await base44.functions.invoke('manageDocumentRights', {
        action: 'get_rights',
        document_id: documentId
      });
      return result.data.rights;
    }
  });

  const [config, setConfig] = useState({
    can_view: rights?.can_view ?? true,
    can_download: rights?.can_download ?? true,
    can_print: rights?.can_print ?? true,
    can_copy: rights?.can_copy ?? false,
    can_share: rights?.can_share ?? false,
    watermark_required: rights?.watermark_required ?? false,
    max_access_count: rights?.max_access_count || ''
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('manageDocumentRights', {
        action: 'set_rights',
        document_id: documentId,
        company_id: companyId,
        rights_config: config
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rights'] })
  });

  React.useEffect(() => {
    if (rights) {
      setConfig({
        can_view: rights.can_view ?? true,
        can_download: rights.can_download ?? true,
        can_print: rights.can_print ?? true,
        can_copy: rights.can_copy ?? false,
        can_share: rights.can_share ?? false,
        watermark_required: rights.watermark_required ?? false,
        max_access_count: rights.max_access_count || ''
      });
    }
  }, [rights]);

  const permissions = [
    { key: 'can_view', label: 'Anzeigen', icon: Eye },
    { key: 'can_download', label: 'Herunterladen', icon: Download },
    { key: 'can_print', label: 'Drucken', icon: Printer },
    { key: 'can_copy', label: 'Kopieren', icon: Copy },
    { key: 'can_share', label: 'Teilen', icon: Share2 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Digital Rights Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permissions */}
        {permissions.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-3 h-3 text-slate-500" />
              <span className="text-sm">{label}</span>
            </div>
            <Switch
              checked={config[key]}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, [key]: checked }))}
            />
          </div>
        ))}

        {/* Watermark */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm">Wasserzeichen erforderlich</span>
          <Switch
            checked={config.watermark_required}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, watermark_required: checked }))}
          />
        </div>

        {/* Access Limit */}
        <div className="pt-3 border-t">
          <label className="text-sm font-medium">Max. Zugriffe</label>
          <Input
            type="number"
            placeholder="Unbegrenzt"
            value={config.max_access_count}
            onChange={(e) => setConfig(prev => ({ ...prev, max_access_count: e.target.value }))}
            className="mt-1 text-sm"
          />
          {rights?.access_count > 0 && (
            <p className="text-xs text-slate-600 mt-1">
              Aktuelle Zugriffe: {rights.access_count}
            </p>
          )}
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full"
        >
          Rechte speichern
        </Button>
      </CardContent>
    </Card>
  );
}