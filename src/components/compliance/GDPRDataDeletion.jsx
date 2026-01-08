import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataDeletion() {
  const [userId, setUserId] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('deleteUserData', { userId });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.summary?.deletedRecords} Datensätze gelöscht`);
      setUserId('');
      setConfirmed(false);
    }
  });

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-900">
          <Trash2 className="w-5 h-5" />
          GDPR Datenlöschung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <strong>Warnung:</strong> Diese Aktion löscht unwiderruflich alle personenbezogenen Daten 
              des Benutzers gemäß Art. 17 DSGVO (Recht auf Löschung).
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Benutzer-ID</label>
          <Input
            placeholder="User ID eingeben"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            checked={confirmed}
            onCheckedChange={setConfirmed}
          />
          <label className="text-sm">
            Ich bestätige, dass ich die Löschung verstehe und autorisiere
          </label>
        </div>

        <Button
          onClick={() => deleteMutation.mutate()}
          disabled={!userId || !confirmed || deleteMutation.isPending}
          variant="destructive"
          className="w-full"
        >
          {deleteMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Lösche...</>
          ) : (
            <><Trash2 className="w-4 h-4 mr-2" /> Daten löschen</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}