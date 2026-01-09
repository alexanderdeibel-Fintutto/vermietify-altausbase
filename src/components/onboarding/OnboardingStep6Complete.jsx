import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

export default function OnboardingStep6Complete({ formData }) {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-light mb-2">Sie sind bereit!</h2>
        <p className="text-slate-600">Ihr Steuerprofil wurde eingerichtet</p>
      </div>

      <Card className="p-6 bg-slate-50 border border-slate-200">
        <h3 className="font-semibold mb-4">Zusammenfassung</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Profil-Typ</span>
            <Badge variant="outline">
              {formData.profile_type === 'simple' ? 'Einfach' :
               formData.profile_type === 'intermediate' ? 'Mittel' :
               formData.profile_type === 'complex' ? 'Komplex' : 'Unternehmens'}
            </Badge>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-slate-600">Länder</span>
            <span className="font-medium">{formData.tax_jurisdictions.join(', ')}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-600">Einkommensquellen</span>
            <span className="font-medium">{formData.income_sources?.length || 0} ausgewählt</span>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Nächste Schritte:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Erkunden Sie den Steuer-AI Chatbot für Fragen</li>
          <li>✓ Laden Sie Belege hoch für automatische Analyse</li>
          <li>✓ Verbinden Sie Ihre Finanzkonten (optional)</li>
          <li>✓ Konfigurieren Sie Steuerregeln für Ihre Situation</li>
        </ul>
      </div>
    </div>
  );
}