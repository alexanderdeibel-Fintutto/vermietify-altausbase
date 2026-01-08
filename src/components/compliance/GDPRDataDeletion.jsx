import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GDPRDataDeletion() {
  const [userId, setUserId] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('deleteUserData', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Benutzerdaten gelöscht');
      setUserId('');
      setConfirmEmail('');
      setShowConfirm(false);
    }
  });

  const handleDelete = () => {
    if (!userId || !confirmEmail) return;
    deleteMutation.mutate({ userId, confirmEmail });
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <CardTitle className="text-red-900">Benutzerdaten löschen</CardTitle>
        </div>
        <CardDescription>
          Unwiderrufliche Löschung gemäß DSGVO Art. 17
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ⚠️ Diese Aktion kann nicht rückgängig gemacht werden!
            </p>
          </div>

          <div>
            <Label htmlFor="userId">Benutzer-ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user_..."
            />
          </div>

          {!showConfirm ? (
            <Button 
              variant="destructive"
              onClick={() => setShowConfirm(true)}
              disabled={!userId}
              className="w-full"
            >
              Löschung vorbereiten
            </Button>
          ) : (
            <>
              <div>
                <Label htmlFor="confirmEmail">E-Mail zur Bestätigung</Label>
                <Input
                  id="confirmEmail"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="benutzer@beispiel.de"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  className="flex-1"
                >
                  Abbrechen
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!confirmEmail || deleteMutation.isPending}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Endgültig löschen
                </Button>
              </div>
            </>
          )}

          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-medium">Was wird gelöscht:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Alle Rollen-Zuweisungen</li>
              <li>Modul-Zugriffe</li>
              <li>Aktivitäts-Logs (anonymisiert)</li>
              <li>Test-Sessions</li>
              <li>Persönliche Daten</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}