import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import TaxRuleEvaluator from '@/components/tax/TaxRuleEvaluator';
import TaxLawUpdateReview from '@/components/tax/TaxLawUpdateReview';

export default function TaxRuleAdmin() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [loadingMigration, setLoadingMigration] = useState(false);

  // Load data
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['taxRuleCategories'],
    queryFn: () => base44.entities.TaxRuleCategory.filter({ is_active: true })
  });

  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['taxConfigs'],
    queryFn: () => base44.entities.TaxConfig.filter({})
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['taxRules'],
    queryFn: () => base44.entities.TaxRule.filter({})
  });

  const { data: updates = [], isLoading: updatesLoading, refetch: refetchUpdates } = useQuery({
    queryKey: ['taxLawUpdates'],
    queryFn: () => base44.entities.TaxLawUpdate.filter({})
  });

  // Calculate stats
  const stats = useMemo(() => ({
    totalConfigs: configs.length,
    activeConfigs: configs.filter(c => c.is_active).length,
    totalRules: rules.length,
    activeRules: rules.filter(r => r.is_active).length,
    pendingUpdates: updates.filter(u => u.status === 'PENDING_REVIEW').length,
    detectedUpdates: updates.filter(u => u.status === 'DETECTED').length
  }), [configs, rules, updates]);

  // Filter updates
  const filteredUpdates = useMemo(() => {
    if (statusFilter === 'all') return updates;
    return updates.filter(u => u.status === statusFilter);
  }, [updates, statusFilter]);

  const handleMigrate = async () => {
    try {
      setLoadingMigration(true);
      const result = await base44.functions.invoke('migrateLegacyTaxRules', {});
      toast.success(`Migration abgeschlossen: ${result.data.results.configs_created} Configs, ${result.data.results.rules_created} Regeln`);
      queryClient.invalidateQueries({ queryKey: ['taxConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['taxRules'] });
    } catch (err) {
      toast.error('Migration fehlgeschlagen: ' + err.message);
    } finally {
      setLoadingMigration(false);
    }
  };

  const handleCheckUpdates = async () => {
    try {
      await base44.functions.invoke('fetchBGBLUpdates', {});
      await refetchUpdates();
      toast.success('BGBl aktualisiert');
    } catch (err) {
      toast.error('Fehler beim BGBl-Check: ' + err.message);
    }
  };

  const handleAnalyzeUpdates = async () => {
    try {
      await base44.functions.invoke('analyzeAllPendingUpdates', {});
      await refetchUpdates();
      toast.success('Alle Updates analysiert');
    } catch (err) {
      toast.error('Fehler bei Analyse: ' + err.message);
    }
  };

  const handleOpenReview = (update) => {
    setSelectedUpdate(update);
    setReviewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Steuer-Regelwerk Management</h1>
        <p className="text-slate-500 mt-1">Verwalten Sie Steuerregeln, Konfigurationen und Gesetzesänderungen</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Aktive Configs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{stats.activeConfigs}</div>
            <p className="text-xs text-slate-400 mt-1">von {stats.totalConfigs} gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Aktive Regeln</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{stats.activeRules}</div>
            <p className="text-xs text-slate-400 mt-1">von {stats.totalRules} gesamt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Zur Überprüfung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light text-orange-600">{stats.pendingUpdates}</div>
            <p className="text-xs text-slate-400 mt-1">Gesetzesänderungen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Erkannt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-light">{stats.detectedUpdates}</div>
            <p className="text-xs text-slate-400 mt-1">Neue Updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="configs">Configs ({stats.totalConfigs})</TabsTrigger>
          <TabsTrigger value="rules">Regeln ({stats.totalRules})</TabsTrigger>
          <TabsTrigger value="updates">Updates ({updates.length})</TabsTrigger>
          <TabsTrigger value="evaluator">Tester</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System-Verwaltung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 mb-2">Migrieren Sie hardcodierte Regeln in die neue Engine</p>
                <Button onClick={handleMigrate} disabled={loadingMigration}>
                  {loadingMigration ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Migriere...
                    </>
                  ) : (
                    'Legacy-Regeln migrieren'
                  )}
                </Button>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-slate-600 mb-2">Prüfen Sie das Bundesgesetzblatt auf neue Steueränderungen</p>
                <Button onClick={handleCheckUpdates} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  BGBl jetzt prüfen
                </Button>
              </div>
              <div className="border-t pt-3">
                <p className="text-sm text-slate-600 mb-2">Analysieren Sie alle erkannten Updates mit AI</p>
                <Button onClick={handleAnalyzeUpdates} variant="outline">
                  Alle Updates analysieren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configs */}
        <TabsContent value="configs">
          <Card>
            <CardHeader>
              <CardTitle>Steuerkonfigurationen</CardTitle>
            </CardHeader>
            <CardContent>
              {configsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 px-3">Key</th>
                        <th className="text-left py-2 px-3">Name</th>
                        <th className="text-left py-2 px-3">Wert</th>
                        <th className="text-left py-2 px-3">Typ</th>
                        <th className="text-left py-2 px-3">Gültig ab</th>
                        <th className="text-left py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configs.slice(0, 20).map(config => (
                        <tr key={config.id} className="border-b hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-xs">{config.config_key}</td>
                          <td className="py-2 px-3">{config.display_name}</td>
                          <td className="py-2 px-3 font-mono">{config.value}</td>
                          <td className="py-2 px-3"><Badge variant="outline">{config.value_type}</Badge></td>
                          <td className="py-2 px-3">{config.valid_from_tax_year}</td>
                          <td className="py-2 px-3">
                            {config.is_active ? (
                              <Badge variant="secondary">Aktiv</Badge>
                            ) : (
                              <Badge variant="outline">Inaktiv</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules */}
        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Steuerregeln</CardTitle>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="space-y-2">
                  {rules.slice(0, 15).map(rule => (
                    <Card key={rule.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-sm">{rule.display_name}</div>
                          <p className="text-xs text-slate-500 mt-1">{rule.rule_code}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{rule.rule_type}</Badge>
                            {rule.is_active ? (
                              <Badge variant="secondary" className="text-xs">Aktiv</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Inaktiv</Badge>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">ab {rule.valid_from_tax_year}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Updates */}
        <TabsContent value="updates" className="space-y-3">
          <div className="flex gap-2 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="DETECTED">Erkannt</SelectItem>
                <SelectItem value="ANALYZING">Analysiert wird</SelectItem>
                <SelectItem value="PENDING_REVIEW">Zur Überprüfung</SelectItem>
                <SelectItem value="IMPLEMENTED">Implementiert</SelectItem>
                <SelectItem value="REJECTED">Abgelehnt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {updatesLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <div className="space-y-2">
              {filteredUpdates.map(update => (
                <Card key={update.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-semibold">{update.title}</div>
                      <p className="text-sm text-slate-600 mt-1">{update.summary}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge variant="outline">{update.status}</Badge>
                        <Badge variant={update.relevance_score > 70 ? 'destructive' : 'secondary'}>
                          Relevanz: {update.relevance_score}%
                        </Badge>
                        {update.affected_tax_types?.map(type => (
                          <Badge key={type} variant="outline" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                    {update.status === 'PENDING_REVIEW' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenReview(update)}
                      >
                        Überprüfen
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Evaluator */}
        <TabsContent value="evaluator">
          <Card>
            <CardHeader>
              <CardTitle>Regel-Tester</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Testen Sie Regeln mit Beispieldaten</p>
            </CardHeader>
            <CardContent>
              <TaxRuleEvaluator />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <TaxLawUpdateReview 
        update={selectedUpdate}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        onApplied={() => refetchUpdates()}
      />
    </div>
  );
}