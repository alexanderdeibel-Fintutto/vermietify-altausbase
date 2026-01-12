import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Checkbox } from '@/components/ui/checkbox';

export default function TaxSettingsDialog({ open, onOpenChange }) {
  const [formData, setFormData] = useState({
    marital_status: 'LEDIG',
    church_member: false,
    church_tax_state: 'BAYERN',
    tax_id: '',
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: settings } = useQuery({
    queryKey: ['taxSettings', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const data = await base44.entities.UserTaxSettings.filter({ user_email: user.email });
      return data[0] || null;
    },
    enabled: !!user?.email,
    onSuccess: (data) => {
      if (data) {
        setFormData({
          marital_status: data.marital_status || 'LEDIG',
          church_member: data.church_member || false,
          church_tax_state: data.church_tax_state || 'BAYERN',
          tax_id: data.tax_id || '',
        });
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserTaxSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.UserTaxSettings.update(settings.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxSettings'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      user_email: user.email,
      ...formData,
    };

    if (settings?.id) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Steuereinstellungen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="marital_status">Familienstand *</Label>
            <Select value={formData.marital_status} onValueChange={(value) => setFormData({ ...formData, marital_status: value })}>
              <SelectTrigger id="marital_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEDIG">Ledig</SelectItem>
                <SelectItem value="VERHEIRATET">Verheiratet</SelectItem>
                <SelectItem value="GESCHIEDEN">Geschieden</SelectItem>
                <SelectItem value="VERWITWET">Verwitwet</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-1">
              Sparerpauschbetrag: {formData.marital_status === 'VERHEIRATET' ? '1.200 EUR' : '801 EUR'}
            </p>
          </div>

          <div>
            <Label htmlFor="tax_id">Steuer-ID (11-stellig)</Label>
            <Input
              id="tax_id"
              placeholder="12345678901"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              maxLength="11"
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="church_member"
                checked={formData.church_member}
                onCheckedChange={(checked) => setFormData({ ...formData, church_member: checked })}
              />
              <Label htmlFor="church_member" className="font-normal">Kirchensteuerpflichtig</Label>
            </div>

            {formData.church_member && (
              <div>
                <Label htmlFor="church_state">Bundesland</Label>
                <Select value={formData.church_tax_state} onValueChange={(value) => setFormData({ ...formData, church_tax_state: value })}>
                  <SelectTrigger id="church_state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAYERN">Bayern (8%)</SelectItem>
                    <SelectItem value="BADEN_WUERTTEMBERG">Baden-Württemberg (8%)</SelectItem>
                    <SelectItem value="BERLIN">Berlin (8%)</SelectItem>
                    <SelectItem value="BRANDENBURG">Brandenburg (9%)</SelectItem>
                    <SelectItem value="BREMEN">Bremen (8%)</SelectItem>
                    <SelectItem value="HAMBURG">Hamburg (7%)</SelectItem>
                    <SelectItem value="HESSEN">Hessen (8%)</SelectItem>
                    <SelectItem value="MECKLENBURG_VORPOMMERN">Mecklenburg-Vorpommern (8%)</SelectItem>
                    <SelectItem value="NIEDERSACHSEN">Niedersachsen (8.2%)</SelectItem>
                    <SelectItem value="NORDRHEIN_WESTFALEN">Nordrhein-Westfalen (8.2%)</SelectItem>
                    <SelectItem value="RHEINLAND_PFALZ">Rheinland-Pfalz (8.2%)</SelectItem>
                    <SelectItem value="SAARLAND">Saarland (6.2%)</SelectItem>
                    <SelectItem value="SACHSEN">Sachsen (8.2%)</SelectItem>
                    <SelectItem value="SACHSEN_ANHALT">Sachsen-Anhalt (8.2%)</SelectItem>
                    <SelectItem value="SCHLESWIG_HOLSTEIN">Schleswig-Holstein (8%)</SelectItem>
                    <SelectItem value="THUERINGEN">Thüringen (8%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>Kapitalertragssteuer (KapErtSt):</strong> 25% + 5,5% Solidaritätszuschlag (+ Kirchensteuer falls zutreffend)
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}