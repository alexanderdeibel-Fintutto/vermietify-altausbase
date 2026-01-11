// Vollständiger Katalog aller Vor-Ort Aufgabentypen

export const FIELD_TASK_CATEGORIES = {
  // 1. OBJEKT/GEBÄUDE
  objekt_stammdaten: {
    label: 'Objekt: Stammdaten & Dokumentation',
    tasks: [
      { id: 'objektfotos_aktualisieren', label: 'Objektfotos aktualisieren', requiresPhotos: true },
      { id: 'grundriss_abgleichen', label: 'Grundriss abgleichen/korrigieren', requiresPhotos: true },
      { id: 'gebaeudezustand_dokumentieren', label: 'Gebäudezustand dokumentieren (Jahresbegehung)' },
      { id: 'fluchtwegeplan_pruefen', label: 'Notausgangs-/Fluchtwegeplan prüfen' },
      { id: 'hausnummern_erfassen', label: 'Hausnummern-/Klingelschild-Status erfassen' }
    ]
  },
  
  objekt_zaehler: {
    label: 'Objekt: Zähler & Verbrauch',
    tasks: [
      { id: 'hauptwasserzaehler_ablesen', label: 'Hauptwasserzähler ablesen', requiresMeterReading: true },
      { id: 'stromzaehler_allgemein_ablesen', label: 'Stromzähler Allgemeinstrom ablesen', requiresMeterReading: true },
      { id: 'gaszaehler_heizung_ablesen', label: 'Gaszähler Heizung ablesen', requiresMeterReading: true },
      { id: 'waermemengenzaehler_ablesen', label: 'Wärmemengenzähler ablesen', requiresMeterReading: true },
      { id: 'zwischenzaehler_erfassen', label: 'Zwischenzähler erfassen', requiresMeterReading: true },
      { id: 'zaehlerstand_fotografieren', label: 'Zählerstand fotografieren', requiresPhotos: true },
      { id: 'zaehlerwechsel_dokumentieren', label: 'Zählerwechsel dokumentieren' },
      { id: 'zaehlernummer_erfassen', label: 'Zählernummer erfassen/korrigieren' }
    ]
  },

  objekt_technik: {
    label: 'Objekt: Technik & Anlagen',
    tasks: [
      { id: 'heizung_betriebsstatus_pruefen', label: 'Heizungsanlage: Betriebsstatus prüfen', requiresInspection: true },
      { id: 'heizung_stoerung_erfassen', label: 'Heizungsanlage: Störungsmeldung erfassen' },
      { id: 'heizung_wartungsprotokoll', label: 'Heizungsanlage: Wartungsprotokoll unterschreiben' },
      { id: 'aufzug_funktionspruefung', label: 'Aufzug: Funktionsprüfung', requiresInspection: true },
      { id: 'aufzug_tuev_plakette', label: 'Aufzug: TÜV-Plakette prüfen/fotografieren', requiresPhotos: true },
      { id: 'aufzug_notruf_testen', label: 'Aufzug: Notruf testen' },
      { id: 'brandmeldeanlage_test', label: 'Brandmeldeanlage: Funktionstest', requiresInspection: true },
      { id: 'feuerloescher_pruefdatum', label: 'Feuerlöscher: Prüfdatum kontrollieren' },
      { id: 'feuerloescher_standort_foto', label: 'Feuerlöscher: Standort fotografieren', requiresPhotos: true },
      { id: 'rauchwarnmelder_funktionspruefung', label: 'Rauchwarnmelder: Funktionsprüfung je Einheit' },
      { id: 'blitzschutz_sichtpruefung', label: 'Blitzschutzanlage: Sichtprüfung' },
      { id: 'briefkasten_zustand', label: 'Briefkastenanlage: Zustand prüfen' },
      { id: 'klingelanlage_test', label: 'Klingelanlage: Funktionstest' },
      { id: 'tueroeffner_test', label: 'Türöffner: Funktionstest' }
    ]
  },

  objekt_aussenanlagen: {
    label: 'Objekt: Außenanlagen',
    tasks: [
      { id: 'spielplatz_sicherheitspruefung', label: 'Spielplatz: Sicherheitsprüfung', requiresInspection: true },
      { id: 'spielgeraete_schadensprotokoll', label: 'Spielgeräte: Schadensprotokoll' },
      { id: 'parkplaetze_zustand', label: 'Parkplätze: Zustand dokumentieren' },
      { id: 'muellstandplatz_zustand', label: 'Müllstandplatz: Zustand/Sauberkeit' },
      { id: 'muelltonnen_anzahl', label: 'Mülltonnen: Anzahl/Größe prüfen' },
      { id: 'gartenanlage_pflegezustand', label: 'Gartenanlage: Pflegezustand' },
      { id: 'baumbestand_sichtpruefung', label: 'Baumbestand: Sichtprüfung Verkehrssicherheit' },
      { id: 'aussenbeleuchtung_test', label: 'Außenbeleuchtung: Funktionstest' },
      { id: 'winterdienst_kontrolle', label: 'Winterdienst-Kontrolle' }
    ]
  },

  objekt_gemeinschaftsflaechen: {
    label: 'Objekt: Gemeinschaftsflächen',
    tasks: [
      { id: 'treppenhaus_reinigungszustand', label: 'Treppenhaus: Reinigungszustand' },
      { id: 'treppenhaus_beleuchtung', label: 'Treppenhaus: Beleuchtung prüfen' },
      { id: 'keller_zustand', label: 'Keller: Allgemeinzustand' },
      { id: 'waschkueche_geraete', label: 'Waschküche: Geräte-Funktionsprüfung' },
      { id: 'tiefgarage_beleuchtung', label: 'Tiefgarage: Beleuchtung' }
    ]
  },

  // 2. WOHNUNG/EINHEIT
  wohnung_besichtigung: {
    label: 'Wohnung: Besichtigung & Vermietung',
    tasks: [
      { id: 'leerstandsbesichtigung', label: 'Leerstandsbesichtigung durchführen' },
      { id: 'renovierungsbedarf_erfassen', label: 'Renovierungsbedarf erfassen' },
      { id: 'renovierungsfortschritt', label: 'Renovierungsfortschritt dokumentieren', requiresPhotos: true },
      { id: 'wohnungsfotos_expose', label: 'Wohnungsfotos für Exposé erstellen', requiresPhotos: true },
      { id: 'besichtigungstermin_feedback', label: 'Besichtigungsfeedback erfassen' },
      { id: 'mietangebot_erstellt', label: 'Mietangebot erstellt' },
      { id: 'bonitaetspruefung_erhalten', label: 'Bonitätsprüfung erhalten' }
    ]
  },

  wohnung_uebergabe_einzug: {
    label: 'Wohnung: Übergabe Einzug',
    tasks: [
      { id: 'uebergabeprotokoll_einzug', label: 'Übergabeprotokoll Einzug erstellen' },
      { id: 'zaehlerstaende_einzug', label: 'Zählerstände Einzug erfassen', requiresMeterReading: true },
      { id: 'schluesseluebergabe', label: 'Schlüsselübergabe dokumentieren' },
      { id: 'protokoll_fotos_einzug', label: 'Protokoll-Fotos erstellt', requiresPhotos: true },
      { id: 'einweisung_heizung', label: 'Einweisung Heizung erfolgt' },
      { id: 'hausordnung_ausgehaendigt', label: 'Hausordnung ausgehändigt' },
      { id: 'mietermappe_ausgehaendigt', label: 'Mietermappe ausgehändigt' }
    ]
  },

  wohnung_uebergabe_auszug: {
    label: 'Wohnung: Übergabe Auszug',
    tasks: [
      { id: 'vorbesichtigung_auszug', label: 'Vorbesichtigung Auszug durchgeführt' },
      { id: 'renovierungspflichten_besprochen', label: 'Renovierungspflichten besprochen' },
      { id: 'uebergabeprotokoll_auszug', label: 'Übergabeprotokoll Auszug erstellen' },
      { id: 'zaehlerstaende_auszug', label: 'Zählerstände Auszug erfassen', requiresMeterReading: true },
      { id: 'schluesselrueckgabe', label: 'Schlüsselrückgabe dokumentieren' },
      { id: 'schoenheitsreparaturen_pruefen', label: 'Schönheitsreparaturen erforderlich prüfen' },
      { id: 'wohnung_besenrein', label: 'Wohnung besenrein übergeben' }
    ]
  },

  wohnung_pruefung: {
    label: 'Wohnung: Prüfung während Mietzeit',
    tasks: [
      { id: 'routinebegehung', label: 'Routinebegehung durchgeführt' },
      { id: 'rauchwarnmelder_pruefung_einheit', label: 'Rauchwarnmelder-Prüfung' },
      { id: 'schimmelkontrolle', label: 'Schimmelkontrolle' },
      { id: 'zustand_sanitaer', label: 'Zustand Sanitär geprüft' },
      { id: 'zustand_einbaukueche', label: 'Zustand Einbauküche geprüft' }
    ]
  },

  // 3. MIETVERTRAG/MIETER
  vertrag_abschluss: {
    label: 'Vertrag: Vertragsabschluss',
    tasks: [
      { id: 'mietvertrag_vorbereitet', label: 'Mietvertrag vorbereitet' },
      { id: 'mietvertrag_unterschrieben_mieter', label: 'Mietvertrag unterschrieben (Mieter)' },
      { id: 'mietvertrag_unterschrieben_vermieter', label: 'Mietvertrag unterschrieben (Vermieter)' },
      { id: 'sepa_mandat_unterschrieben', label: 'SEPA-Lastschriftmandat unterschrieben' },
      { id: 'hausordnung_unterschrieben', label: 'Hausordnung unterschrieben' }
    ]
  },

  vertrag_kaution: {
    label: 'Vertrag: Kaution',
    tasks: [
      { id: 'kaution_rate_erhalten', label: 'Kaution Rate erhalten' },
      { id: 'kaution_vollstaendig', label: 'Kaution vollständig eingezahlt' },
      { id: 'kautionskonto_nachweis', label: 'Kautionskonto-Nachweis an Mieter' },
      { id: 'kaution_rueckzahlung', label: 'Kaution-Rückzahlung berechnet' }
    ]
  },

  vertrag_aenderungen: {
    label: 'Vertrag: Vertragsänderungen',
    tasks: [
      { id: 'mieterhoehung_angekuendigt', label: 'Mieterhöhung angekündigt' },
      { id: 'nachtrag_erstellt', label: 'Nachtrag zum Mietvertrag erstellt' },
      { id: 'nachtrag_unterschrieben', label: 'Nachtrag unterschrieben' },
      { id: 'untermieterlaubnis', label: 'Untermieterlaubnis erteilt/versagt' },
      { id: 'tierhaltung_genehmigung', label: 'Tierhaltungsgenehmigung erteilt/versagt' }
    ]
  },

  vertrag_ende: {
    label: 'Vertrag: Mietverhältnis-Ende',
    tasks: [
      { id: 'kuendigung_mieter_erhalten', label: 'Kündigung Mieter erhalten' },
      { id: 'kuendigung_bestaetigt', label: 'Kündigung bestätigt' },
      { id: 'kuendigungsfrist_berechnet', label: 'Kündigungsfrist berechnet' },
      { id: 'auszugstermin_vereinbart', label: 'Auszugstermin vereinbart' },
      { id: 'wohnung_geraetumt', label: 'Wohnung geräumt' }
    ]
  },

  vertrag_kommunikation: {
    label: 'Vertrag: Kommunikation Mieter',
    tasks: [
      { id: 'mieter_vor_ort_angetroffen', label: 'Mieter vor Ort angetroffen' },
      { id: 'mieter_nicht_angetroffen', label: 'Mieter nicht angetroffen' },
      { id: 'benachrichtigung_hinterlassen', label: 'Benachrichtigung hinterlassen' },
      { id: 'mietergespraech_dokumentiert', label: 'Mieter-Gespräch dokumentiert', requiresVoiceNote: true },
      { id: 'abmahnung_uebergeben', label: 'Abmahnung übergeben (Unterschrift)' },
      { id: 'hausordnungsverstos_dokumentiert', label: 'Hausordnungsverstoß dokumentiert' }
    ]
  },

  // 4. SCHÄDEN & MÄNGEL
  schaden_erfassung: {
    label: 'Schaden: Schadenserfassung',
    tasks: [
      { id: 'schadensmeldung_aufnehmen', label: 'Schadensmeldung aufnehmen', requiresDamageData: true },
      { id: 'schadensfotos_erstellen', label: 'Schadensfotos erstellen', requiresPhotos: true },
      { id: 'wasserschaden', label: 'Wasserschaden dokumentieren', requiresPhotos: true, requiresDamageData: true },
      { id: 'rohrbruch', label: 'Rohrbruch dokumentieren', requiresDamageData: true },
      { id: 'heizungsausfall', label: 'Heizungsausfall melden', requiresDamageData: true },
      { id: 'versicherung_informiert', label: 'Versicherung informiert' },
      { id: 'schadennummer_erfasst', label: 'Schadennummer Versicherung erfasst' },
      { id: 'notfall_sofortmassnahme', label: 'Notfall-Sofortmaßnahme eingeleitet' }
    ]
  },

  schaden_bearbeitung: {
    label: 'Schaden: Mängelbearbeitung',
    tasks: [
      { id: 'handwerker_beauftragt', label: 'Handwerker beauftragt' },
      { id: 'handwerker_termin_vereinbart', label: 'Handwerker-Termin vereinbart' },
      { id: 'handwerker_erschienen', label: 'Handwerker erschienen' },
      { id: 'arbeit_ausgefuehrt', label: 'Arbeit ausgeführt (vollständig)' },
      { id: 'abnahme_verwalter', label: 'Abnahme durch Verwalter erfolgt' },
      { id: 'nachbesserung_erforderlich', label: 'Nachbesserung erforderlich' },
      { id: 'rechnung_erhalten', label: 'Rechnung erhalten' },
      { id: 'schaden_erledigt', label: 'Schaden erledigt' }
    ]
  },

  // 5. HANDWERKER & DIENSTLEISTER
  handwerker_einsatz: {
    label: 'Handwerker: Einsatzkoordination',
    tasks: [
      { id: 'handwerker_eingewiesen', label: 'Handwerker vor Ort eingewiesen' },
      { id: 'zugangswege_erklaert', label: 'Zugangswege erklärt' },
      { id: 'schluessel_uebergeben_hw', label: 'Schlüssel übergeben' },
      { id: 'schluessel_zurueckerhalten', label: 'Schlüssel zurückerhalten' },
      { id: 'arbeitszeit_dokumentiert', label: 'Arbeitszeit dokumentiert' },
      { id: 'materialverbrauch_erfasst', label: 'Materialverbrauch erfasst' },
      { id: 'zusatzarbeiten_genehmigt', label: 'Zusatzarbeiten genehmigt' },
      { id: 'leistung_abgenommen', label: 'Leistung abgenommen' },
      { id: 'leistung_beanstandet', label: 'Leistung beanstandet' }
    ]
  },

  handwerker_wartung: {
    label: 'Handwerker: Wartung & Prüfung',
    tasks: [
      { id: 'heizungswartung_begleitet', label: 'Heizungswartung begleitet' },
      { id: 'aufzug_tuev_begleitet', label: 'Aufzug TÜV begleitet' },
      { id: 'brandschutzpruefung_begleitet', label: 'Brandschutzprüfung begleitet' },
      { id: 'schornsteinfeger_begleitet', label: 'Schornsteinfeger begleitet' },
      { id: 'treppenhausreinigung_abgenommen', label: 'Treppenhausreinigung abgenommen' },
      { id: 'gartenpflege_abgenommen', label: 'Gartenpflege abgenommen' },
      { id: 'winterdienst_kontrolliert', label: 'Winterdienst kontrolliert' }
    ]
  },

  handwerker_dokumentation: {
    label: 'Handwerker: Dokumentation',
    tasks: [
      { id: 'wartungsprotokoll_erhalten', label: 'Wartungsprotokoll erhalten' },
      { id: 'pruefbericht_erhalten', label: 'Prüfbericht erhalten' },
      { id: 'pruefplakette_fotografiert', label: 'Prüfplakette fotografiert', requiresPhotos: true },
      { id: 'naechster_prueftermin_erfasst', label: 'Nächster Prüftermin erfasst' }
    ]
  },

  // 6. BETRIEBSKOSTEN
  betriebskosten_verbrauch: {
    label: 'Betriebskosten: Verbrauchserfassung',
    tasks: [
      { id: 'hkvo_ablesung', label: 'HKVO-Ablesung durchgeführt' },
      { id: 'heizkostenverteiler_ablesen', label: 'Heizkostenverteiler ablesen', requiresMeterReading: true },
      { id: 'warmwasserzaehler_ablesen', label: 'Warmwasserzähler ablesen', requiresMeterReading: true },
      { id: 'kaltwasserzaehler_ablesen', label: 'Kaltwasserzähler ablesen', requiresMeterReading: true },
      { id: 'selbstablesung_pruefen', label: 'Selbstablesung geprüft' },
      { id: 'schaetzwert_erfasst', label: 'Schätzwert erfasst (Zähler defekt)' },
      { id: 'nutzerwechsel_ablesung', label: 'Nutzerwechsel-Ablesung' }
    ]
  },

  betriebskosten_pruefung: {
    label: 'Betriebskosten: Vor-Ort Prüfungen',
    tasks: [
      { id: 'muelltonnen_anzahl_pruefen', label: 'Mülltonnen-Anzahl geprüft' },
      { id: 'muellentsorgung_korrekt', label: 'Müllentsorgung korrekt' },
      { id: 'wasserverbrauch_plausibel', label: 'Wasserverbrauch plausibel' },
      { id: 'leerstand_beruecksichtigt', label: 'Leerstand berücksichtigt' }
    ]
  },

  // 7. VERSICHERUNG & RECHT
  versicherung_fall: {
    label: 'Versicherung: Versicherungsfälle',
    tasks: [
      { id: 'versicherungsschaden_dokumentiert', label: 'Versicherungsschaden dokumentiert', requiresPhotos: true },
      { id: 'fotos_versicherung', label: 'Fotos für Versicherung erstellt', requiresPhotos: true },
      { id: 'versicherung_telefonisch_informiert', label: 'Versicherung telefonisch informiert' },
      { id: 'schadenformular_ausgefuellt', label: 'Schadenformular ausgefüllt' },
      { id: 'gutachter_termin', label: 'Gutachter-Termin vereinbart' },
      { id: 'gutachter_begleitet', label: 'Gutachter vor Ort begleitet' }
    ]
  },

  versicherung_recht: {
    label: 'Versicherung: Rechtliche Dokumentation',
    tasks: [
      { id: 'beweissicherung', label: 'Beweissicherung durchgeführt', requiresPhotos: true },
      { id: 'zeugendaten_erfasst', label: 'Zeugendaten erfasst' },
      { id: 'zustellnachweis', label: 'Zustellnachweis erstellt' },
      { id: 'polizei_anzeige', label: 'Polizeiliche Anzeige erstattet' }
    ]
  },

  // 8. EIGENTÜMERVERSAMMLUNG/WEG
  weg_vor_ort: {
    label: 'WEG: Vor-Ort-Termine',
    tasks: [
      { id: 'versammlung_raum_vorbereiten', label: 'Versammlung: Raum vorbereiten' },
      { id: 'anwesenheitsliste_fuehren', label: 'Versammlung: Anwesenheitsliste führen' },
      { id: 'vollmachten_pruefen', label: 'Versammlung: Vollmachten prüfen' },
      { id: 'beschluss_dokumentiert', label: 'Beschluss dokumentiert' },
      { id: 'rundgang_beirat', label: 'Objekt-Rundgang mit Beirat' },
      { id: 'baumassnahme_besprechung', label: 'Baumaßnahme-Besprechung vor Ort' }
    ]
  },

  // 9. NOTFÄLLE
  notfall_sofortmassnahme: {
    label: 'Notfall: Sofortmaßnahmen',
    tasks: [
      { id: 'wasserabsperrung', label: 'Wasserabsperrung vorgenommen' },
      { id: 'stromabschaltung', label: 'Stromabschaltung vorgenommen' },
      { id: 'gasabsperrung', label: 'Gasabsperrung vorgenommen' },
      { id: 'feuerwehr_gerufen', label: 'Feuerwehr gerufen' },
      { id: 'polizei_gerufen', label: 'Polizei gerufen' },
      { id: 'notdienst_gerufen', label: 'Notdienst gerufen' },
      { id: 'mieter_informiert_notfall', label: 'Betroffene Mieter informiert' },
      { id: 'notfall_protokoll', label: 'Notfall-Protokoll erstellt', requiresPhotos: true },
      { id: 'gefahr_beseitigt', label: 'Gefahr beseitigt' }
    ]
  },

  // 10. ALLGEMEINE TASKS
  allgemein_kommunikation: {
    label: 'Allgemein: Kommunikation',
    tasks: [
      { id: 'aushang_erstellt', label: 'Aushang erstellt' },
      { id: 'aushang_angebracht', label: 'Aushang angebracht', requiresPhotos: true },
      { id: 'rundschreiben_verteilt', label: 'Mieter-Rundschreiben verteilt' },
      { id: 'foto_fuer_akte', label: 'Foto für Akte erstellt', requiresPhotos: true },
      { id: 'sprachnotiz_aufgenommen', label: 'Sprachnotiz aufgenommen', requiresVoiceNote: true }
    ]
  },

  allgemein_verwaltung: {
    label: 'Allgemein: Verwaltungstätigkeiten',
    tasks: [
      { id: 'objektakte_aktualisiert', label: 'Objekt-Akte aktualisiert' },
      { id: 'mieterakte_aktualisiert', label: 'Mieter-Akte aktualisiert' },
      { id: 'terminverfolgung_erstellt', label: 'Termin-Nachverfolgung erstellt' },
      { id: 'wiedervorlage_angelegt', label: 'Wiedervorlage angelegt' },
      { id: 'aufgabe_delegiert', label: 'Aufgabe an Kollegen delegiert' },
      { id: 'fahrtzeit_erfasst', label: 'Fahrtzeit erfasst' },
      { id: 'kilometerstand_erfasst', label: 'Kilometerstand erfasst' },
      { id: 'spesen_erfasst', label: 'Spesen erfasst' },
      { id: 'tagesbericht_erstellt', label: 'Tagesbericht erstellt' }
    ]
  }
};

export const getTaskTypeLabel = (taskType) => {
  for (const category of Object.values(FIELD_TASK_CATEGORIES)) {
    const task = category.tasks.find(t => t.id === taskType);
    if (task) return task.label;
  }
  return taskType;
};

export const getTaskTypeRequirements = (taskType) => {
  for (const category of Object.values(FIELD_TASK_CATEGORIES)) {
    const task = category.tasks.find(t => t.id === taskType);
    if (task) return {
      requiresPhotos: task.requiresPhotos || false,
      requiresVoiceNote: task.requiresVoiceNote || false,
      requiresMeterReading: task.requiresMeterReading || false,
      requiresInspection: task.requiresInspection || false,
      requiresDamageData: task.requiresDamageData || false
    };
  }
  return {};
};