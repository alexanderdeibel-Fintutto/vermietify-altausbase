import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Building2, RefreshCw, Loader2 } from 'lucide-react';

export default function AfaAssetForm({ buildingId, onAssetCreated }) {
  const [loading, setLoading] = useState(false);
  const [determiningRate, setDeterminingRate] = useState(false);
  const [formData, setFormData] = useState({
    asset_type: 'BUILDING',
    description: '',
    acquisition_date: '',
    acquisition_cost: '',
    land_value: '0',
    afa_method: 'LINEAR',
    afa_rate: '2.0',
    afa_duration_years: '50'
  });

  const handleAssetTypeChange = async (value) => {
    setFormData({ ...formData, asset_type: value });
    if (value === 'BUILDING' || value === 'RENOVATION') {
      setDeterminingRate(true);
      try {
        const response = await base44.functions.invoke('determineAfaRate', {
          buildingId,
          assetType: value
        });
        setFormData(prev => ({
          ...prev,
          afa_rate: String(response.data.rate),
          afa_duration_years: String(response.data.duration)
        }));
        toast.success(`AfA-Satz ermittelt: ${response.data.reason}`);
      } catch {
        toast.error('Fehler bei AfA-Satz-Ermittlung');
      } finally {
        setDeterminingRate(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const asset = await base44.entities.AfaAsset.create({
        building_id: buildingId,
        asset_type: formData.asset_type,
        description: formData.description,
        acquisition_date: formData.acquisition_date,
        acquisition_cost: parseFloat(formData.acquisition_cost),
        land_value: parseFloat(formData.land_value) || 0,
        afa_method: formData.afa_method,
        afa_rate: parseFloat(formData.afa_rate),
        afa_duration_years: parseInt(formData.afa_duration_years),
        start_year: new Date().getFullYear(),
        status: 'ACTIVE'
      });

      // Abschreibungsplan erstellen
      await base44.functions.invoke('calculateAfaSchedule', {
        assetId: asset.id
      });

      toast.success('AfA-Anlage erstellt und Plan generiert');
      onAssetCreated?.(asset);
      setFormData({
        asset_type: 'BUILDING',
        description: '',
        acquisition_date: '',
        acquisition_cost: '',
        land_value: '0',
        afa_method: 'LINEAR',
        afa_rate: '2.0',
        afa_duration_years: '50'
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Neue AfA-Anlage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Anlage-Typ</label>
              <Select value={formData.asset_type} onValueChange={handleAssetTypeChange} disabled={determiningRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUILDING">Gebäude</SelectItem>
                  <SelectItem value="RENOVATION">Sanierung</SelectItem>
                  <SelectItem value="EQUIPMENT">Technische Anlagen</SelectItem>
                  <SelectItem value="LAND_IMPROVEMENT">Außenanlagen</SelectItem>
                  <SelectItem value="OTHER">Sonstiges</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="z.B. Gebäude Musterstraße 42"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Kaufdatum</label>
              <Input
                type="date"
                value={formData.acquisition_date}
                onChange={(e) => setFormData({ ...formData, acquisition_date: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Anschaffungskosten (EUR)</label>
              <Input
                type="number"
                value={formData.acquisition_cost}
                onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Grundstückswert (optional)</label>
            <Input
              type="number"
              value={formData.land_value}
              onChange={(e) => setFormData({ ...formData, land_value: e.target.value })}
              placeholder="0.00"
              step="0.01"
              hint="Wird von Anschaffungskosten abgezogen"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">AfA-Methode</label>
              <Select value={formData.afa_method} onValueChange={(v) => setFormData({ ...formData, afa_method: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LINEAR">Linear</SelectItem>
                  <SelectItem value="DEGRESSIVE">Degressiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">AfA-Satz (%)</label>
              <Input
                type="number"
                value={formData.afa_rate}
                onChange={(e) => setFormData({ ...formData, afa_rate: e.target.value })}
                step="0.1"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Dauer (Jahre)</label>
              <Input
                type="number"
                value={formData.afa_duration_years}
                onChange={(e) => setFormData({ ...formData, afa_duration_years: e.target.value })}
                min="1"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading || determiningRate} className="w-full">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            AfA-Anlage erstellen
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}