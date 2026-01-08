import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataExport() {
  const [userId, setUserId] = useState('');
  const [exportResult, setExportResult] = useState(null);

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('exportUserData', { userId });
      return response.data;
    },
    onSuccess: (data) => {
      setExportResult(data);
      
      // Download JSON
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user_data_${userId}_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('Daten erfolgreich exportiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          GDPR Datenexport
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Benutzer-ID</label>
          <Input
            placeholder="User ID eingeben"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <Button
          onClick={() => exportMutation.mutate()}
          disabled={!userId || exportMutation.isPending}
          className="w-full"
        >
          {exportMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportiere...</>
          ) : (
            <><Download className="w-4 h-4 mr-2" /> Daten exportieren</>
          )}
        </Button>

        {exportResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">Export erfolgreich</span>
            </div>
            <div className="text-sm text-green-800">
              <div>Entities: {exportResult.summary?.entities}</div>
              <div>Records: {exportResult.summary?.totalRecords}</div>
            </div>
          </div>
        )}

        <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
          <strong>GDPR Compliance:</strong> Exportiert alle personenbezogenen Daten gemäß Art. 15 DSGVO.
        </div>
      </CardContent>
    </Card>
  );
}