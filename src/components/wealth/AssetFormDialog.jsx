import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Loader2 } from 'lucide-react';
import { getAllCategories, getSubcategories } from './assetCategories';

export default function AssetFormDialog({ open, onOpenChange, onSubmit, initialData, isLoading }) {
  const [formData, setFormData] = React.useState(initialData || {});
  const [selectedCategory, setSelectedCategory] = React.useState(initialData?.asset_category || '');

  React.useEffect(() => {
    setFormData(initialData || {});
    setSelectedCategory(initialData?.asset_category || '');
  }, [initialData, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categoryOptions = getAllCategories();
  const subcategoryOptions = getSubcategories(selectedCategory);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Vermögenswert bearbeiten' : 'Neuen Vermögenswert hinzufügen'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-light">Kategorie *</Label>
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                setFormData({ ...formData, asset_category: value });
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-light">Unterkategorie</Label>
              <Select value={formData.asset_subcategory || ''} onValueChange={(value) => setFormData({ ...formData, asset_subcategory: value })}>
                <SelectTrigger>
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
          </div>

          <div>
            <Label className="text-xs font-light">Name *</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Apple Inc. Aktien"
              className="font-light"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-light">ISIN</Label>
              <Input
                value={formData.isin || ''}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
                placeholder="z.B. US0378331005"
                className="font-light"
              />
            </div>
            <div>
              <Label className="text-xs font-light">WKN</Label>
              <Input
                value={formData.wkn || ''}
                onChange={(e) => setFormData({ ...formData, wkn: e.target.value })}
                placeholder="z.B. 865985"
                className="font-light"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-light">Kaufdatum *</Label>
              <Input
                type="date"
                value={formData.purchase_date || ''}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="font-light"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-light">Währung</Label>
              <Select value={formData.currency || 'EUR'} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-light">Menge *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                placeholder="0"
                className="font-light"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-light">Kaufpreis (€) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchase_price || ''}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) })}
                placeholder="0.00"
                className="font-light"
                required
              />
            </div>
            <div>
              <Label className="text-xs font-light">Aktueller Wert (€) *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.current_value || ''}
                onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) })}
                placeholder="0.00"
                className="font-light"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-light">Notizen</Label>
            <Textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Persönliche Notizen..."
              rows={2}
              className="font-light text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="font-light">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 font-light">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initialData ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}