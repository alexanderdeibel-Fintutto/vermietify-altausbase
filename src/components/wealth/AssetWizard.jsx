import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { ASSET_CATEGORIES } from './assetCategories';
import { getSubcategories } from './assetCategories';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export default function AssetWizard({ open, onOpenChange, onSubmit, isLoading }) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    asset_category: '',
    asset_subcategory: '',
    name: '',
    isin: '',
    wkn: '',
    purchase_date: '',
    purchase_price: '',
    quantity: '',
    current_value: '',
    currency: 'EUR',
    notes: '',
  });
  const [documents, setDocuments] = useState([]);

  const handleCategorySelect = (categoryKey) => {
    const category = ASSET_CATEGORIES[categoryKey];
    setSelectedCategory(categoryKey);
    setFormData(prev => ({
      ...prev,
      asset_category: category.id,
      asset_subcategory: ''
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      documents: documents.map(doc => ({ name: doc.name, size: doc.size }))
    });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedCategory;
      case 2:
        return formData.name && formData.quantity && formData.purchase_price && 
               formData.current_value && formData.purchase_date;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const subcategoryOptions = getSubcategories(selectedCategory);
  const categoryObj = ASSET_CATEGORIES[selectedCategory];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vermögenswert hinzufügen</DialogTitle>
          <DialogDescription>
            Schritt {step} von 4: {step === 1 && 'Vermögensart wählen'}
            {step === 2 && 'Details eingeben'}
            {step === 3 && 'Dokumente hochladen (optional)'}
            {step === 4 && 'Zusammenfassung'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-96">
          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Wählen Sie die Vermögensart:</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(ASSET_CATEGORIES).map(([key, category]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all ${
                      selectedCategory === key
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:ring-2 hover:ring-slate-300'
                    }`}
                    onClick={() => handleCategorySelect(key)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <h3 className="font-light text-sm text-slate-900">{category.label}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-light">Name/Bezeichnung *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="z.B. Apple Inc. Aktien"
                  className="font-light mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-light">ISIN</Label>
                  <Input
                    value={formData.isin}
                    onChange={(e) => handleInputChange('isin', e.target.value)}
                    placeholder="z.B. US0378331005"
                    className="font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-light">WKN</Label>
                  <Input
                    value={formData.wkn}
                    onChange={(e) => handleInputChange('wkn', e.target.value)}
                    placeholder="z.B. 865985"
                    className="font-light mt-1"
                  />
                </div>
              </div>

              {subcategoryOptions.length > 0 && (
                <div>
                  <Label className="text-xs font-light">Unterkategorie</Label>
                  <Select
                    value={formData.asset_subcategory}
                    onValueChange={(value) => handleInputChange('asset_subcategory', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategoryOptions.map(sub => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-light">Kaufdatum *</Label>
                  <Input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => handleInputChange('purchase_date', e.target.value)}
                    className="font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-light">Menge *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="0.00"
                    className="font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-light">Währung</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(cur => (
                        <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-light">Kaufpreis pro Einheit ({formData.currency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => handleInputChange('purchase_price', e.target.value)}
                    placeholder="0.00"
                    className="font-light mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-light">Aktueller Wert ({formData.currency}) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.current_value}
                    onChange={(e) => handleInputChange('current_value', e.target.value)}
                    placeholder="0.00"
                    className="font-light mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-light">Notizen</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Persönliche Notizen..."
                  rows={2}
                  className="font-light text-sm mt-1"
                />
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Laden Sie optional Kaufbelege, Depotauszüge oder andere Dokumente hoch.
              </p>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleDocumentUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-sm text-slate-600">
                    <p className="font-light mb-1">Dateien hierher ziehen oder klicken zum Hochladen</p>
                    <p className="text-xs text-slate-500">PDF, JPG, PNG - max. 10 MB</p>
                  </div>
                </label>
              </div>
              {documents.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-light text-slate-900">{documents.length} Datei(en) ausgewählt:</p>
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded text-sm">
                      <span className="font-light">{doc.name}</span>
                      <button
                        onClick={() => setDocuments(docs => docs.filter((_, i) => i !== idx))}
                        className="text-red-600 hover:text-red-700 font-light"
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Summary */}
          {step === 4 && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-light text-slate-900">Zusammenfassung</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-600">Vermögensart:</span>
                  <span className="font-light">{categoryObj?.label}</span>
                  <span className="text-slate-600">Name:</span>
                  <span className="font-light">{formData.name}</span>
                  {formData.isin && (
                    <>
                      <span className="text-slate-600">ISIN:</span>
                      <span className="font-light">{formData.isin}</span>
                    </>
                  )}
                  <span className="text-slate-600">Menge:</span>
                  <span className="font-light">{formData.quantity}</span>
                  <span className="text-slate-600">Kaufpreis:</span>
                  <span className="font-light">
                    {parseFloat(formData.purchase_price).toLocaleString('de-DE')} {formData.currency}
                  </span>
                  <span className="text-slate-600">Gesamtwert:</span>
                  <span className="font-light text-green-600">
                    {(parseFloat(formData.quantity) * parseFloat(formData.purchase_price)).toLocaleString('de-DE')} {formData.currency}
                  </span>
                  {categoryObj?.steuer_formular && (
                    <>
                      <span className="text-slate-600">Steuerformular:</span>
                      <span className="font-light">{categoryObj.steuer_formular}</span>
                    </>
                  )}
                </div>
                {documents.length > 0 && (
                  <div className="pt-4 border-t border-slate-200">
                    <p className="text-sm font-light text-slate-600">{documents.length} Dokument(e) hochgeladen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between pt-6">
          <Button
            variant="outline"
            onClick={() => {
              if (step > 1) {
                setStep(step - 1);
              } else {
                onOpenChange(false);
              }
            }}
            className="font-light"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step === 1 ? 'Abbrechen' : 'Zurück'}
          </Button>

          <Button
            onClick={() => {
              if (step < 4) {
                setStep(step + 1);
              } else {
                handleSubmit();
              }
            }}
            disabled={!isStepValid() || isLoading}
            className="bg-slate-900 hover:bg-slate-800 font-light"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {step === 4 ? 'Hinzufügen' : 'Weiter'}
            {step < 4 && <ChevronRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}