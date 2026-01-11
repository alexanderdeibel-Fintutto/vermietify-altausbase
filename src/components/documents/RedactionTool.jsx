import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { EyeOff, Loader2 } from 'lucide-react';

export default function RedactionTool({ documentId }) {
  const [autoDetect, setAutoDetect] = useState(true);
  const queryClient = useQueryClient();

  const redactMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('redactDocument', {
        document_id: documentId,
        auto_detect: autoDetect
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['document'] });
    }
  });

  const result = redactMutation.data?.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <EyeOff className="w-4 h-4" />
          Schwärzung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Auto-Erkennung</span>
          <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
        </div>

        {autoDetect && (
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-xs font-medium mb-1">Erkennt automatisch:</p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">Kreditkarten</Badge>
              <Badge variant="outline" className="text-xs">IBAN</Badge>
              <Badge variant="outline" className="text-xs">E-Mails</Badge>
              <Badge variant="outline" className="text-xs">Telefon</Badge>
              <Badge variant="outline" className="text-xs">SSN</Badge>
            </div>
          </div>
        )}

        <Button
          onClick={() => redactMutation.mutate()}
          disabled={redactMutation.isPending}
          className="w-full gap-2"
        >
          {redactMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Schwärzen
        </Button>

        {result && (
          <div className="bg-green-50 p-3 rounded space-y-2">
            <p className="text-sm font-medium text-green-900">Erfolgreich geschwärzt:</p>
            {result.redacted?.map((item, i) => (
              <p key={i} className="text-xs text-green-700">
                • {item.count}x {item.type}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}