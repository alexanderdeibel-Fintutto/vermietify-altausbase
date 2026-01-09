import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const AVAILABLE_FORMS = {
  DE: [
    { id: 'hauptformular', name: 'Hauptantrag', description: 'Einkommensteuererklärung' },
    { id: 'anlage_so', name: 'Anlage SO', description: 'Einkünfte aus Vermietung/Verpachtung' },
    { id: 'anlage_kap', name: 'Anlage KAP', description: 'Einkünfte aus Kapitalvermögen' },
    { id: 'anlage_g', name: 'Anlage G', description: 'Einkünfte aus Gewerbebetrieb' },
    { id: 'anlage_e1c', name: 'Anlage E1c', description: 'Einkünfte aus freiberuflicher Tätigkeit' }
  ],
  AT: [
    { id: 'hauptformular', name: 'Steuererklärung', description: 'Einkommensteuererklärung' },
    { id: 'anlage_z', name: 'Anlage Z', description: 'Zinsen und Dividenden' },
    { id: 'anlage_v', name: 'Anlage V', description: 'Vermietung und Verpachtung' }
  ],
  CH: [
    { id: 'hauptformular', name: 'Steuererklärung', description: 'Selbstdeklaration' },
    { id: 'anlage_wz', name: 'Anhang WZ', description: 'Wirtschaftliche Tätigkeit' },
    { id: 'anlage_vm', name: 'Anhang VM', description: 'Vermögen und Schulden' }
  ]
};

export default function TaxFormLibrary() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [selectedForm, setSelectedForm] = useState('hauptformular');
  const [loading, setLoading] = useState(false);

  const { data: guidance = {}, isLoading } = useQuery({
    queryKey: ['taxFormGuidance', country, taxYear, selectedForm],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxFormGuidance', {
        country,
        taxYear,
        formType: selectedForm
      });
      return response.data?.guidance || {};
    },
    enabled: loading
  });

  const forms = AVAILABLE_FORMS[country] || [];
  const currentForm = forms.find(f => f.id === selectedForm);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📚 Steuerformular-Bibliothek</h1>
        <p className="text-slate-500 mt-1">Schritt-für-Schritt Anleitung zu Steuerformularen</p>
      </div>

      {/* Selection Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Formular auswählen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={loading}>
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
            <div>
              <label className="text-sm font-medium">Steuerjahr</label>
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Formular</label>
              <Select value={selectedForm} onValueChange={setSelectedForm} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {forms.map(form => (
                    <SelectItem key={form.id} value={form.id}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={() => setLoading(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '⏳ Wird geladen...' : 'Anleitung anzeigen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Anleitung wird geladen...</div>
      ) : loading && guidance.content ? (
        <>
          {/* Form Header */}
          {currentForm && (
            <Card className="border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold">{currentForm.name}</h2>
                <p className="text-slate-600 mt-1">{currentForm.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Overview */}
          {guidance.content.form_overview && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Übersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{guidance.content.form_overview}</p>
              </CardContent>
            </Card>
          )}

          {/* Prerequisites */}
          {(guidance.content.prerequisites || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">✓ Voraussetzungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {guidance.content.prerequisites.map((prereq, i) => (
                  <div key={i} className="text-sm p-2 bg-green-50 rounded flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    {prereq}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Required Documents */}
          {(guidance.content.required_documents || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  📋 Erforderliche Dokumente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {guidance.content.required_documents.map((doc, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {doc}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Line by Line Guide */}
          {(guidance.content.line_by_line_guide || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📝 Schritt-für-Schritt Anleitung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guidance.content.line_by_line_guide.map((line, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2">
                    <p className="font-medium text-sm">Zeile {i + 1}: {line.field}</p>
                    <p className="text-xs text-slate-600 mt-1">{line.instruction}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Common Mistakes */}
          {(guidance.content.common_mistakes || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ⚠️ Häufige Fehler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {guidance.content.common_mistakes.map((mistake, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {mistake}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Related Forms */}
          {(guidance.content.related_forms || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🔗 Verwandte Formulare</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {guidance.content.related_forms.map((form, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {form}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Filing Deadline */}
          {guidance.content.filing_deadline && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">📅 Abgabefrist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-bold">{guidance.content.filing_deadline}</p>
              </CardContent>
            </Card>
          )}

          {/* Follow-up Items */}
          {(guidance.content.follow_up_items || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📌 Nachfolgeaufgaben</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {guidance.content.follow_up_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-yellow-50 rounded flex gap-2">
                    <span className="font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie ein Formular aus und klicken Sie "Anleitung anzeigen"
        </div>
      )}
    </div>
  );
}