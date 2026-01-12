import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from 'lucide-react';

export default function QuickTenantDialog({ open, onOpenChange, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    anrede: 'Herr',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    aktiv: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      anrede: 'Herr',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      aktiv: true
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <DialogTitle>Schnell-Erfassung Mieter</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Anrede *</Label>
              <Select value={formData.anrede} onValueChange={v => setFormData({...formData, anrede: v})}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                  <SelectItem value="Divers">Divers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Vorname *</Label>
              <Input
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
                placeholder="Max"
                required
                className="h-9"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Nachname *</Label>
            <Input
              value={formData.last_name}
              onChange={e => setFormData({...formData, last_name: e.target.value})}
              placeholder="Mustermann"
              required
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs">E-Mail</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="max@beispiel.de"
              className="h-9"
            />
          </div>

          <div>
            <Label className="text-xs">Telefon</Label>
            <Input
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="0171 1234567"
              className="h-9"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <p className="text-xs text-slate-600">
              <strong>Tipp:</strong> Weitere Details können Sie nach der Erstellung auf der Mieter-Detailseite ergänzen (SCHUFA, Beschäftigung, SEPA-Mandat, etc.).
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700 h-9">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mieter anlegen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}