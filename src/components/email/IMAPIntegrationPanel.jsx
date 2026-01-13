import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Check, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function IMAPIntegrationPanel() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncInvoices, setSyncInvoices] = useState(true);
  const [syncContracts, setSyncContracts] = useState(true);
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['imap-config'],
    queryFn: async () => {
      // Fetch stored config
      return null;
    }
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('setupIMAPIntegration', {
        email: email,
        password: password,
        autoSync: true
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ IMAP verbunden');
      queryClient.invalidateQueries(['imap-config']);
      setEmail('');
      setPassword('');
    },
    onError: () => toast.error('Verbindung fehlgeschlagen')
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('syncEmailsAndCategorize', {
        syncInvoices: syncInvoices,
        syncContracts: syncContracts
      });
      return response.data;
    },
    onSuccess: (result) => {
      toast.success(`✅ ${result.synced} E-Mails synchronisiert`);
      queryClient.invalidateQueries();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          E-Mail Integration (IMAP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {config ? (
          <>
            <Alert className="border-emerald-200 bg-emerald-50">
              <Check className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-sm text-emerald-800">
                ✅ IMAP ist verbunden ({config.email})
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={syncInvoices} onCheckedChange={setSyncInvoices} />
                <span className="text-sm">Rechnungen automatisch kategorisieren</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={syncContracts} onCheckedChange={setSyncContracts} />
                <span className="text-sm">Verträge automatisch verlinken</span>
              </label>
            </div>

            <Button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="w-full gap-2"
            >
              {syncMutation.isPending ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </Button>
          </>
        ) : (
          <>
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                E-Mail-Synchronisierung hilft bei der automatischen Kategorisierung von Rechnungen und Verträgen
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Input
                type="email"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              onClick={() => setupMutation.mutate()}
              disabled={!email || !password || setupMutation.isPending}
              className="w-full"
            >
              {setupMutation.isPending ? 'Verbinde...' : 'IMAP verbinden'}
            </Button>

            <p className="text-xs text-slate-500">
              🔒 Ihr Passwort wird verschlüsselt gespeichert und nicht weitergegeben.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}