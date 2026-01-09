import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ASSET_CATEGORIES } from './assetCategories';

export default function AssetWizard({ open, onOpenChange, onSubmit, isLoading }) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    asset_subcategory: '',
    quantity: '',
    purchase_price: '',
    current_value: '',
    purchase_date: '',
    currency: 'EUR',
    isin: '',
    wkn: '',
    description: '',
    notes: ''
  });

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit({
      ...formData,
      asset_category: selectedCategory,
      quantity: parseFloat(formData.quantity),
      purchase_price: parseFloat(formData.purchase_price),
      current_value: parseFloat(formData.current_value)
    });
  };

  const category = selectedCategory ? ASSET_CATEGORIES[selectedCategory] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vermögenswert hinzufügen</DialogTitle>
        </DialogHeader>

        {/* Schritt 1: Kategorie wählen */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Wählen Sie die Vermögensart:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(ASSET_CATEGORIES).map(([key, cat]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                  onClick={() => handleCategorySelect(key)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{cat.label.split('')[0]}</div>
                    <h3 className="text-sm font-medium text-slate-900">{cat.label}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {cat.subcategories.slice(0, 2).join(', ')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Schritt 2: Details eingeben */}
        {step === 2 && category && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-light">Name/Bezeichnung</Label>
                <Input
                  placeholder="z.B. Apple Inc. Aktien"
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-light">ISIN (optional)</Label>
                <Input
                  placeholder="DE0007164600"
                  value={formData.isin}
                  onChange={(e) => handleFormChange('isin', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-light">Anzahl</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleFormChange('quantity', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-light">Kaufpreis pro Einheit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => handleFormChange('purchase_price', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-light">Aktueller Kurs pro Einheit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => handleFormChange('current_value', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-light">Kaufdatum</Label>
                <Input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => handleFormChange('purchase_date', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-light">Währung</Label>
                <Select value={formData.currency} onValueChange={(value) => handleFormChange('currency', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-light">Art</Label>
                <Select value={formData.asset_subcategory} onValueChange={(value) => handleFormChange('asset_subcategory', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {category.subcategories.map(sub => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-light">Notizen</Label>
              <Textarea
                placeholder="Weitere Informationen..."
                value={formData.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                className="mt-1 h-20"
              />
            </div>
          </div>
        )}

        {/* Schritt 3: Zusammenfassung */}
        {step === 3 && category && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Name:</span>
                  <div className="font-medium">{formData.name}</div>
                </div>
                <div>
                  <span className="text-slate-600">Kategorie:</span>
                  <div className="font-medium">{category.label}</div>
                </div>
                <div>
                  <span className="text-slate-600">Anzahl:</span>
                  <div className="font-medium">{formData.quantity}</div>
                </div>
                <div>
                  <span className="text-slate-600">Kaufpreis:</span>
                  <div className="font-medium">{formData.purchase_price} {formData.currency}</div>
                </div>
                <div>
                  <span className="text-slate-600">Aktueller Wert:</span>
                  <div className="font-medium text-green-600">
                    {(parseFloat(formData.quantity) * parseFloat(formData.current_value)).toFixed(2)} {formData.currency}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600">Gewinn/Verlust:</span>
                  <div className="font-medium">
                    {(parseFloat(formData.quantity) * (parseFloat(formData.current_value) - parseFloat(formData.purchase_price))).toFixed(2)} {formData.currency}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {step === 1 ? 'Abbrechen' : 'Zurück'}
          </Button>

          <Button
            onClick={() => {
              if (step === 3) handleSubmit();
              else setStep(step + 1);
            }}
            disabled={isLoading}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {step === 3 ? 'Erstellen' : 'Weiter'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}