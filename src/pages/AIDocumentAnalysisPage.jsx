import React from 'react';
import AIDocumentAnalyzer from '@/components/documents/AIDocumentAnalyzer';
import { Sparkles } from 'lucide-react';

export default function AIDocumentAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">KI-Dokumentanalyse</h1>
          </div>
          <p className="text-slate-600">
            Lade Dokumente hoch und lass sie automatisch analysieren und kategorisieren
          </p>
        </div>

        <AIDocumentAnalyzer />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-900 mb-2">Unterstützte Kategorien</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• Mietverträge</li>
              <li>• Betriebskostenabrechnungen</li>
              <li>• Rechnungen</li>
              <li>• Reparaturanfragen</li>
              <li>• Zahlungsbestätigungen</li>
            </ul>
          </div>

          <div className="bg-white border border-blue-200 rounded-lg p-6">
            <h3 className="font-bold text-slate-900 mb-2">Automatische Features</h3>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>✓ Automatische Kategorisierung</li>
              <li>✓ Datenextraktion (für Rechnungen)</li>
              <li>✓ Tagging</li>
              <li>✓ Vertrauensgrad</li>
              <li>✓ Zusammenfassungen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}