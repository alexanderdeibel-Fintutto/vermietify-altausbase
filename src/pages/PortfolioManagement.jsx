import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, TrendingUp } from 'lucide-react';
import StockFormDialog from '@/components/wealth/StockFormDialog';
import CryptoFormDialog from '@/components/wealth/CryptoFormDialog';
import PreciousMetalFormDialog from '@/components/wealth/PreciousMetalFormDialog';
import OtherAssetFormDialog from '@/components/wealth/OtherAssetFormDialog';
import AssetTransactionDialog from '@/components/wealth/AssetTransactionDialog';
import StocksList from '@/components/wealth/StocksList';
import CryptoList from '@/components/wealth/CryptoList';
import PreciousMetalsList from '@/components/wealth/PreciousMetalsList';
import OtherAssetsList from '@/components/wealth/OtherAssetsList';
import PortfolioSummary from '@/components/wealth/PortfolioSummary';
import TaxLossHarvestingWidget from '@/components/wealth/TaxLossHarvestingWidget';
import CapitalGainCalculator from '@/components/wealth/CapitalGainCalculator';
import TaxSettingsDialog from '@/components/wealth/TaxSettingsDialog';

export default function PortfolioManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stockFormOpen, setStockFormOpen] = useState(false);
  const [cryptoFormOpen, setCryptoFormOpen] = useState(false);
  const [pmFormOpen, setPmFormOpen] = useState(false);
  const [otherFormOpen, setOtherFormOpen] = useState(false);
  const [txFormOpen, setTxFormOpen] = useState(false);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: stocks = [] } = useQuery({
    queryKey: ['stocks'],
    queryFn: () => base44.entities.Stock.list(),
  });

  const { data: cryptos = [] } = useQuery({
    queryKey: ['cryptos'],
    queryFn: () => base44.entities.Crypto.list(),
  });

  const { data: metals = [] } = useQuery({
    queryKey: ['precious_metals'],
    queryFn: () => base44.entities.PreciousMetal.list(),
  });

  const { data: otherAssets = [] } = useQuery({
    queryKey: ['other_assets'],
    queryFn: () => base44.entities.OtherAsset.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['current_user'],
    queryFn: () => base44.auth.me(),
  });

  const createStockMutation = useMutation({
    mutationFn: (data) => base44.entities.Stock.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stocks'] });
      setStockFormOpen(false);
    },
  });

  const createCryptoMutation = useMutation({
    mutationFn: (data) => base44.entities.Crypto.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cryptos'] });
      setCryptoFormOpen(false);
    },
  });

  const createPmMutation = useMutation({
    mutationFn: (data) => base44.entities.PreciousMetal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['precious_metals'] });
      setPmFormOpen(false);
    },
  });

  const createOtherMutation = useMutation({
    mutationFn: (data) => base44.entities.OtherAsset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['other_assets'] });
      setOtherFormOpen(false);
    },
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Portfolio-Management</h1>
            <p className="text-slate-600 mt-1">Verwalte deine Vermögenswerte und Steuern</p>
          </div>
          <Button
            onClick={() => setTaxSettingsOpen(true)}
            variant="outline"
            size="icon"
            title="Steuereinstellungen"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Summary Cards */}
        {user && <PortfolioSummary userEmail={user.email} stocks={stocks} cryptos={cryptos} metals={metals} />}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="stocks">Aktien & ETFs</TabsTrigger>
            <TabsTrigger value="crypto">Kryptowährungen</TabsTrigger>
            <TabsTrigger value="metals">Edelmetalle</TabsTrigger>
            <TabsTrigger value="other">Sonstige</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {user && <TaxLossHarvestingWidget userEmail={user.email} />}
              {user && <CapitalGainCalculator userEmail={user.email} />}
            </div>
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Aktien & ETFs ({stocks.length})</CardTitle>
                <Button
                  onClick={() => setStockFormOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neu hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                <StocksList stocks={stocks} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crypto Tab */}
          <TabsContent value="crypto" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Kryptowährungen ({cryptos.length})</CardTitle>
                <Button
                  onClick={() => setCryptoFormOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neu hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                <CryptoList cryptos={cryptos} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metals Tab */}
          <TabsContent value="metals" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Edelmetalle ({metals.length})</CardTitle>
                <Button
                  onClick={() => setPmFormOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neu hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                <PreciousMetalsList metals={metals} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Assets Tab */}
          <TabsContent value="other" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sonstige Vermögenswerte ({otherAssets.length})</CardTitle>
                <Button
                  onClick={() => setOtherFormOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Neu hinzufügen
                </Button>
              </CardHeader>
              <CardContent>
                <OtherAssetsList otherAssets={otherAssets} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <StockFormDialog
        open={stockFormOpen}
        onOpenChange={setStockFormOpen}
        onSubmit={(data) => createStockMutation.mutate(data)}
        isLoading={createStockMutation.isPending}
      />
      <CryptoFormDialog
        open={cryptoFormOpen}
        onOpenChange={setCryptoFormOpen}
        onSubmit={(data) => createCryptoMutation.mutate(data)}
        isLoading={createCryptoMutation.isPending}
      />
      <PreciousMetalFormDialog
        open={pmFormOpen}
        onOpenChange={setPmFormOpen}
        onSubmit={(data) => createPmMutation.mutate(data)}
        isLoading={createPmMutation.isPending}
      />
      <OtherAssetFormDialog
        open={otherFormOpen}
        onOpenChange={setOtherFormOpen}
        onSubmit={(data) => createOtherMutation.mutate(data)}
        isLoading={createOtherMutation.isPending}
      />
      <TaxSettingsDialog open={taxSettingsOpen} onOpenChange={setTaxSettingsOpen} userEmail={user?.email} />
    </div>
  );
}