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
import { FIELD_TASK_CATEGORIES } from './FieldTaskTemplates';

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

  // Replaced by FIELD_TASK_CATEGORIES import
  const taskTypesOldRemoved = {
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
    ],
    'wohnung_besichtigung': [
      { id: 'leerstandsbesichtigung', label: 'Leerstandsbesichtigung durchführen' },
      { id: 'renovierungsbedarf_erfassen', label: 'Renovierungsbedarf erfassen' },
      { id: 'wohnungsfotos_expose', label: 'Wohnungsfotos für Exposé' },
      { id: 'besichtigungstermin_feedback', label: 'Besichtigungsfeedback erfassen' },
      { id: 'mietangebot_erstellt', label: 'Mietangebot erstellt' }
    ],
    'wohnung_uebergabe_einzug': [
      { id: 'uebergabeprotokoll_einzug', label: 'Übergabeprotokoll Einzug erstellen' },
      { id: 'zaehlerstaende_einzug', label: 'Zählerstände Einzug erfassen' },
      { id: 'schluesseluebergabe', label: 'Schlüsselübergabe dokumentieren' },
      { id: 'einweisung_heizung', label: 'Einweisung Heizung erfolgt' },
      { id: 'hausordnung_ausgehaendigt', label: 'Hausordnung ausgehändigt' }
    ],
    'wohnung_uebergabe_auszug': [
      { id: 'vorbesichtigung_auszug', label: 'Vorbesichtigung Auszug' },
      { id: 'uebergabeprotokoll_auszug', label: 'Übergabeprotokoll Auszug' },
      { id: 'zaehlerstaende_auszug', label: 'Zählerstände Auszug' },
      { id: 'schluesselrueckgabe', label: 'Schlüsselrückgabe dokumentieren' },
      { id: 'schoenheitsreparaturen_pruefen', label: 'Schönheitsreparaturen prüfen' }
    ],
    'wohnung_pruefung': [
      { id: 'routinebegehung', label: 'Routinebegehung durchgeführt' },
      { id: 'rauchwarnmelder_pruefung_einheit', label: 'Rauchwarnmelder-Prüfung' },
      { id: 'schimmelkontrolle', label: 'Schimmelkontrolle' },
      { id: 'zustand_sanitaer', label: 'Zustand Sanitär geprüft' }
    ],
    'vertrag_abschluss': [
      { id: 'mietvertrag_vorbereitet', label: 'Mietvertrag vorbereitet' },
      { id: 'mietvertrag_unterschrieben_mieter', label: 'Mietvertrag unterschrieben (Mieter)' },
      { id: 'mietvertrag_unterschrieben_vermieter', label: 'Mietvertrag unterschrieben (Vermieter)' },
      { id: 'sepa_mandat_unterschrieben', label: 'SEPA-Lastschriftmandat unterschrieben' }
    ],
    'vertrag_kaution': [
      { id: 'kaution_rate_erhalten', label: 'Kaution Rate erhalten' },
      { id: 'kaution_vollstaendig', label: 'Kaution vollständig eingezahlt' },
      { id: 'kaution_rueckzahlung', label: 'Kaution-Rückzahlung berechnet' }
    ],
    'vertrag_aenderungen': [
      { id: 'mieterhoehung_angekuendigt', label: 'Mieterhöhung angekündigt' },
      { id: 'nachtrag_erstellt', label: 'Nachtrag zum Mietvertrag erstellt' },
      { id: 'untermieterlaubnis', label: 'Untermieterlaubnis erteilt/versagt' }
    ],
    'vertrag_ende': [
      { id: 'kuendigung_mieter_erhalten', label: 'Kündigung Mieter erhalten' },
      { id: 'kuendigung_bestaetigt', label: 'Kündigung bestätigt' },
      { id: 'auszugstermin_vereinbart', label: 'Auszugstermin vereinbart' }
    ],
    'vertrag_kommunikation': [
      { id: 'mieter_vor_ort_angetroffen', label: 'Mieter vor Ort angetroffen' },
      { id: 'mieter_nicht_angetroffen', label: 'Mieter nicht angetroffen' },
      { id: 'mietergespraech_dokumentiert', label: 'Mieter-Gespräch dokumentiert' },
      { id: 'abmahnung_uebergeben', label: 'Abmahnung übergeben' }
    ],
    'schaden_erfassung': [
      { id: 'schadensmeldung_aufnehmen', label: 'Schadensmeldung aufnehmen' },
      { id: 'schadensfotos_erstellen', label: 'Schadensfotos erstellen' },
      { id: 'versicherung_informiert', label: 'Versicherung informiert' },
      { id: 'notfall_sofortmassnahme', label: 'Notfall-Sofortmaßnahme eingeleitet' }
    ],
    'schaden_bearbeitung': [
      { id: 'handwerker_beauftragt', label: 'Handwerker beauftragt' },
      { id: 'arbeit_ausgefuehrt', label: 'Arbeit ausgeführt' },
      { id: 'abnahme_verwalter', label: 'Abnahme durch Verwalter' },
      { id: 'schaden_erledigt', label: 'Schaden erledigt' }
    ],
    'handwerker_einsatz': [
      { id: 'handwerker_eingewiesen', label: 'Handwerker vor Ort eingewiesen' },
      { id: 'schluessel_uebergeben_hw', label: 'Schlüssel übergeben' },
      { id: 'arbeitszeit_dokumentiert', label: 'Arbeitszeit dokumentiert' },
      { id: 'leistung_abgenommen', label: 'Leistung abgenommen' }
    ],
    'handwerker_wartung': [
      { id: 'heizungswartung_begleitet', label: 'Heizungswartung begleitet' },
      { id: 'aufzug_tuev_begleitet', label: 'Aufzug TÜV begleitet' },
      { id: 'brandschutzpruefung_begleitet', label: 'Brandschutzprüfung begleitet' },
      { id: 'treppenhausreinigung_abgenommen', label: 'Treppenhausreinigung abgenommen' }
    ],
    'handwerker_dokumentation': [
      { id: 'wartungsprotokoll_erhalten', label: 'Wartungsprotokoll erhalten' },
      { id: 'pruefbericht_erhalten', label: 'Prüfbericht erhalten' },
      { id: 'pruefplakette_fotografiert', label: 'Prüfplakette fotografiert' }
    ],
    'betriebskosten_verbrauch': [
      { id: 'hkvo_ablesung', label: 'HKVO-Ablesung durchgeführt' },
      { id: 'heizkostenverteiler_ablesen', label: 'Heizkostenverteiler ablesen' },
      { id: 'selbstablesung_pruefen', label: 'Selbstablesung geprüft' },
      { id: 'nutzerwechsel_ablesung', label: 'Nutzerwechsel-Ablesung' }
    ],
    'betriebskosten_pruefung': [
      { id: 'muelltonnen_anzahl_pruefen', label: 'Mülltonnen-Anzahl geprüft' },
      { id: 'wasserverbrauch_plausibel', label: 'Wasserverbrauch plausibel' },
      { id: 'leerstand_beruecksichtigt', label: 'Leerstand berücksichtigt' }
    ],
    'versicherung_fall': [
      { id: 'versicherungsschaden_dokumentiert', label: 'Versicherungsschaden dokumentiert' },
      { id: 'versicherung_telefonisch_informiert', label: 'Versicherung telefonisch informiert' },
      { id: 'gutachter_begleitet', label: 'Gutachter vor Ort begleitet' }
    ],
    'versicherung_recht': [
      { id: 'beweissicherung', label: 'Beweissicherung durchgeführt' },
      { id: 'zeugendaten_erfasst', label: 'Zeugendaten erfasst' },
      { id: 'polizei_anzeige', label: 'Polizeiliche Anzeige erstattet' }
    ],
    'weg_vor_ort': [
      { id: 'versammlung_raum_vorbereiten', label: 'Versammlung: Raum vorbereiten' },
      { id: 'anwesenheitsliste_fuehren', label: 'Anwesenheitsliste führen' },
      { id: 'beschluss_dokumentiert', label: 'Beschluss dokumentiert' },
      { id: 'rundgang_beirat', label: 'Objekt-Rundgang mit Beirat' }
    ],
    'notfall_sofortmassnahme': [
      { id: 'wasserabsperrung', label: 'Wasserabsperrung vorgenommen' },
      { id: 'stromabschaltung', label: 'Stromabschaltung vorgenommen' },
      { id: 'feuerwehr_gerufen', label: 'Feuerwehr gerufen' },
      { id: 'notdienst_gerufen', label: 'Notdienst gerufen' },
      { id: 'mieter_informiert_notfall', label: 'Betroffene Mieter informiert' }
    ],
    'allgemein_kommunikation': [
      { id: 'aushang_erstellt', label: 'Aushang erstellt' },
      { id: 'aushang_angebracht', label: 'Aushang angebracht' },
      { id: 'rundschreiben_verteilt', label: 'Mieter-Rundschreiben verteilt' },
      { id: 'foto_fuer_akte', label: 'Foto für Akte erstellt' }
    ],
    'allgemein_verwaltung': [
      { id: 'objektakte_aktualisiert', label: 'Objekt-Akte aktualisiert' },
      { id: 'mieterakte_aktualisiert', label: 'Mieter-Akte aktualisiert' },
      { id: 'wiedervorlage_angelegt', label: 'Wiedervorlage angelegt' },
      { id: 'fahrtzeit_erfasst', label: 'Fahrtzeit erfasst' },
      { id: 'tagesbericht_erstellt', label: 'Tagesbericht erstellt' }
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
    const categoryData = FIELD_TASK_CATEGORIES[formData.task_category];
    const type = categoryData?.tasks.find(t => t.id === typeId);
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
                <SelectItem value="objekt_stammdaten">1. Objekt: Stammdaten & Dokumentation</SelectItem>
                <SelectItem value="objekt_zaehler">1. Objekt: Zähler & Verbrauch</SelectItem>
                <SelectItem value="objekt_technik">1. Objekt: Technik & Anlagen</SelectItem>
                <SelectItem value="objekt_aussenanlagen">1. Objekt: Außenanlagen</SelectItem>
                <SelectItem value="objekt_gemeinschaftsflaechen">1. Objekt: Gemeinschaftsflächen</SelectItem>
                <SelectItem value="wohnung_besichtigung">2. Wohnung: Besichtigung & Vermietung</SelectItem>
                <SelectItem value="wohnung_uebergabe_einzug">Wohnung: Übergabe Einzug</SelectItem>
                <SelectItem value="wohnung_uebergabe_auszug">Wohnung: Übergabe Auszug</SelectItem>
                <SelectItem value="wohnung_pruefung">Wohnung: Prüfung während Mietzeit</SelectItem>
                <SelectItem value="vertrag_abschluss">Vertrag: Vertragsabschluss</SelectItem>
                <SelectItem value="vertrag_kaution">Vertrag: Kaution</SelectItem>
                <SelectItem value="vertrag_aenderungen">Vertrag: Vertragsänderungen</SelectItem>
                <SelectItem value="vertrag_ende">Vertrag: Mietverhältnis-Ende</SelectItem>
                <SelectItem value="vertrag_kommunikation">Vertrag: Kommunikation Mieter</SelectItem>
                <SelectItem value="schaden_erfassung">Schaden: Schadenserfassung</SelectItem>
                <SelectItem value="schaden_bearbeitung">Schaden: Mängelbearbeitung</SelectItem>
                <SelectItem value="handwerker_einsatz">Handwerker: Einsatzkoordination</SelectItem>
                <SelectItem value="handwerker_wartung">Handwerker: Wartung & Prüfung</SelectItem>
                <SelectItem value="handwerker_dokumentation">Handwerker: Dokumentation</SelectItem>
                <SelectItem value="betriebskosten_verbrauch">Betriebskosten: Verbrauchserfassung</SelectItem>
                <SelectItem value="betriebskosten_pruefung">Betriebskosten: Vor-Ort Prüfungen</SelectItem>
                <SelectItem value="versicherung_fall">Versicherung: Versicherungsfälle</SelectItem>
                <SelectItem value="versicherung_recht">Versicherung: Rechtliche Dokumentation</SelectItem>
                <SelectItem value="weg_vor_ort">WEG: Vor-Ort-Termine</SelectItem>
                <SelectItem value="notfall_sofortmassnahme">Notfall: Sofortmaßnahmen</SelectItem>
                <SelectItem value="allgemein_kommunikation">Allgemein: Kommunikation</SelectItem>
                <SelectItem value="allgemein_verwaltung">Allgemein: Verwaltungstätigkeiten</SelectItem>
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
                {FIELD_TASK_CATEGORIES[formData.task_category]?.tasks.map(type => (
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