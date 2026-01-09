import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MatchSuggestions from './MatchSuggestions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function InboxEditSheet({ item, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState(item);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.DocumentInbox.update(item.id, {
      status: 'approved',
      reviewed_by: 'current_user@example.com',
      reviewed_at: new Date().toISOString(),
      ...formData
    });
    setSaving(false);
    onSave();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dokument prüfen & bearbeiten</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-6 mt-6">
          {/* PDF Preview */}
          <div className="col-span-1 border rounded-lg p-4 bg-slate-50">
            <p className="text-sm font-medium mb-2">📄 Vorschau</p>
            <iframe
              src={item.original_pdf_url}
              className="w-full h-96 border rounded"
            />
          </div>

          {/* Form */}
          <div className="col-span-2 space-y-6">
            {/* Dokumenttyp */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Dokumenttyp</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.document_type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, document_type: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">🧾 Rechnung</SelectItem>
                    <SelectItem value="lease_contract">📋 Mietvertrag</SelectItem>
                    <SelectItem value="handover_protocol">🔑 Übergabeprotokoll</SelectItem>
                    <SelectItem value="property_tax">🏛️ Grundsteuer</SelectItem>
                    <SelectItem value="insurance">🛡️ Versicherung</SelectItem>
                    <SelectItem value="other">📄 Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Typ-spezifische Felder */}
            {formData.document_type === 'invoice' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Rechnungsdaten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Rechnungsnummer"
                      value={formData.invoice_number || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, invoice_number: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      value={formData.invoice_date || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, invoice_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Gesamtbetrag (€)"
                      type="number"
                      value={formData.total_amount || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_amount: parseFloat(e.target.value),
                        })
                      }
                    />
                    <Select
                      value={String(formData.tax_rate || 19)}
                      onValueChange={(val) =>
                        setFormData({ ...formData, tax_rate: parseInt(val) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="19">19%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    label="Lieferant"
                    value={formData.supplier_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_name: e.target.value })
                    }
                  />
                </CardContent>
              </Card>
            )}

            {formData.document_type === 'lease_contract' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Mietvertragsdaten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Mieter Vorname"
                      value={formData.tenant_first_name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tenant_first_name: e.target.value,
                        })
                      }
                    />
                    <Input
                      label="Mieter Nachname"
                      value={formData.tenant_last_name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tenant_last_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Input
                    label="Wohnungsbezeichnung"
                    value={formData.unit_identifier || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_identifier: e.target.value })
                    }
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      type="date"
                      label="Vertragsbeginn"
                      value={formData.contract_start_date || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contract_start_date: e.target.value,
                        })
                      }
                    />
                    <Input
                      type="number"
                      label="Kaltmiete (€)"
                      value={formData.base_rent || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          base_rent: parseFloat(e.target.value),
                        })
                      }
                    />
                    <Input
                      type="number"
                      label="Gesamtmiete (€)"
                      value={formData.total_rent || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_rent: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Match Suggestions */}
            <MatchSuggestions
              item={formData}
              selectedMatch={formData.matched_entity_id || 'new'}
              onSelectMatch={(val) =>
                setFormData({
                  ...formData,
                  matched_entity_id: val === 'new' ? null : val
                })
              }
            />

            {/* KI Analysis */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">📊 KI-Analyse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Typ-Erkennung</span>
                    <span>{Math.round(formData.ai_type_confidence || 0)}%</span>
                  </div>
                  <Progress
                    value={formData.ai_type_confidence || 0}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Datenextraktion</span>
                    <span>{Math.round(formData.ai_extraction_confidence || 0)}%</span>
                  </div>
                  <Progress
                    value={formData.ai_extraction_confidence || 0}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Optionen */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="create-booking"
                  checked={formData.create_booking !== false}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, create_booking: checked })
                  }
                />
                <label htmlFor="create-booking" className="text-sm">
                  Buchung erstellen
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is-signed"
                  checked={formData.ai_extracted_data?.is_signed || false}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      ai_extracted_data: {
                        ...formData.ai_extracted_data,
                        is_signed: checked,
                      },
                    })
                  }
                />
                <label htmlFor="is-signed" className="text-sm">
                  Als unterschrieben markieren
                </label>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-8">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Abbrechen
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setSaving(true);
              await base44.entities.DocumentInbox.update(item.id, {
                status: 'rejected',
                rejection_reason: 'Benutzer hat abgelehnt'
              });
              setSaving(false);
              onSave();
            }}
            disabled={saving}
          >
            ✗ Ablehnen
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saving}
          >
            {saving ? '⏳ Speichert...' : '✓ Bestätigen'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}