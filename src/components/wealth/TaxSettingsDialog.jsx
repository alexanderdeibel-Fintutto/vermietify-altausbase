import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TaxSettingsDialog({ open, onOpenChange, userEmail }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    marital_status: 'LEDIG',
    church_member: false,
    church_tax_state: '',
    tax_id: '',
    guenstigerpruefung: false,
    personal_tax_rate: '',
  });

  const { data: settings } = useQuery({
    queryKey: ['tax_settings', userEmail],
    queryFn: () => userEmail ? base44.entities.UserTaxSettings.filter({ user_email: userEmail }) : Promise.resolve([]),
    enabled: !!userEmail && open,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserTaxSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax_settings'] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserTaxSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax_settings'] });
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (settings && settings.length > 0) {
      setFormData(settings[0]);
    }
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      user_email: userEmail,
      ...formData,
      personal_tax_rate: formData.personal_tax_rate ? parseFloat(formData.personal_tax_rate) : null,
    };

    if (settings && settings.length > 0) {
      updateMutation.mutate({ id: settings[0].id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Steuereinstellungen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="marital_status">Familienstand *</Label>
            <Select
              value={formData.marital_status}
              onValueChange={(v) => setFormData({ ...formData, marital_status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEDIG">Ledig</SelectItem>
                <SelectItem value="VERHEIRATET">Verheiratet</SelectItem>
                <SelectItem value="GESCHIEDEN">Geschieden</SelectItem>
                <SelectItem value="VERWITWET">Verwitwet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax_id">Steuer-ID</Label>
              <Input
                id="tax_id"
                placeholder="11 Ziffern"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="church_member">Kirchensteuerpflichtig?</Label>
              <Select
                value={formData.church_member ? 'ja' : 'nein'}
                onValueChange={(v) => setFormData({ ...formData, church_member: v === 'ja' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nein">Nein</SelectItem>
                  <SelectItem value="ja">Ja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.church_member && (
            <div>
              <Label htmlFor="church_tax_state">Bundesland für Kirchensteuer</Label>
              <Select value={formData.church_tax_state} onValueChange={(v) => setFormData({ ...formData, church_tax_state: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAYERN">Bayern</SelectItem>
                  <SelectItem value="BADEN_WUERTTEMBERG">Baden-Württemberg</SelectItem>
                  <SelectItem value="HESSEN">Hessen</SelectItem>
                  <SelectItem value="NORDRHEIN_WESTFALEN">Nordrhein-Westfalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="guenstigerpruefung">Günstigerprüfung?</Label>
              <Select
                value={formData.guenstigerpruefung ? 'ja' : 'nein'}
                onValueChange={(v) => setFormData({ ...formData, guenstigerpruefung: v === 'ja' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nein">Nein</SelectItem>
                  <SelectItem value="ja">Ja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.guenstigerpruefung && (
              <div>
                <Label htmlFor="personal_tax_rate">Persönlicher Steuersatz (%)</Label>
                <Input
                  id="personal_tax_rate"
                  type="number"
                  step="0.1"
                  max="25"
                  placeholder="z.B. 15.5"
                  value={formData.personal_tax_rate}
                  onChange={(e) => setFormData({ ...formData, personal_tax_rate: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}