import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  AlertTriangle, CheckCircle2, FileText, Download, Send, Eye, Copy, Trash2, RotateCcw
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxReturnFilingManager() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedCountry, setSelectedCountry] = useState('DE');
  const queryClient = useQueryClient();

  // Fetch filings
  const { data: filings = [] } = useQuery({
    queryKey: ['taxFilings'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return await base44.entities.TaxFiling.filter({
        user_email: user.email
      }, '-tax_year') || [];
    }
  });

  // Generate return mutation
  const { mutate: generateReturn, isLoading: isGenerating } = useMutation({
    mutationFn: (data) =>
      base44.functions.invoke('generateTaxReturnDocument', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxFilings'] });
    }
  });

  // Submit mutation
  const { mutate: submitFiling, isLoading: isSubmitting } = useMutation({
    mutationFn: (filingId) =>
      base44.entities.TaxFiling.update(filingId, { status: 'submitted' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxFilings'] });
    }
  });

  const handleGenerateReturn = () => {
    generateReturn({
      country: selectedCountry,
      taxYear: selectedYear
    });
  };

  const handleSubmitReturn = (filingId) => {
    submitFiling(filingId);
  };

  const currentYearFilings = filings.filter(f => f.tax_year === selectedYear);
  const countryFilings = filings.filter(f => f.country === selectedCountry);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-300';
      case 'submitted':
        return 'bg-blue-50 border-blue-300';
      case 'prepared':
        return 'bg-yellow-50 border-yellow-300';
      case 'draft':
        return 'bg-slate-50 border-slate-300';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'submitted':
        return '📤';
      case 'prepared':
        return '📋';
      case 'draft':
        return '📝';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📤 Tax Return Filing Manager</h1>
        <p className="text-slate-500 mt-1">Verwalten, generieren und reichen Ihre Steuererklärungen ein</p>
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
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-6">
          <Button
            onClick={handleGenerateReturn}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            {isGenerating ? '⏳' : '📋'} Steuererklärung generieren
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Dieses Jahr ({currentYearFilings.length})</TabsTrigger>
          <TabsTrigger value="country">Land: {selectedCountry} ({countryFilings.length})</TabsTrigger>
          <TabsTrigger value="submitted">Eingereicht</TabsTrigger>
          <TabsTrigger value="archive">Archiv</TabsTrigger>
        </TabsList>

        {/* Current Year */}
        <TabsContent value="current" className="space-y-4 mt-4">
          {currentYearFilings.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-slate-500 mb-4">Keine Steuererklärungen für {selectedYear}</p>
              <Button onClick={handleGenerateReturn} className="bg-blue-600 hover:bg-blue-700">
                Neue Steuererklärung erstellen
              </Button>
            </Card>
          ) : (
            currentYearFilings.map(filing => (
              <FilingCard
                key={filing.id}
                filing={filing}
                onSubmit={() => handleSubmitReturn(filing.id)}
                isSubmitting={isSubmitting}
              />
            ))
          )}
        </TabsContent>

        {/* By Country */}
        <TabsContent value="country" className="space-y-4 mt-4">
          {countryFilings.length === 0 ? (
            <Card className="text-center py-8 text-slate-500">
              Keine Steuererklärungen für {selectedCountry}
            </Card>
          ) : (
            countryFilings.map(filing => (
              <FilingCard
                key={filing.id}
                filing={filing}
                onSubmit={() => handleSubmitReturn(filing.id)}
                isSubmitting={isSubmitting}
              />
            ))
          )}
        </TabsContent>

        {/* Submitted */}
        <TabsContent value="submitted" className="space-y-4 mt-4">
          {filings
            .filter(f => f.status === 'submitted' || f.status === 'completed')
            .map(filing => (
              <FilingCard
                key={filing.id}
                filing={filing}
                onSubmit={() => handleSubmitReturn(filing.id)}
                isSubmitting={isSubmitting}
              />
            ))}
          {filings.filter(f => f.status === 'submitted' || f.status === 'completed').length === 0 && (
            <Card className="text-center py-8 text-slate-500">
              Keine eingereichten Steuererklärungen
            </Card>
          )}
        </TabsContent>

        {/* Archive */}
        <TabsContent value="archive" className="space-y-4 mt-4">
          {filings
            .filter(f => f.status === 'completed')
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .map(filing => (
              <FilingCard
                key={filing.id}
                filing={filing}
                onSubmit={() => handleSubmitReturn(filing.id)}
                isSubmitting={isSubmitting}
                isArchived
              />
            ))}
          {filings.filter(f => f.status === 'completed').length === 0 && (
            <Card className="text-center py-8 text-slate-500">
              Kein Archiv vorhanden
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Filing Information */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Filing Manager Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>✓ Automatische Generierung von Steuererklärungen aus gesammelten Daten</p>
          <p>✓ Mehrländer-Unterstützung (AT, CH, DE) mit lokalen Formularen</p>
          <p>✓ Tracking von Einreichungen und Bestätigungen</p>
          <p>✓ Historisches Archiv aller eingereichten Erklärungen</p>
          <p>✓ Automatische Amendments bei Datenupdates</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FilingCard({ filing, onSubmit, isSubmitting, isArchived }) {
  const statusColors = {
    draft: 'bg-slate-100 text-slate-800',
    prepared: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800'
  };

  const statusLabels = {
    draft: 'Entwurf',
    prepared: 'Vorbereitet',
    submitted: 'Eingereicht',
    completed: 'Abgeschlossen'
  };

  return (
    <Card className="border-2">
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl">
                {filing.country === 'DE' ? '🇩🇪' : filing.country === 'AT' ? '🇦🇹' : '🇨🇭'}
              </div>
              <div>
                <h3 className="font-semibold">
                  Steuererklärung {filing.country} {filing.tax_year}
                </h3>
                <p className="text-sm text-slate-600">
                  {filing.filing_type.charAt(0).toUpperCase() + filing.filing_type.slice(1)}
                </p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="my-3">
              <div className="flex justify-between mb-1 text-sm">
                <span className="text-slate-700">Fertigstellung</span>
                <span className="font-semibold">{filing.completion_percentage || 0}%</span>
              </div>
              <Progress value={filing.completion_percentage || 0} />
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <Badge className={statusColors[filing.status]}>
                {statusLabels[filing.status]}
              </Badge>
              <span className="text-xs text-slate-500">
                Erstellt: {new Date(filing.created_date).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!isArchived && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={filing.status === 'submitted' || filing.status === 'completed'}
                >
                  <Eye className="w-3 h-3" /> Vorschau
                </Button>
                {filing.status === 'prepared' && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 gap-1"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                  >
                    <Send className="w-3 h-3" /> Einreichen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Download className="w-3 h-3" /> PDF
                </Button>
              </>
            )}
            {isArchived && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" /> Duplizieren
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        {filing.filing_data && (
          <div className="text-xs text-slate-600 border-t pt-3">
            <p>📋 {filing.required_documents?.filter(d => d.uploaded).length || 0} / {filing.required_documents?.length || 0} Dokumente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}