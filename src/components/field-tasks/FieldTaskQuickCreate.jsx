import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FieldTaskQuickCreate({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    task_category: 'objekt_stammdaten',
    task_type: '',
    title: '',
    description: '',
    building_id: '',
    priority: 'normal',
    created_via: 'manual'
  });

  const queryClient = useQueryClient();

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.FieldTask.create(data);
    },
    onSuccess: () => {
      toast.success('Aufgabe erstellt!');
      queryClient.invalidateQueries(['field-tasks']);
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createTaskMutation.mutate(formData);
  };

  const taskTypes = {
    'objekt_stammdaten': [
      { id: 'objektfotos_aktualisieren', label: 'Objektfotos aktualisieren' },
      { id: 'grundriss_abgleichen', label: 'Grundriss abgleichen/korrigieren' },
      { id: 'gebaeudezustand_dokumentieren', label: 'Gebäudezustand dokumentieren' },
      { id: 'fluchtwegeplan_pruefen', label: 'Notausgangs-/Fluchtwegeplan prüfen' },
      { id: 'hausnummern_erfassen', label: 'Hausnummern-/Klingelschild-Status' }
    ],
    'objekt_zaehler': [
      { id: 'hauptwasserzaehler_ablesen', label: 'Hauptwasserzähler ablesen' },
      { id: 'stromzaehler_allgemein_ablesen', label: 'Stromzähler Allgemeinstrom ablesen' },
      { id: 'gaszaehler_heizung_ablesen', label: 'Gaszähler Heizung ablesen' },
      { id: 'waermemengenzaehler_ablesen', label: 'Wärmemengenzähler ablesen' },
      { id: 'zaehlerstand_fotografieren', label: 'Zählerstand fotografieren' },
      { id: 'zaehlerwechsel_dokumentieren', label: 'Zählerwechsel dokumentieren' }
    ],
    'objekt_technik': [
      { id: 'heizung_betriebsstatus_pruefen', label: 'Heizungsanlage: Betriebsstatus prüfen' },
      { id: 'heizung_stoerung_erfassen', label: 'Heizungsanlage: Störungsmeldung' },
      { id: 'aufzug_funktionspruefung', label: 'Aufzug: Funktionsprüfung' },
      { id: 'aufzug_tuev_plakette', label: 'Aufzug: TÜV-Plakette prüfen' },
      { id: 'feuerloescher_pruefdatum', label: 'Feuerlöscher: Prüfdatum kontrollieren' },
      { id: 'rauchwarnmelder_funktionspruefung', label: 'Rauchwarnmelder: Funktionsprüfung' },
      { id: 'brandmeldeanlage_test', label: 'Brandmeldeanlage: Funktionstest' }
    ],
    'objekt_aussenanlagen': [
      { id: 'spielplatz_sicherheitspruefung', label: 'Spielplatz: Sicherheitsprüfung' },
      { id: 'parkplaetze_zustand', label: 'Parkplätze: Zustand dokumentieren' },
      { id: 'muellstandplatz_zustand', label: 'Müllstandplatz: Zustand/Sauberkeit' },
      { id: 'gartenanlage_pflegezustand', label: 'Gartenanlage: Pflegezustand' },
      { id: 'aussenbeleuchtung_test', label: 'Außenbeleuchtung: Funktionstest' }
    ],
    'objekt_gemeinschaftsflaechen': [
      { id: 'treppenhaus_reinigungszustand', label: 'Treppenhaus: Reinigungszustand' },
      { id: 'treppenhaus_beleuchtung', label: 'Treppenhaus: Beleuchtung prüfen' },
      { id: 'keller_zustand', label: 'Keller: Allgemeinzustand' },
      { id: 'waschkueche_geraete', label: 'Waschküche: Geräte-Funktionsprüfung' },
      { id: 'tiefgarage_beleuchtung', label: 'Tiefgarage: Beleuchtung' }
    ]
  };

  const handleCategoryChange = (category) => {
    setFormData({
      ...formData,
      task_category: category,
      task_type: '',
      title: ''
    });
  };

  const handleTaskTypeChange = (typeId) => {
    const type = taskTypes[formData.task_category]?.find(t => t.id === typeId);
    setFormData({
      ...formData,
      task_type: typeId,
      title: type?.label || typeId
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label>Kategorie</Label>
            <Select value={formData.task_category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="objekt_stammdaten">Stammdaten & Dokumentation</SelectItem>
                <SelectItem value="objekt_zaehler">Zähler & Verbrauch</SelectItem>
                <SelectItem value="objekt_technik">Technik & Anlagen</SelectItem>
                <SelectItem value="objekt_aussenanlagen">Außenanlagen</SelectItem>
                <SelectItem value="objekt_gemeinschaftsflaechen">Gemeinschaftsflächen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Aufgabentyp</Label>
            <Select value={formData.task_type} onValueChange={handleTaskTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Typ wählen..." />
              </SelectTrigger>
              <SelectContent>
                {taskTypes[formData.task_category]?.map(type => (
                  <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Gebäude</Label>
            <Select value={formData.building_id} onValueChange={(val) => setFormData({...formData, building_id: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Gebäude wählen..." />
              </SelectTrigger>
              <SelectContent>
                {buildings.map(building => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name} - {building.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Titel</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Aufgabentitel"
              required
            />
          </div>

          <div>
            <Label>Beschreibung</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Details..."
              rows={3}
            />
          </div>

          <div>
            <Label>Priorität</Label>
            <Select value={formData.priority} onValueChange={(val) => setFormData({...formData, priority: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="niedrig">Niedrig</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="hoch">Hoch</SelectItem>
                <SelectItem value="sofort">Sofort</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" disabled={createTaskMutation.isPending} className="flex-1">
              {createTaskMutation.isPending ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}