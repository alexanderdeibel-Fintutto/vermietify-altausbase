import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Lightbulb, Clock, Zap } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxPlanningAdvisor() {
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [completedStrategies, setCompletedStrategies] = useState(new Set());

  // Generate tax planning strategies
  const { data: planningData = {}, isLoading } = useQuery({
    queryKey: ['taxPlanningStrategy', selectedCountry, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxPlanningStrategy', {
        country: selectedCountry,
        taxYear
      });
      return response.data;
    }
  });

  const filteredStrategies = (planningData.strategies || []).filter(strategy => {
    if (filterPriority !== 'all' && strategy.priority !== filterPriority) return false;
    if (filterDifficulty !== 'all' && strategy.difficulty !== filterDifficulty) return false;
    return true;
  });

  const completionPercentage = (completedStrategies.size / (planningData.strategies?.length || 1)) * 100;

  const priorityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-blue-100 text-blue-800 border-blue-300'
  };

  const difficultyEmojis = {
    easy: '✅',
    medium: '⚠️',
    hard: '🔴'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Tax Planning Advisor</h1>
        <p className="text-slate-500 mt-1">Personalisierte Steueroptimierungsstrategien für Ihr Land</p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Land</label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(CURRENT_YEAR - 1)}>{CURRENT_YEAR - 1}</SelectItem>
              <SelectItem value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analysiere Optionen...</div>
      ) : planningData.strategies ? (
        <>
          {/* Overall Savings Alert */}
          <Alert className="border-green-300 bg-green-50">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Potenzielle Einsparungen:</strong> €{planningData.total_potential_savings?.toLocaleString('de-DE') || 0} 
              durch Implementierung aller Strategien
            </AlertDescription>
          </Alert>

          {/* Progress Overview */}
          <Card className="border-blue-300 bg-blue-50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">Umsetzungsfortschritt</p>
                  <Badge>{Math.round(completionPercentage)}%</Badge>
                </div>
                <Progress value={completionPercentage} className="h-2" />
                <div className="text-sm text-slate-600">
                  {completedStrategies.size} von {planningData.strategies?.length || 0} Strategien umgesetzt
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto text-red-600 mb-2" />
                <p className="text-sm text-slate-600">Hohe Priorität</p>
                <p className="text-3xl font-bold">{planningData.summary?.high_priority || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Lightbulb className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                <p className="text-sm text-slate-600">Mittlere Priorität</p>
                <p className="text-3xl font-bold">{planningData.summary?.medium_priority || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Zap className="w-6 h-6 mx-auto text-green-600 mb-2" />
                <p className="text-sm text-slate-600">Einfach umsetzbar</p>
                <p className="text-3xl font-bold">{planningData.summary?.easy_to_implement || 0}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium">Nach Priorität filtern</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="high">Hohe Priorität</SelectItem>
                  <SelectItem value="medium">Mittlere Priorität</SelectItem>
                  <SelectItem value="low">Niedrige Priorität</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 max-w-xs">
              <label className="text-sm font-medium">Nach Schwierigkeit filtern</label>
              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Schwierigkeitsgrade</SelectItem>
                  <SelectItem value="easy">Einfach</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="hard">Schwierig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Strategies Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Alle ({filteredStrategies.length})</TabsTrigger>
              <TabsTrigger value="high">Hohe Priorität ({filteredStrategies.filter(s => s.priority === 'high').length})</TabsTrigger>
              <TabsTrigger value="medium">Mittlere Priorität ({filteredStrategies.filter(s => s.priority === 'medium').length})</TabsTrigger>
              <TabsTrigger value="easy">Einfach ({filteredStrategies.filter(s => s.difficulty === 'easy').length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {filteredStrategies.map(strategy => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isCompleted={completedStrategies.has(strategy.id)}
                  onToggleComplete={() => {
                    const newSet = new Set(completedStrategies);
                    if (newSet.has(strategy.id)) {
                      newSet.delete(strategy.id);
                    } else {
                      newSet.add(strategy.id);
                    }
                    setCompletedStrategies(newSet);
                  }}
                  priorityColors={priorityColors}
                  difficultyEmojis={difficultyEmojis}
                />
              ))}
            </TabsContent>

            {['high', 'medium', 'easy'].map(tab => (
              <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
                {filteredStrategies
                  .filter(s => tab === 'easy' ? s.difficulty === 'easy' : s.priority === tab)
                  .map(strategy => (
                    <StrategyCard
                      key={strategy.id}
                      strategy={strategy}
                      isCompleted={completedStrategies.has(strategy.id)}
                      onToggleComplete={() => {
                        const newSet = new Set(completedStrategies);
                        if (newSet.has(strategy.id)) {
                          newSet.delete(strategy.id);
                        } else {
                          newSet.add(strategy.id);
                        }
                        setCompletedStrategies(newSet);
                      }}
                      priorityColors={priorityColors}
                      difficultyEmojis={difficultyEmojis}
                    />
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {/* Info Card */}
          <Card className="border-blue-300 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">💡 Hinweise zur Steuerplanung</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-slate-700">
              <p>✓ Priorisieren Sie "Hohe Priorität"-Strategien für maximale Einsparungen</p>
              <p>✓ "Einfach"-Strategien können sofort umgesetzt werden</p>
              <p>✓ Aktivieren Sie eine Strategie in den Checkboxen, um Ihren Fortschritt zu verfolgen</p>
              <p>✓ Konsultieren Sie einen Steuerberater vor der Umsetzung komplexer Strategien</p>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function StrategyCard({ strategy, isCompleted, onToggleComplete, priorityColors, difficultyEmojis }) {
  return (
    <Card
      className={`border-l-4 cursor-pointer transition-all ${
        strategy.priority === 'high'
          ? 'border-l-red-500 hover:bg-red-50'
          : strategy.priority === 'medium'
          ? 'border-l-yellow-500 hover:bg-yellow-50'
          : 'border-l-blue-500 hover:bg-blue-50'
      } ${isCompleted ? 'opacity-60' : ''}`}
      onClick={onToggleComplete}
    >
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <div className="flex-shrink-0 pt-1">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <div className="w-6 h-6 border-2 border-slate-300 rounded" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className={`font-bold ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                  {strategy.title}
                </h3>
                <p className="text-sm text-slate-600 mt-1">{strategy.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Badge className={priorityColors[strategy.priority]}>
                  {strategy.priority === 'high' ? '🔴' : strategy.priority === 'medium' ? '🟡' : '🟢'}
                  {' '}
                  {strategy.priority.toUpperCase()}
                </Badge>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {difficultyEmojis[strategy.difficulty]} {strategy.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs bg-green-50 text-green-800">
                💰 €{strategy.estimated_savings.toLocaleString('de-DE')} Ersparnisse
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Bis {new Date(strategy.deadline).toLocaleDateString('de-DE')}
              </Badge>
            </div>

            {/* Implementation */}
            <div className="bg-slate-50 p-2 rounded text-sm">
              <p className="text-slate-700">{strategy.implementation}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}