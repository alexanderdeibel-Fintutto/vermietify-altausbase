import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SecuritySettings({ user }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getUserSessions', {});
      return response.data;
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('changePassword', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Passwort erfolgreich geändert');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error(error.message || 'Fehler beim Ändern des Passworts');
    }
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      const response = await base44.functions.invoke('revokeSession', { sessionId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Session beendet');
    }
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwörter stimmen nicht überein');
      return;
    }
    changePasswordMutation.mutate(passwordData);
  };

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Passwort ändern
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label>Aktuelles Passwort</Label>
              <Input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Neues Passwort</Label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
              </div>
              <div>
                <Label>Passwort bestätigen</Label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              Passwort ändern
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Aktive Sessions</h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{session.device || 'Unbekanntes Gerät'}</div>
                  <div className="text-sm text-slate-600">
                    {session.ip} · Zuletzt aktiv: {format(new Date(session.last_activity), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeSessionMutation.mutate(session.id)}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-2 text-red-600">Gefahrenzone</h3>
          <p className="text-sm text-slate-600 mb-4">
            Vorsicht: Diese Aktionen können nicht rückgängig gemacht werden.
          </p>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Account löschen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}