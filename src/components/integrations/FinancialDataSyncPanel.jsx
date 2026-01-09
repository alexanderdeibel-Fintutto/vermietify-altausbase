import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialDataSyncPanel() {
  const [syncing, setSyncing] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletNetwork, setWalletNetwork] = useState('ethereum');

  const { data: syncStatus, refetch } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return {
        finapi_connected: user.finapi_connected || false,
        finapi_connected_at: user.finapi_connected_at,
        last_data_sync: user.last_data_sync,
        ytd_income: user.ytd_income || 0,
        ytd_expenses: user.ytd_expenses || 0,
        projected_annual_income: user.projected_annual_income || 0,
        projected_annual_expenses: user.projected_annual_expenses || 0,
        crypto_holdings_value: user.crypto_holdings_value || 0
      };
    }
  });

  const handleSyncBanks = async () => {
    try {
      setSyncing(true);
      const response = await base44.functions.invoke('syncFinancialDataFromBanks', {
        action: 'sync'
      });

      if (response.data.success) {
        toast.success(`${response.data.accounts_synced} Konten, ${response.data.transactions_synced} Transaktionen synchronisiert`);
        refetch();
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddWallet = async () => {
    if (!walletAddress) {
      toast.error('Wallet-Adresse erforderlich');
      return;
    }

    try {
      setSyncing(true);
      const response = await base44.functions.invoke('syncCryptoExchangeData', {
        wallet_addresses: [{ address: walletAddress, network: walletNetwork }],
        crypto_assets: []
      });

      if (response.data.success) {
        toast.success(`${response.data.holdings_synced} Kryptowerte synchronisiert`);
        setWalletAddress('');
        refetch();
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Überblick</TabsTrigger>
          <TabsTrigger value="banks">Banken</TabsTrigger>
          <TabsTrigger value="crypto">Krypto</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Datensynchronisations-Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Einkommen (YTD)</p>
                  <p className="text-2xl font-semibold">{(syncStatus?.ytd_income || 0).toLocaleString('de-DE')} €</p>
                  <p className="text-xs text-slate-500 mt-1">Proj. Jahr: {(syncStatus?.projected_annual_income || 0).toLocaleString('de-DE')} €</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Ausgaben (YTD)</p>
                  <p className="text-2xl font-semibold">{(syncStatus?.ytd_expenses || 0).toLocaleString('de-DE')} €</p>
                  <p className="text-xs text-slate-500 mt-1">Proj. Jahr: {(syncStatus?.projected_annual_expenses || 0).toLocaleString('de-DE')} €</p>
                </div>
              </div>

              {syncStatus?.last_data_sync && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    Zuletzt synchronisiert: {new Date(syncStatus.last_data_sync).toLocaleDateString('de-DE')}
                  </AlertDescription>
                </Alert>
              )}

              {syncStatus?.crypto_holdings_value > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-600">Kryptowerte</p>
                  <p className="text-lg font-semibold text-amber-900">{(syncStatus.crypto_holdings_value).toLocaleString('de-DE')} €</p>
                </div>
              )}

              <Button
                onClick={async () => {
                  setSyncing(true);
                  try {
                    await handleSyncBanks();
                    // Also sync crypto if wallets connected
                    const response = await base44.functions.invoke('syncCryptoExchangeData', {
                      wallet_addresses: [],
                      crypto_assets: []
                    });
                    toast.success('Alle Daten synchronisiert');
                  } finally {
                    setSyncing(false);
                  }
                }}
                disabled={syncing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird synchronisiert...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Alle Daten synchronisieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banks Tab */}
        <TabsContent value="banks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bankkonten-Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncStatus?.finapi_connected ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm text-green-800">
                    FinAPI verbunden seit {new Date(syncStatus.finapi_connected_at).toLocaleDateString('de-DE')}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm text-blue-800">
                    Verbinden Sie Ihre Bankkonten für automatische Transaktionssynchronisierung
                  </AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSyncBanks}
                disabled={syncing || !syncStatus?.finapi_connected}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird synchronisiert...
                  </>
                ) : (
                  'Bankdaten synchronisieren'
                )}
              </Button>

              <div className="text-xs text-slate-600 bg-slate-50 rounded p-3">
                <p className="font-semibold mb-1">Wie funktioniert es?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sichere PSD2/Open Banking Verbindung</li>
                  <li>Automatische Transaktionssynchronisierung (letzte 3 Monate)</li>
                  <li>Duplizierungserkennung und Datenbereinigung</li>
                  <li>Automatische Kategorisierung für Prognosen</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crypto Tab */}
        <TabsContent value="crypto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kryptowährungen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">Netzwerk</Label>
                  <select
                    value={walletNetwork}
                    onChange={(e) => setWalletNetwork(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                  >
                    <option value="ethereum">Ethereum</option>
                    <option value="bitcoin">Bitcoin</option>
                    <option value="polygon">Polygon</option>
                    <option value="solana">Solana</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm">Wallet-Adresse</Label>
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleAddWallet}
                  disabled={syncing || !walletAddress}
                  className="w-full"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird hinzugefügt...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Wallet verbinden
                    </>
                  )}
                </Button>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  Ihre privaten Schlüssel werden nicht gespeichert. Wir verwenden öffentliche Blockchain-APIs für Lesezugriff.
                </AlertDescription>
              </Alert>

              {syncStatus?.crypto_holdings_value > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold mb-1">Verbundene Wallets</p>
                  <p className="text-sm font-semibold text-amber-900">{(syncStatus.crypto_holdings_value).toLocaleString('de-DE')} € in Krypto</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}