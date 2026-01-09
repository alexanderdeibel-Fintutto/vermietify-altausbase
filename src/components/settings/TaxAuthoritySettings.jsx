import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxAuthoritySettings() {
  const [loading, setLoading] = useState(false);

  const { data: user, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => base44.auth.me()
  });

  const handleConnectFINANZOnline = async () => {
    try {
      const clientId = process.env.REACT_APP_FINANZONLINE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/finanzonline-callback`;
      window.location.href = `https://finanzonline.bmf.gv.at/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=submission`;
    } catch (err) {
      toast.error('Verbindung fehlgeschlagen');
    }
  };

  const handleDisconnectFINANZOnline = async () => {
    try {
      setLoading(true);
      await base44.auth.updateMe({
        finanzonline_connected: false,
        finanzonline_access_token: null,
        finanzonline_refresh_token: null
      });
      await refetch();
      toast.success('Verbindung getrennt');
    } catch (err) {
      toast.error('Fehler beim Trennen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light mb-4">Steuerbehörden-Integrationen</h2>
        <p className="text-sm text-slate-500 mb-6">
          Verbinden Sie Ihre Konten mit Steuerbehörden für direkte Einreichung
        </p>
      </div>

      {/* FINANZOnline Austria */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">FINANZOnline Österreich</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.finanzonline_connected ? (
            <>
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm text-green-800">
                  Verbunden seit {new Date(user.finanzonline_connected_at).toLocaleDateString('de-DE')}
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleDisconnectFINANZOnline}
                disabled={loading}
                variant="destructive"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird getrennt...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Verbindung trennen
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  Verbinden Sie Ihr FINANZOnline-Konto um Steuererklärungen direkt einzureichen
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleConnectFINANZOnline}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Mit FINANZOnline verbinden
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Swiss Cantonal Portals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schweizer Kantonale Portale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Direktes Einreichen bei Ihrem Kanton ist für diese Kantone verfügbar:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {['ZH', 'BE', 'AG', 'SG', 'BS'].map(canton => (
              <div key={canton} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
                <Badge variant="outline">{canton}</Badge>
                <span className="text-sm text-slate-600">Verfügbar</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Weitere Kantone werden in Kürze hinzugefügt
          </p>
        </CardContent>
      </Card>

      {/* API Keys for Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              API-Schlüssel werden für automatisierte Statusprüfungen benötigt
            </AlertDescription>
          </Alert>
          <p className="text-sm text-slate-600">
            Kontaktieren Sie Ihren Administrator um API-Zugänge zu konfigurieren
          </p>
        </CardContent>
      </Card>
    </div>
  );
}