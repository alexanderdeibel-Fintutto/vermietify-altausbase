import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, FileText, AlertCircle, Lightbulb } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function TaxCockpit({ user, year = new Date().getFullYear() }) {
  const [selectedYear, setSelectedYear] = useState(year);
  const queryClient = useQueryClient();

  const { data: taxCalculation } = useQuery({
    queryKey: ['taxCalculation', user?.id, selectedYear],
    queryFn: async () => {
      if (!user?.id) return null;
      const calcs = await base44.entities.TaxCalculation.filter(
        { user_id: user.id, tax_year: selectedYear, form_type: 'anlage_kap' },
        '-created_date',
        1
      );
      return calcs?.[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ['assetPortfolio', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await base44.entities.AssetPortfolio.filter(
        { user_id: user.id, status: 'active' },
        '-created_date',
        100
      ) || [];
    },
    enabled: !!user?.id
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('calculateAnlageKAP', {
        user_id: user.id,
        tax_year: selectedYear
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxCalculation'] });
    }
  });

  const calculateMetrics = () => {
    const totalValue = portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.current_value), 0);
    const totalInvested = portfolio.reduce((sum, asset) => sum + (asset.quantity * asset.purchase_price), 0);
    const unrealizedGain = totalValue - totalInvested;
    
    return { totalValue, totalInvested, unrealizedGain };
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-light">Steuer-Cockpit</h2>
        <div className="flex gap-2">
          {[2022, 2023, 2024].map(y => (
            <Button
              key={y}
              size="sm"
              variant={selectedYear === y ? 'default' : 'outline'}
              onClick={() => setSelectedYear(y)}
              className="font-light"
            >
              {y}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="anlage-kap">Anlage KAP</TabsTrigger>
          <TabsTrigger value="optimization">Optimierung</TabsTrigger>
          <TabsTrigger value="history">Historie</TabsTrigger>
        </TabsList>

        {/* Übersicht */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-light text-slate-600">Unrealisierte Gewinne</div>
                <div className={`text-2xl font-light mt-2 ${metrics.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.unrealizedGain)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-light text-slate-600">Sparer-Pauschbetrag</div>
                <div className="text-2xl font-light mt-2 text-slate-900">1.000€</div>
                <div className="text-xs text-slate-500 mt-1">Verfügbar</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-sm font-light text-slate-600">Geschätzte Steuer</div>
                <div className="text-2xl font-light mt-2 text-orange-600">
                  {formatCurrency((metrics.unrealizedGain * 0.25))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anlage KAP */}
        <TabsContent value="anlage-kap" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-light">Anlage KAP {selectedYear}</h3>
            <Button
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {calculateMutation.isPending ? 'Berechne...' : 'Berechnen'}
            </Button>
          </div>

          {taxCalculation && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <h4 className="font-medium mb-4">Kapitalerträge</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Zeile 7 - Zinsen:</span>
                        <span className="font-mono">{formatCurrency(taxCalculation.calculated_fields?.zeile_7 || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zeile 9 - Dividenden (inländisch):</span>
                        <span className="font-mono">{formatCurrency(taxCalculation.calculated_fields?.zeile_9 || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Zeile 12 - Wertpapiergewinne:</span>
                        <span className="font-mono">{formatCurrency(taxCalculation.calculated_fields?.zeile_12 || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Pauschbetrag & Steuer</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between font-medium">
                        <span>Sparer-Pauschbetrag:</span>
                        <span className="text-green-600">{formatCurrency(taxCalculation.sparer_pauschbetrag_used)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Verbleibend:</span>
                        <span>{formatCurrency(taxCalculation.sparer_pauschbetrag_remaining)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Optimierung */}
        <TabsContent value="optimization" className="space-y-4">
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertTitle>Steuerspar-Potenziale</AlertTitle>
            <AlertDescription>
              Basierend auf Ihrem Portfolio gibt es folgende Optimierungsmöglichkeiten:
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="mt-1">Tipp 1</Badge>
                <div>
                  <p className="font-medium text-sm">Sparer-Pauschbetrag nutzen</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Sie können bis zu 1.000€ Kapitalerträge steuerfrei erhalten. 
                    Nutzen Sie den Pauschbetrag optimal.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Badge className="mt-1">Tipp 2</Badge>
                <div>
                  <p className="font-medium text-sm">Verlustverrechnungspotenzial</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Realisieren Sie Verluste in anderen Kategorien zur Verlustverrechnung.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historie */}
        <TabsContent value="history" className="space-y-4">
          <p className="text-sm text-slate-600 font-light">
            Keine früheren Berechnungen vorhanden.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}