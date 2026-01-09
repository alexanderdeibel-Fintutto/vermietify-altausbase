import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, TrendingUp, ExternalLink } from 'lucide-react';

export default function TaxLawUpdates() {
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const [selectedImpact, setSelectedImpact] = useState('all');

  // Fetch tax law updates
  const { data: updates = [] } = useQuery({
    queryKey: ['taxLawUpdates', selectedCountry],
    queryFn: async () => {
      return await base44.entities.TaxLawUpdate.filter(
        { country: selectedCountry, is_active: true },
        '-effective_date'
      ) || [];
    }
  });

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'income_tax':
        return '💰';
      case 'capital_gains':
        return '📈';
      case 'wealth_tax':
        return '💎';
      case 'property_tax':
        return '🏠';
      case 'deduction':
        return '📉';
      case 'credit':
        return '✓';
      case 'deadline':
        return '📅';
      default:
        return '📋';
    }
  };

  const filteredUpdates = selectedImpact === 'all'
    ? updates
    : updates.filter(u => u.impact_level?.toLowerCase() === selectedImpact.toLowerCase());

  const highImpactCount = updates.filter(u => u.impact_level?.toLowerCase() === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">⚖️ Tax Law Updates</h1>
        <p className="text-slate-500 mt-1">Aktuelle Steuergesetzänderungen in AT, CH & DE</p>
      </div>

      {/* High Impact Alert */}
      {highImpactCount > 0 && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            <strong>{highImpactCount} wichtige Änderung(en)</strong> - Bitte überprüfen Sie diese
          </AlertDescription>
        </Alert>
      )}

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
          <label className="text-sm font-medium">Auswirkungsgrad</label>
          <Select value={selectedImpact} onValueChange={setSelectedImpact}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="high">🔴 Hoch</SelectItem>
              <SelectItem value="medium">🟡 Mittel</SelectItem>
              <SelectItem value="low">🟢 Niedrig</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Updates List */}
      {filteredUpdates.length === 0 ? (
        <Card className="text-center py-8 text-slate-500">
          Keine Updates für diese Filter
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredUpdates.map(update => (
            <Card key={update.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getCategoryIcon(update.category)}</span>
                      <h3 className="font-semibold">{update.title}</h3>
                      <Badge className={getImpactColor(update.impact_level)}>
                        {update.impact_level?.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">{update.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600">Gültig ab</p>
                        <p className="font-medium">
                          {new Date(update.effective_date).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Kategorie</p>
                        <p className="font-medium">{update.category?.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Betroffen</p>
                        <p className="font-medium">
                          {(update.affected_entities || []).join(', ') || 'Alle'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600">Quelle</p>
                        <p className="font-medium">{update.source}</p>
                      </div>
                    </div>
                  </div>

                  {update.source_url && (
                    <a
                      href={update.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 hover:bg-slate-100 rounded"
                      title="Zur Quelle"
                    >
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Section */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">💡 Tipps</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-slate-700">
          <p>✓ Überprüfen Sie regelmäßig Updates für Ihr Land</p>
          <p>✓ Fokussieren Sie auf Updates mit hohem Auswirkungsgrad</p>
          <p>✓ Konsultieren Sie Ihren Steuerberater bei größeren Änderungen</p>
          <p>✓ Passen Sie Ihre Steuerstrategie an neue Gesetze an</p>
        </CardContent>
      </Card>
    </div>
  );
}