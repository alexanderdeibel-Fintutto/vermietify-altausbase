import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Briefcase, Home, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedTaxStrategyPanel({ userProfile }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(null);

  const handleGenerateStrategy = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('generateAdvancedTaxOptimizationStrategy', {
        annual_income: userProfile.estimated_annual_tax || 100000,
        income_sources: userProfile.income_sources || [],
        assets: userProfile.asset_categories || [],
        liabilities: [],
        investment_portfolio: {},
        business_structure: null,
        dependents: 0,
        country: userProfile.primary_residence_country,
        tax_year: new Date().getFullYear(),
        planning_horizon: '5 Jahre'
      });

      if (response.data.success) {
        setStrategy(response.data.strategy);
      }
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!strategy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Erweiterte Steueropitmierung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Erhalten Sie personalisierte Strategien für Investitionen, Unternehmensstruktur und Nachlassplanung.
          </p>
          <Button
            onClick={handleGenerateStrategy}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Wird analysiert...
              </>
            ) : (
              'Strategie generieren'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const efficiencyGap = (strategy.potential_tax_efficiency_score - strategy.current_tax_efficiency_score) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Erweiterte Steueropitmierung
          </div>
          <Badge variant="outline">
            Steuervorteil: {strategy.improvement_potential_amount?.toLocaleString('de-DE')} €
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Efficiency Score */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-slate-600">Aktuelle Effizienz</p>
            <p className="text-2xl font-semibold">{Math.round(strategy.current_tax_efficiency_score * 100)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-600">Potentielle Effizienz</p>
            <p className="text-2xl font-semibold text-green-600">{Math.round(strategy.potential_tax_efficiency_score * 100)}%</p>
          </div>
        </div>

        <Progress value={strategy.current_tax_efficiency_score * 100} className="h-2" />
        <p className="text-xs text-slate-600 text-center">
          Verbesserungspotential: {efficiencyGap.toFixed(1)}%
        </p>

        <Tabs defaultValue="strategies" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="strategies" className="text-xs">Strategien</TabsTrigger>
            <TabsTrigger value="investment" className="text-xs">Investment</TabsTrigger>
            <TabsTrigger value="business" className="text-xs">Struktur</TabsTrigger>
            <TabsTrigger value="estate" className="text-xs">Nachlass</TabsTrigger>
          </TabsList>

          {/* Strategies Tab */}
          <TabsContent value="strategies" className="space-y-3">
            {strategy.strategies?.map((strat, idx) => (
              <Card key={idx} className="border border-slate-200">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{strat.title}</p>
                      <Badge variant="outline" className="text-xs mt-1">{strat.category}</Badge>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      +{strat.tax_savings_potential?.toLocaleString('de-DE')} €
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{strat.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <span className="text-slate-600">Komplexität:</span>
                      <p className="font-medium">{strat.implementation_complexity}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Zeitrahmen:</span>
                      <p className="font-medium">{strat.timeframe}</p>
                    </div>
                  </div>
                  {strat.required_actions && (
                    <div className="text-xs mt-2 pt-2 border-t border-slate-200">
                      <p className="font-semibold mb-1">Erforderliche Maßnahmen:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {strat.required_actions.map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Investment Tab */}
          <TabsContent value="investment" className="space-y-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="font-semibold text-sm mb-2">Aktuelle Allokation</p>
                <p className="text-xs text-slate-700 mb-3">
                  {strategy.investment_strategy?.current_allocation}
                </p>

                <p className="font-semibold text-sm mb-2 text-green-800">Optimierte Allokation</p>
                <p className="text-xs text-green-700 mb-3">
                  {strategy.investment_strategy?.tax_optimized_allocation}
                </p>

                <div className="bg-white rounded p-2">
                  <p className="text-xs text-slate-600">Geschätzte jährliche Einsparungen:</p>
                  <p className="text-lg font-semibold text-green-600">
                    +{strategy.investment_strategy?.estimated_annual_tax_savings?.toLocaleString('de-DE')} €
                  </p>
                </div>

                {strategy.investment_strategy?.implementation_steps && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="font-semibold text-xs mb-1">Implementierungsschritte:</p>
                    <ol className="text-xs space-y-1">
                      {strategy.investment_strategy.implementation_steps.map((step, i) => (
                        <li key={i}>{i + 1}. {step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Structure Tab */}
          <TabsContent value="business" className="space-y-3">
            <Card className="bg-slate-50">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Aktuelle Struktur</p>
                  <p className="font-semibold text-sm">
                    {strategy.business_structure_analysis?.current_structure || 'Keine Unternehmensstruktur'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Empfohlene Struktur</p>
                  <p className="font-semibold text-sm text-green-700">
                    {strategy.business_structure_analysis?.recommended_structure}
                  </p>
                </div>

                <div className="bg-green-50 rounded p-2 border border-green-200">
                  <p className="text-xs font-semibold mb-1">Jährliche Steuereinsparungen</p>
                  <p className="text-lg font-semibold text-green-600">
                    {strategy.business_structure_analysis?.annual_tax_savings?.toLocaleString('de-DE')} €
                  </p>
                </div>

                {strategy.business_structure_analysis?.advantages && (
                  <div className="text-xs">
                    <p className="font-semibold mb-1">Vorteile:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {strategy.business_structure_analysis.advantages.map((adv, i) => (
                        <li key={i}>{adv}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estate Planning Tab */}
          <TabsContent value="estate" className="space-y-3">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4 space-y-3">
                <p className="text-xs font-semibold">Aktuelle Situation</p>
                <p className="text-xs text-slate-700">
                  {strategy.estate_planning?.current_plan}
                </p>

                {strategy.estate_planning?.risks && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <AlertDescription className="text-xs text-red-800">
                      <p className="font-semibold mb-1">Identifizierte Risiken:</p>
                      <ul className="list-disc list-inside">
                        {strategy.estate_planning.risks.map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {strategy.estate_planning?.recommended_strategies && (
                  <div className="text-xs bg-green-50 rounded p-2 border border-green-200">
                    <p className="font-semibold mb-1">Empfohlene Strategien:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {strategy.estate_planning.recommended_strategies.map((strat, i) => (
                        <li key={i}>{strat}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Priority Actions */}
        {strategy.priority_actions && strategy.priority_actions.length > 0 && (
          <div className="border-t border-slate-200 pt-4">
            <p className="font-semibold text-sm mb-2">Prioritätsmaßnahmen</p>
            <div className="space-y-2">
              {strategy.priority_actions.slice(0, 3).map((action, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-slate-50 p-2 rounded">
                  <Badge className="mt-0.5">P{action.priority}</Badge>
                  <div className="flex-1 text-xs">
                    <p className="font-semibold">{action.action}</p>
                    <p className="text-slate-600">Fällig: {new Date(action.deadline).toLocaleDateString('de-DE')}</p>
                    <p className="text-green-700 font-medium mt-1">Erwarteter Vorteil: {action.expected_impact?.toLocaleString('de-DE')} €</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={handleGenerateStrategy}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Wird aktualisiert...' : 'Strategie aktualisieren'}
        </Button>
      </CardContent>
    </Card>
  );
}