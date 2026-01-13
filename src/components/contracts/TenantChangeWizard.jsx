import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TenantChangeWizard({ open = false, onOpenChange, unit = null }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    terminationDate: '',
    reason: '',
    depositReturnAmount: '',
    depositReturnDate: '',
    newTenantId: '',
    newTenantName: '',
    newTenantEmail: '',
    rentAmount: '',
    depositAmount: '',
  });

  const progress = (step / 5) * 100;

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔄 Mieterwechsel-Wizard</DialogTitle>
        </DialogHeader>

        <Progress value={progress} className="h-2" />

        {/* Step 1: Aktuellen Vertrag beenden */}
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Aktuellen Mietvertrag beenden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Kündigungsdatum *</Label>
                  <Input
                    type="date"
                    value={formData.terminationDate}
                    onChange={(e) =>
                      setFormData({ ...formData, terminationDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Kündigungsgrund</Label>
                  <Select
                    value={formData.reason}
                    onValueChange={(value) => setFormData({ ...formData, reason: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Grund auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_termination">Mieter-Kündigung</SelectItem>
                      <SelectItem value="landlord_termination">Vermieter-Kündigung</SelectItem>
                      <SelectItem value="mutual">Einvernehmliche Auflösung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Kautions-Rückzahlung */}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kautions-Rückzahlung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rückzahlungsbetrag (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.depositReturnAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, depositReturnAmount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Rückzahlungsdatum</Label>
                  <Input
                    type="date"
                    value={formData.depositReturnDate}
                    onChange={(e) =>
                      setFormData({ ...formData, depositReturnDate: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Neuer Mieter */}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Neuer Mieter</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mieter auswählen oder neu anlegen *</Label>
                  <Select value={formData.newTenantId} onValueChange={(value) => setFormData({ ...formData, newTenantId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mieter auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ Neuen Mieter anlegen</SelectItem>
                      <SelectItem value="existing_1">Max Mustermann</SelectItem>
                      <SelectItem value="existing_2">Erika Musterfrau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.newTenantId === 'new' && (
                  <>
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={formData.newTenantName}
                        onChange={(e) => setFormData({ ...formData, newTenantName: e.target.value })}
                        placeholder="Vorname Nachname"
                      />
                    </div>
                    <div>
                      <Label>E-Mail *</Label>
                      <Input
                        type="email"
                        value={formData.newTenantEmail}
                        onChange={(e) => setFormData({ ...formData, newTenantEmail: e.target.value })}
                        placeholder="mieter@example.com"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Neuer Vertrag */}
        {step === 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Neuer Mietvertrag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-900">
                    💡 Folgende Daten werden vom Vorgänger übernommen:
                  </p>
                  <ul className="text-xs text-blue-800 mt-2 space-y-1">
                    <li>• Kaltmiete</li>
                    <li>• Nebenkosten-Vorauszahlung</li>
                    <li>• Kaution</li>
                  </ul>
                </div>

                <div>
                  <Label>Kaltmiete (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.rentAmount}
                    onChange={(e) => setFormData({ ...formData, rentAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Kaution (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Zusammenfassung */}
        {step === 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 py-4">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="text-base">✅ Übersicht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">Kündigung:</p>
                  <p className="text-slate-600">{formData.terminationDate} ({formData.reason})</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Kautions-Rückzahlung:</p>
                  <p className="text-slate-600">{formData.depositReturnAmount}€ am {formData.depositReturnDate}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-900">Neuer Mieter:</p>
                  <p className="text-slate-600">
                    {formData.newTenantName || 'Ausgewählter Mieter'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            Zurück
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext} className="gap-2">
                Weiter <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                alert('Mieterwechsel abgeschlossen!');
                onOpenChange(false);
              }}>
                ✅ Abschließen
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}