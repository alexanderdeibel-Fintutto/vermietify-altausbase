import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, FileDown, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AnlageVForm({ buildingId, taxYear, onGenerated }) {
  const [loading, setLoading] = useState(false);
  const [anlageVId, setAnlageVId] = useState(null);
  const [einnahmen, setEinnahmen] = useState([]);
  const [kosten, setKosten] = useState([]);
  const [newEinnahme, setNewEinnahme] = useState({ description: '', category: 'COLD_RENT', amount: '' });
  const [newKosten, setNewKosten] = useState({ description: '', category: 'REPAIR', amount: '' });

  useEffect(() => {
    loadData();
  }, [buildingId, taxYear]);

  const loadData = async () => {
    try {
      const anlageVList = await base44.entities.AnlageV.filter({
        building_id: buildingId,
        tax_year: taxYear
      });

      if (anlageVList.length) {
        const id = anlageVList[0].id;
        setAnlageVId(id);

        const [einnahmenData, kostenData] = await Promise.all([
          base44.entities.AnlageVEinnahmen.filter({ anlage_v_id: id }),
          base44.entities.AnlageVWerbungskosten.filter({ anlage_v_id: id })
        ]);

        setEinnahmen(einnahmenData);
        setKosten(kostenData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const createAnlageV = async () => {
    try {
      const anlageV = await base44.entities.AnlageV.create({
        building_id: buildingId,
        tax_year: taxYear,
        status: 'DRAFT'
      });
      setAnlageVId(anlageV.id);
      toast.success('Anlage V erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const addEinnahme = async () => {
    if (!anlageVId) {
      await createAnlageV();
      return;
    }

    if (!newEinnahme.description || !newEinnahme.amount) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      const entry = await base44.entities.AnlageVEinnahmen.create({
        anlage_v_id: anlageVId,
        description: newEinnahme.description,
        category: newEinnahme.category,
        amount: parseFloat(newEinnahme.amount)
      });
      setEinnahmen([...einnahmen, entry]);
      setNewEinnahme({ description: '', category: 'COLD_RENT', amount: '' });
      toast.success('Einnahme hinzugefügt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const addKosten = async () => {
    if (!anlageVId) {
      await createAnlageV();
      return;
    }

    if (!newKosten.description || !newKosten.amount) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      const entry = await base44.entities.AnlageVWerbungskosten.create({
        anlage_v_id: anlageVId,
        description: newKosten.description,
        category: newKosten.category,
        amount: parseFloat(newKosten.amount)
      });
      setKosten([...kosten, entry]);
      setNewKosten({ description: '', category: 'REPAIR', amount: '' });
      toast.success('Kosten hinzugefügt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const deleteEinnahme = async (id) => {
    try {
      await base44.entities.AnlageVEinnahmen.delete(id);
      setEinnahmen(einnahmen.filter(e => e.id !== id));
      toast.success('Gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const deleteKosten = async (id) => {
    try {
      await base44.entities.AnlageVWerbungskosten.delete(id);
      setKosten(kosten.filter(k => k.id !== id));
      toast.success('Gelöscht');
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const handleGenerate = async () => {
    if (!anlageVId) {
      toast.error('Bitte erst Einnahmen/Kosten hinzufügen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateAnlageV', {
        buildingId,
        taxYear
      });
      toast.success('Anlage V berechnet');
      onGenerated?.(response.data);
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!anlageVId) {
      toast.error('Bitte erst Anlage V berechnen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateAnlageVPDF', {
        anlageVId
      });
      
      // Download PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AnlageV_${taxYear}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('PDF heruntergeladen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportDATEV = async () => {
    if (!anlageVId) {
      toast.error('Bitte erst Anlage V berechnen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('exportAnlageVDATEV', {
        anlageVId
      });
      
      // Download CSV
      const blob = new Blob([response.data], { type: 'text/csv; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AnlageV_DATEV_${taxYear}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast.success('DATEV-Export heruntergeladen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalEinnahmen = einnahmen.reduce((sum, e) => sum + e.amount, 0);
  const totalKosten = kosten.reduce((sum, k) => sum + k.amount, 0);

  return (
    <div className="space-y-6">
      {/* Einnahmen */}
      <Card>
        <CardHeader>
          <CardTitle>Einnahmen aus Vermietung (Zeile 1-8)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {einnahmen.map((e) => (
              <div key={e.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{e.description}</p>
                  <p className="text-sm text-gray-600">{e.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">€{e.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                  <button onClick={() => deleteEinnahme(e.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Input
                value={newEinnahme.description}
                onChange={(e) => setNewEinnahme({ ...newEinnahme, description: e.target.value })}
                placeholder="z.B. Kaltmiete WE 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Typ</label>
                <select
                  value={newEinnahme.category}
                  onChange={(e) => setNewEinnahme({ ...newEinnahme, category: e.target.value })}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="COLD_RENT">Kaltmiete</option>
                  <option value="WARM_RENT">Warmmiete</option>
                  <option value="HEATING">Heizung</option>
                  <option value="WATER">Wasser</option>
                  <option value="PARKING">Parkplatz</option>
                  <option value="STORAGE">Lagerraum</option>
                  <option value="OTHER">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Betrag (€)</label>
                <Input
                  type="number"
                  value={newEinnahme.amount}
                  onChange={(e) => setNewEinnahme({ ...newEinnahme, amount: e.target.value })}
                  step="0.01"
                />
              </div>
            </div>
            <Button onClick={addEinnahme} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Einnahme hinzufügen
            </Button>
          </div>

          <div className="bg-blue-50 p-3 rounded font-semibold">
            Summe Einnahmen: €{totalEinnahmen.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Werbungskosten */}
      <Card>
        <CardHeader>
          <CardTitle>Werbungskosten (Zeile 9-27)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {kosten.map((k) => (
              <div key={k.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{k.description}</p>
                  <p className="text-sm text-gray-600">{k.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">€{k.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}</p>
                  <button onClick={() => deleteKosten(k.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Input
                value={newKosten.description}
                onChange={(e) => setNewKosten({ ...newKosten, description: e.target.value })}
                placeholder="z.B. Reparatur Dach"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Kostenart</label>
                <select
                  value={newKosten.category}
                  onChange={(e) => setNewKosten({ ...newKosten, category: e.target.value })}
                  className="w-full px-2 py-1 border rounded"
                >
                  <option value="REPAIR">Reparatur</option>
                  <option value="MAINTENANCE">Wartung</option>
                  <option value="UTILITIES">Betriebskosten</option>
                  <option value="INSURANCE">Versicherung</option>
                  <option value="TAX">Grundsteuer</option>
                  <option value="INTEREST">Zinskosten</option>
                  <option value="MANAGEMENT">Verwaltung</option>
                  <option value="CLEANING">Reinigung</option>
                  <option value="MISC">Sonstiges</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Betrag (€)</label>
                <Input
                  type="number"
                  value={newKosten.amount}
                  onChange={(e) => setNewKosten({ ...newKosten, amount: e.target.value })}
                  step="0.01"
                />
              </div>
            </div>
            <Button onClick={addKosten} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" /> Kosten hinzufügen
            </Button>
          </div>

          <div className="bg-red-50 p-3 rounded font-semibold">
            Summe Werbungskosten: €{totalKosten.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
          </div>
        </CardContent>
      </Card>

      {/* Summary & Generate */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-lg">
              <span>Gewinn/Verlust:</span>
              <span className={totalEinnahmen - totalKosten >= 0 ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>
                €{(totalEinnahmen - totalKosten).toLocaleString('de-DE', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Berechnen
            </Button>
            <Button onClick={handleGeneratePDF} disabled={loading || !anlageVId} variant="outline">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button onClick={handleExportDATEV} disabled={loading || !anlageVId} variant="outline">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Share2 className="w-4 h-4 mr-2" />
              DATEV
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}