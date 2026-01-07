import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Shield, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataExport() {
  const [userId, setUserId] = useState('');

  const exportMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await base44.functions.invoke('exportUserData', { userId });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-export-${userId}-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Daten exportiert');
    }
  });

  const handleExport = () => {
    if (!userId) return;
    exportMutation.mutate(userId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <CardTitle>GDPR Datenexport</CardTitle>
        </div>
        <CardDescription>
          Exportieren Sie alle Benutzerdaten gemäß DSGVO Art. 15
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="userId">Benutzer-ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_..."
            />
          </div>

          <Button 
            onClick={handleExport} 
            disabled={!userId || exportMutation.isPending}
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Daten exportieren
          </Button>

          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-medium">Exportierte Daten umfassen:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Persönliche Informationen</li>
              <li>Rollen-Zuweisungen</li>
              <li>Modul-Zugriffe</li>
              <li>Aktivitäts-Logs</li>
              <li>Test-Sessions (falls Tester)</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}