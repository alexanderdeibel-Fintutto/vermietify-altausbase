import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, ExternalLink, Building, User, FileText } from 'lucide-react';

export default function DocumentAnalysisResults({ analysis, onApprove, onEdit }) {
  if (!analysis) return null;

  const confidence = analysis.confidence_score || 0;
  const isHighConfidence = confidence > 0.8;

  return (
    <div className="space-y-4">
      {/* Confidence Badge */}
      <div className="flex items-center justify-between">
        <Badge variant={isHighConfidence ? "default" : "outline"} className="text-sm">
          {isHighConfidence ? (
            <CheckCircle2 className="w-4 h-4 mr-1" />
          ) : (
            <AlertCircle className="w-4 h-4 mr-1" />
          )}
          Konfidenz: {(confidence * 100).toFixed(0)}%
        </Badge>
        <Badge variant="outline">
          {analysis.document_type === 'invoice' && '🧾 Rechnung'}
          {analysis.document_type === 'receipt' && '🧾 Beleg'}
          {analysis.document_type === 'contract' && '📋 Vertrag'}
          {analysis.document_type === 'protocol' && '📝 Protokoll'}
        </Badge>
      </div>

      {/* Extracted Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Extrahierte Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {analysis.amount > 0 && (
              <div>
                <p className="text-xs text-slate-600">Betrag</p>
                <p className="font-semibold text-lg">
                  {analysis.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            )}
            
            {analysis.date && (
              <div>
                <p className="text-xs text-slate-600">Datum</p>
                <p className="font-semibold">
                  {new Date(analysis.date).toLocaleDateString('de-DE')}
                </p>
              </div>
            )}

            {analysis.vendor_name && (
              <div className="col-span-2">
                <p className="text-xs text-slate-600">Lieferant/Absender</p>
                <p className="font-semibold">{analysis.vendor_name}</p>
              </div>
            )}

            {analysis.invoice_number && (
              <div>
                <p className="text-xs text-slate-600">Belegnummer</p>
                <p className="font-medium">{analysis.invoice_number}</p>
              </div>
            )}

            {analysis.category && (
              <div>
                <p className="text-xs text-slate-600">Kategorie</p>
                <Badge variant="secondary">{analysis.category}</Badge>
              </div>
            )}

            {analysis.tenant_name && (
              <div className="col-span-2">
                <p className="text-xs text-slate-600">Mieter</p>
                <p className="font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  {analysis.tenant_name}
                </p>
              </div>
            )}

            {analysis.building_id && (
              <div className="col-span-2">
                <p className="text-xs text-slate-600">Gebäude</p>
                <p className="font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  Zugeordnet
                </p>
              </div>
            )}
          </div>

          {/* Additional Details */}
          {analysis.extracted_data?.description && (
            <div className="pt-3 border-t">
              <p className="text-xs text-slate-600 mb-1">Beschreibung</p>
              <p className="text-sm text-slate-700">{analysis.extracted_data.description}</p>
            </div>
          )}

          {/* Line Items */}
          {analysis.extracted_data?.line_items?.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-xs text-slate-600 mb-2">Positionen</p>
              <div className="space-y-1">
                {analysis.extracted_data.line_items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-700">{item.description}</span>
                    <span className="font-medium">
                      {item.amount?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Created Info */}
      {analysis.financial_item_id && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Automatisch verbucht</p>
                <p className="text-sm text-green-700">
                  Eine Finanzbuchung wurde automatisch erstellt
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {!analysis.financial_item_id && (
          <Button onClick={onApprove} className="flex-1">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Genehmigen & Verbuchen
          </Button>
        )}
        <Button variant="outline" onClick={onEdit} className="flex-1">
          Bearbeiten
        </Button>
        {analysis.document_url && (
          <Button variant="outline" size="icon" asChild>
            <a href={analysis.document_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}