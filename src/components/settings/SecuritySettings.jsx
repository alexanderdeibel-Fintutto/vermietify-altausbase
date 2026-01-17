import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Shield, Lock } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';

export default function SecuritySettings() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleChangePassword = () => {
    if (passwords.new !== passwords.confirm) {
      showError('Passwörter stimmen nicht überein');
      return;
    }

    showSuccess('Passwort wurde geändert');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Sicherheit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-w-xl">
          <VfInput
            type="password"
            label="Aktuelles Passwort"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
          />

          <VfInput
            type="password"
            label="Neues Passwort"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
          />

          <VfInput
            type="password"
            label="Passwort bestätigen"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
          />

          <Button 
            variant="gradient"
            onClick={handleChangePassword}
          >
            <Lock className="h-4 w-4 mr-2" />
            Passwort ändern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}