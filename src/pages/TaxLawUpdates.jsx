import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, ExternalLink, CheckCircle2, Clock } from 'lucide-react';

export default function TaxLawUpdates() {
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [filterImpact, setFilterImpact] = useState('all');

  // Fetch tax law updates
  const { data: updates = [] } = useQuery({
    queryKey: ['taxLawUpdates', selectedCountry],
    queryFn: async () => {
      return await base44.entities.TaxLawUpdate.filter({
        country: selectedCountry,
        is_active: true
      }, '-effective_date') || [];
    }
  });

  const filteredUpdates = updates.filter(u => {
    if (filterImpact === 'all') return true;
    return u.impact_level === filterImpact;
  });

  const impactColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    high: 'bg-red-100 text-red-800 border-red-300'
  };

  const categoryEmojis = {
    income_tax: '💰',
    capital_gains: '📈',
    wealth_tax: '🏦',
    property_tax: '🏠',
    deduction: '📉',
    credit: '✨',
    deadline: '⏰'
  };

  const countryNames = { AT: '🇦🇹 Österreich', CH: '🇨🇭 Schweiz', DE: '🇩🇪 Deutschland' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Tax Law Updates & Changes</h1>
        <p className="text-slate-500 mt-1">Aktualisierungen der Steuergesetzgebung in Deutschland, Österreich & Schweiz</p>
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
          <label className="text-sm font-medium">Impact Level</label>
          <Select value={filterImpact} onValueChange={setFilterImpact}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle ({updates.length})</SelectItem>
              <SelectItem value="low">🟢 Niedrig ({updates.filter(u => u.impact_level === 'low').length})</SelectItem>
              <SelectItem value="medium">🟡 Mittel ({updates.filter(u => u.impact_level === 'medium').length})</SelectItem>
              <SelectItem value="high">🔴 Hoch ({updates.filter(u => u.impact_level === 'high').length})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={impactColors['high']}>
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Hohe Auswirkung</p>
            <p className="text-2xl font-bold mt-2">{updates.filter(u => u.impact_level === 'high').length}</p>
          </CardContent>
        </Card>
        <Card className={impactColors['medium']}>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Mittlere Auswirkung</p>
            <p className="text-2xl font-bold mt-2">{updates.filter(u => u.impact_level === 'medium').length}</p>
          </CardContent>
        </Card>
        <Card className={impactColors['low']}>
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Niedrige Auswirkung</p>
            <p className="text-2xl font-bold mt-2">{updates.filter(u => u.impact_level === 'low').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Important Alert */}
      {updates.filter(u => u.impact_level === 'high').length > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>Wichtig:</strong> Es gibt {updates.filter(u => u.impact_level === 'high').length} Änderung(en) mit hoher Auswirkung. 
            Bitte überprüfen Sie diese sorgfältig und passen Sie Ihre Steuerplanung entsprechend an.
          </AlertDescription>
        </Alert>
      )}

      {/* Updates List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Alle ({filteredUpdates.length})</TabsTrigger>
          <TabsTrigger value="high">Hoch ({filteredUpdates.filter(u => u.impact_level === 'high').length})</TabsTrigger>
          <TabsTrigger value="medium">Mittel ({filteredUpdates.filter(u => u.impact_level === 'medium').length})</TabsTrigger>
          <TabsTrigger value="low">Niedrig ({filteredUpdates.filter(u => u.impact_level === 'low').length})</TabsTrigger>
        </TabsList>

        {['all', 'high', 'medium', 'low'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
            {(tab === 'all' ? filteredUpdates : filteredUpdates.filter(u => u.impact_level === tab)).map(update => (
              <Card key={update.id} className={`border-l-4 ${
                update.impact_level === 'high' ? 'border-l-red-500 bg-red-50' :
                update.impact_level === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
                'border-l-blue-500 bg-blue-50'
              }`}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {/* Title & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{categoryEmojis[update.category] || '📋'}</span>
                          <h3 className="font-bold text-lg">{update.title}</h3>
                        </div>
                        <p className="text-sm text-slate-700">{update.description}</p>
                      </div>
                      <Badge className={impactColors[update.impact_level]}>
                        {update.impact_level.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 text-xs">Kategorie</p>
                        <p className="font-semibold capitalize">{update.category.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Gültig ab</p>
                        <p className="font-semibold">{new Date(update.effective_date).toLocaleDateString('de-DE')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Quelle</p>
                        <p className="font-semibold text-blue-600">{update.source}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Betroffen</p>
                        <p className="font-semibold">{(update.affected_entities || []).length} Bereiche</p>
                      </div>
                    </div>

                    {/* Affected Entities */}
                    {update.affected_entities?.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-slate-600 mb-2">🎯 Betroffene Bereiche:</p>
                        <div className="flex flex-wrap gap-2">
                          {update.affected_entities.map(entity => (
                            <Badge key={entity} variant="outline" className="text-xs">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Change Details */}
                    {update.change_details && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-slate-600 mb-2">📊 Details der Änderung:</p>
                        <div className="bg-white p-2 rounded text-xs space-y-1 font-mono">
                          {Object.entries(update.change_details).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-slate-600">{key}:</span>
                              <span className="font-semibold">{JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {update.source_url && (
                      <Button
                        className="w-full gap-2 mt-3 bg-blue-600 hover:bg-blue-700"
                        onClick={() => window.open(update.source_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" /> Offizielle Quelle
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {(tab === 'all' ? filteredUpdates : filteredUpdates.filter(u => u.impact_level === tab)).length === 0 && (
              <Card className="text-center py-8 text-slate-500">
                Keine Updates für diese Filter
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Info Card */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Informationen zu Tax Law Updates</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-700">
          <p>✓ Alle Änderungen sind mit ihrem offiziellen Gültigkeitsdatum gekennzeichnet</p>
          <p>✓ "Impact Level" zeigt die Auswirkung auf Ihr Steuerergebnis</p>
          <p>✓ "Betroffene Bereiche" listet relevante Steuerkategorien auf</p>
          <p>✓ Consulten Sie einen Steuerberater für detaillierte Auswirkungen auf Ihre Situation</p>
        </CardContent>
      </Card>
    </div>
  );
}