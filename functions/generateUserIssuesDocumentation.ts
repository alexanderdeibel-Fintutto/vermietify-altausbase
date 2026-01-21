import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const markdownContent = `# HÄUFIGE PROBLEME & FAQ

Generiert am: ${new Date().toISOString()}

## TOP 20 USER-FRAGEN

### 1. Wie erstelle ich eine Betriebskostenabrechnung?
**Antwort:** Dashboard → BK-Abrechnung → Wizard starten → Gebäude wählen → Kosten eingeben → Berechnen → PDF generieren

**Häufige Fehler:**
- Zeitraum nicht 12 Monate
- Verteilerschlüssel falsch gewählt
- Vorauszahlungen nicht erfasst

---

### 2. Wie hoch darf ich die Miete erhöhen?
**Antwort:** Maximal 20% in 3 Jahren (Kappungsgrenze), max. ortsübliche Vergleichsmiete

**Rechtliche Basis:** §558 BGB

**Tools:** Mieterhöhungs-Assistent nutzen

---

### 3. Warum stimmt die Anlage V nicht?
**Häufige Ursachen:**
- AfA-Satz falsch (2% bei Altbau, 3% bei Neubau)
- Anschaffungskosten inkl. Nebenkosten vergessen
- Erhaltungsaufwand vs. Herstellungskosten verwechselt
- Zeitanteilige Abgrenzung bei unterjähriger Vermietung

---

### 4. Wie funktioniert die Banking-Integration?
**Antwort:** Einstellungen → Integrationen → finAPI → Bank verbinden

**Wichtig:** 
- TAN-Verfahren muss aktiviert sein
- Maximale Gültigkeit beachten
- Regelmäßig neu authentifizieren

---

### 5. Kann ich mehrere Objekte gleichzeitig verwalten?
**Antwort:** Ja, unbegrenzte Anzahl je nach Abo-Plan

**Tipp:** Gebäude-Filter nutzen für bessere Übersicht

---

### 6. Wie lade ich Belege hoch?
**Antwort:** Dokumente → Upload → Kategorie wählen → Automatische OCR-Erkennung

**Unterstützte Formate:** PDF, JPG, PNG
**Max. Größe:** 10 MB pro Datei

---

### 7. Meine Miete wurde nicht erkannt - warum?
**Ursachen:**
- Verwendungszweck nicht eindeutig
- SEPA-Lastschrift ohne Referenz
- Falsche IBAN hinterlegt

**Lösung:** Manuell zuordnen → Regel erstellen für Zukunft

---

### 8. Wie kündige ich einen Mietvertrag rechtssicher?
**Antwort:** Vertrag → Kündigung → Kündigungsschreiben generieren

**Fristen:**
- Ordentlich: 3 Monate zum Monatsende
- Außerordentlich: Sofort bei wichtigem Grund

---

### 9. Was ist der Unterschied zwischen SOLL und IST?
**Antwort:**
- **SOLL:** Geplante/erwartete Zahlungen (z.B. Mietvertrag)
- **IST:** Tatsächliche Zahlungseingänge (Bank)

---

### 10. Kann ich Daten exportieren?
**Antwort:** Ja, CSV/Excel-Export in jedem Bereich

**DSGVO:** Datenexport unter Einstellungen → Datenschutz

---

## BEKANNTE BUGS & LIMITIERUNGEN

### Bug #1: PDF-Generierung langsam bei großen Dokumenten
**Status:** Bekannt  
**Workaround:** Dokument in kleinere Teile aufteilen  
**Fix geplant:** Q2 2026

---

### Bug #2: Mobile-Ansicht bei Tabellen
**Status:** In Bearbeitung  
**Workaround:** Desktop-Browser verwenden für komplexe Tabellen  
**Fix geplant:** Q1 2026

---

### Limitation #1: Max. 100 Einheiten pro Gebäude
**Grund:** Performance-Optimierung  
**Lösung:** Gebäude aufteilen

---

### Limitation #2: Bulk-Operationen max. 50 Datensätze
**Grund:** Timeout-Schutz  
**Lösung:** In mehreren Schritten durchführen

---

## HÄUFIGE FEHLERMELDUNGEN

### "Nicht genügend Berechtigungen"
**Ursache:** Fehlende Rolle oder Zugriff  
**Lösung:** Admin kontaktieren

---

### "Feld ist erforderlich"
**Ursache:** Pflichtfeld nicht ausgefüllt  
**Lösung:** Rot markierte Felder prüfen

---

### "Datum liegt in der Vergangenheit"
**Ursache:** Fälligkeitsdatum < heute  
**Lösung:** Aktuelles/zukünftiges Datum wählen

---

### "Duplikat erkannt"
**Ursache:** Gleicher Datensatz bereits vorhanden  
**Lösung:** Bestehenden Eintrag suchen und bearbeiten

---

## BEST PRACTICES

### Daten-Eingabe
✅ Sofort nach Geschäftsvorfall eingeben  
✅ Belege direkt hochladen  
✅ Kategorien korrekt wählen  
❌ Nicht monatelanges Sammeln

### Backups
✅ Wöchentlich automatisches Backup  
✅ Vor größeren Änderungen manuell  
✅ Export in lokales Archiv  
❌ Nicht nur auf Cloud verlassen

### Kommunikation
✅ Alle Kommunikation dokumentieren  
✅ E-Mails über System versenden  
✅ Nachweise speichern  
❌ Nicht nur telefonisch vereinbaren

---

## TYPISCHE ANFÄNGER-FEHLER

1. **Kaltmiete vs. Warmmiete verwechselt**  
   → Immer Kaltmiete + Nebenkosten separat

2. **AfA-Basis falsch berechnet**  
   → Kaufpreis + Erwerbsnebenkosten - Grundstückswert

3. **Kündigungsfrist falsch berechnet**  
   → Zugang beim Empfänger beachten (+3 Tage)

4. **Kaution nicht separat angelegt**  
   → Kaution MUSS getrennt vom Geschäftskonto

5. **Betriebskosten nicht umlagefähig**  
   → Nur Positionen nach §2 BetrKV

---

## SUPPORT-KONTAKTE

**Technischer Support:** support@vermitify.de  
**Rechtliche Fragen:** Eigenen Anwalt konsultieren  
**Steuerliche Fragen:** Eigenen Steuerberater konsultieren

**Hinweis:** Wir geben keine Rechts- oder Steuerberatung!

---

## NÜTZLICHE LINKS

- [Mietrechts-Wiki](https://www.mietrecht.de)
- [ELSTER Online](https://www.elster.de)
- [BetrKV Volltext](https://www.gesetze-im-internet.de/betrkv/)
- [Mietspiegel-Datenbank](https://www.mietspiegel.de)
`;

    return Response.json({ 
      success: true,
      markdownContent
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});