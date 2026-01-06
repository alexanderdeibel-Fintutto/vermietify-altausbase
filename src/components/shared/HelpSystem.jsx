import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { HelpCircle, X, BookOpen, Lightbulb } from 'lucide-react';

const helpTexts = {
    "task_creation": {
        title: "Task-Erstellung",
        icon: Lightbulb,
        content: `
### Wie erstelle ich einen Task?

Tasks können auf verschiedene Arten erstellt werden:

**1. Manuell:**
- Klicken Sie auf "Neuer Task"
- Füllen Sie Titel und Beschreibung aus
- Das System schlägt automatisch passende Workflows, Objekte und Prioritäten vor

**2. Automatisch aus Emails:**
- Verbinden Sie Ihr IMAP-Konto im Tab "Emails"
- Eingehende Emails werden automatisch analysiert
- KI erstellt Task-Vorschläge basierend auf Email-Inhalt

**3. Über Workflows:**
- Workflows erstellen automatisch Tasks bei bestimmten Ereignissen
- Beispiel: Neuer Mietvertrag → Automatische Checkliste wird erstellt

### Intelligente Vorschläge

Beim Eingeben des Titels analysiert die KI:
- **Objekt-Zuordnung:** Gebäudenamen oder Adressen im Text
- **Priorität:** Keywords wie "dringend", "wichtig", "später"
- **Workflow:** Passende vordefinierte Abläufe
- **Fälligkeit:** Zeitangaben wie "heute", "nächste Woche"
        `
    },
    "workflow_editor": {
        title: "Workflow-Editor",
        icon: BookOpen,
        content: `
### Was sind Workflows?

Workflows definieren die Abfolge von Schritten für bestimmte Dokumenttypen oder Prozesse.

**Beispiel: Mieterwechsel-Workflow**
1. Kündigung erfassen
2. Wohnungsübergabe planen
3. Endreinigung beauftragen
4. Nebenkosten abrechnen
5. Kaution zurücküberweisen

### Workflow erstellen

1. Geben Sie Name und Beschreibung ein
2. Wählen Sie den Dokumenttyp
3. Fügen Sie Schritte hinzu im Step-Editor
4. Definieren Sie für jeden Schritt:
   - Aktionstyp (Task erstellen, Email senden, etc.)
   - Verzögerung zum nächsten Schritt
   - Bedingungen für die Ausführung

### Best Practices

- Halten Sie Workflows einfach und übersichtlich
- Nutzen Sie aussagekräftige Namen
- Testen Sie neue Workflows zunächst mit einem Beispiel
- Dokumentieren Sie komplexe Bedingungen in der Beschreibung
        `
    },
    "automation_rules": {
        title: "Automatisierungs-Regeln",
        icon: Lightbulb,
        content: `
### Automatisierungen erstellen

Automatisierungen führen Aktionen basierend auf Zeit oder Ereignissen aus.

**Trigger-Typen:**

1. **Zeitgesteuert:** 
   - Täglich, wöchentlich, monatlich
   - Beispiel: Jeden Montag um 9 Uhr Wochenübersicht versenden

2. **Status-Änderung:**
   - Wenn ein Task den Status wechselt
   - Beispiel: Bei "Erledigt" → Folge-Task erstellen

3. **Dokument-Aktion:**
   - Bei Erstellung oder Änderung von Dokumenten
   - Beispiel: Neue Mahnung → Automatisch Zahlungserinnerung senden

**Aktions-Typen:**

- **Task erstellen:** Automatische Aufgabengenerierung
- **Email senden:** Benachrichtigungen an Mieter/Partner
- **Dokument aktualisieren:** Status ändern, Felder setzen

### Sicherheitshinweise

- Testen Sie Automatisierungen zunächst mit deaktivierten Aktionen
- Überwachen Sie die Logs im "Protokoll"-Tab
- Verwenden Sie eindeutige Namen für bessere Übersicht
        `
    },
    "email_integration": {
        title: "Email-Integration",
        icon: BookOpen,
        content: `
### IMAP-Konten verbinden

Verbinden Sie Ihre Email-Konten für automatische Task-Generierung.

**Schritt für Schritt:**

1. **Konto hinzufügen:**
   - IMAP-Server: z.B. imap.gmail.com
   - Port: meist 993 (SSL)
   - Benutzername und Passwort
   
2. **Synchronisation:**
   - Emails werden regelmäßig abgerufen
   - KI analysiert Inhalt und schlägt Tasks vor
   - Sie entscheiden, welche Emails zu Tasks werden

3. **Gmail-spezifisch:**
   - Aktivieren Sie "App-Passwörter" in den Google-Einstellungen
   - Verwenden Sie NICHT Ihr normales Passwort
   - Server: imap.gmail.com, Port: 993

**Datenschutz:**
- Passwörter werden verschlüsselt gespeichert
- Email-Inhalte bleiben auf Ihrem Server
- Sie haben volle Kontrolle über KI-Analysen

### Troubleshooting

- **Verbindung fehlgeschlagen:** Prüfen Sie Server und Port
- **Authentifizierung fehlgeschlagen:** Bei Gmail App-Passwort verwenden
- **Keine Emails:** Prüfen Sie, ob SSL aktiviert ist
        `
    },
    "dashboard_overview": {
        title: "Dashboard-Übersicht",
        icon: BookOpen,
        content: `
### Dashboard verstehen

Das Dashboard zeigt die wichtigsten Kennzahlen auf einen Blick.

**Task-Statistiken:**
- **Offene Tasks:** Alle noch nicht erledigten Aufgaben
- **Heute fällig:** Tasks, die heute abgeschlossen werden sollten
- **Überfällig:** Tasks nach Fälligkeitsdatum (priorisieren!)
- **Diese Woche erledigt:** Fortschritt der letzten 7 Tage

**System-Status:**
- Aktive Workflows und Automatisierungen
- Unverarbeitete Emails
- Performance-Metriken

### Schnellaktionen

- Klicken Sie auf Statistik-Karten für gefilterte Ansichten
- Nutzen Sie die Tabs für verschiedene Ansichten (Liste, Kanban, Kalender)
- Filtern Sie nach Status, Priorität oder Objekt
        `
    },
    "performance_tips": {
        title: "Performance-Tipps",
        icon: Lightbulb,
        content: `
### System-Performance optimieren

**Datenbank-Wartung:**
- Archivieren Sie erledigte Tasks nach 6 Monaten
- Löschen Sie verarbeitete Emails regelmäßig
- Nutzen Sie den Performance-Monitor im Testing-Tab

**Best Practices:**

1. **Tasks strukturieren:**
   - Verwenden Sie klare, aussagekräftige Titel
   - Verknüpfen Sie Tasks mit Objekten
   - Setzen Sie realistische Fälligkeitsdaten

2. **Workflows effizient nutzen:**
   - Erstellen Sie Vorlagen für wiederkehrende Prozesse
   - Vermeiden Sie zu viele verschachtelte Bedingungen
   - Testen Sie vor Produktiv-Einsatz

3. **Automatisierungen sparsam einsetzen:**
   - Zu viele gleichzeitige Automatisierungen belasten das System
   - Kombinieren Sie ähnliche Regeln
   - Deaktivieren Sie nicht mehr benötigte Automatisierungen

**Monitoring:**
- Überprüfen Sie regelmäßig das Activity-Log
- Achten Sie auf Fehler-Meldungen
- Nutzen Sie den Testing-Tab für Performance-Tests
        `
    }
};

export function HelpButton({ context }) {
    const [open, setOpen] = useState(false);
    const helpData = helpTexts[context];

    if (!helpData) return null;

    const Icon = helpData.icon;

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                className="text-slate-500 hover:text-slate-700"
            >
                <HelpCircle className="w-5 h-5" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh]">
                    <DialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <DialogTitle className="text-xl">{helpData.title}</DialogTitle>
                        </div>
                    </DialogHeader>
                    
                    <ScrollArea className="max-h-[60vh] pr-4">
                        <div className="prose prose-sm prose-slate max-w-none">
                            {helpData.content.split('\n').map((line, idx) => {
                                if (line.startsWith('###')) {
                                    return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">{line.replace('###', '').trim()}</h3>;
                                } else if (line.startsWith('**') && line.endsWith('**')) {
                                    return <h4 key={idx} className="font-medium mt-3 mb-1">{line.replace(/\*\*/g, '').trim()}</h4>;
                                } else if (line.startsWith('- ')) {
                                    return <li key={idx} className="ml-4">{line.substring(2)}</li>;
                                } else if (line.trim()) {
                                    return <p key={idx} className="mb-2">{line}</p>;
                                } else {
                                    return <br key={idx} />;
                                }
                            })}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}

export function HelpPanel({ contexts = [] }) {
    return (
        <Card className="border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    Hilfe & Anleitungen
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {contexts.map(context => {
                    const helpData = helpTexts[context];
                    if (!helpData) return null;
                    
                    const Icon = helpData.icon;
                    
                    return (
                        <HelpButton key={context} context={context} />
                    );
                })}
                
                {contexts.length === 0 && (
                    <p className="text-sm text-slate-600">
                        Keine Hilfe-Themen verfügbar.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}