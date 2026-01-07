export const WHATSAPP_CONFIG = {
  
  ANBIETER: [
    {
      id: 'trengo',
      name: 'Trengo',
      beschreibung: 'Günstigster Einstieg, EU-Server (NL)',
      kosten_monat: 29.00,
      land: 'NL',
      dsgvo_konform: true,
      empfohlen: true
    },
    {
      id: 'chatarmin',
      name: 'Chatarmin',
      beschreibung: 'Deutscher Premium-Anbieter, 100% EU',
      kosten_monat: 49.00,
      land: 'DE',
      dsgvo_konform: true,
      empfohlen: true
    },
    {
      id: 'superchat',
      name: 'Superchat',
      beschreibung: 'Deutscher Anbieter mit Bonus-Kontingent',
      kosten_monat: 49.00,
      land: 'DE',
      dsgvo_konform: true
    },
    {
      id: 'respond_io',
      name: 'respond.io',
      beschreibung: 'International, keine Nachricht-Aufschläge',
      kosten_monat: 79.00,
      land: 'US',
      dsgvo_konform: true
    }
  ],

  NACHRICHT_KATEGORIEN: [
    {
      id: 'service',
      name: 'Service',
      beschreibung: 'Antworten auf Kundenanfragen',
      kosten_pro_nachricht: 0.00,
      hinweis: 'Kostenlos innerhalb 24h-Fenster',
      farbe: '#10b981'
    },
    {
      id: 'utility',
      name: 'Verwaltung',
      beschreibung: 'Rechnungen, Dokumente, Termine',
      kosten_pro_nachricht: 0.0456,
      hinweis: 'Transaktionsbenachrichtigungen',
      farbe: '#3b82f6'
    },
    {
      id: 'authentication',
      name: 'Authentifizierung',
      beschreibung: 'Codes, Passwörter',
      kosten_pro_nachricht: 0.0636,
      farbe: '#f59e0b'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      beschreibung: 'Werbliche Nachrichten',
      kosten_pro_nachricht: 0.1131,
      hinweis: 'Höchste Kosten!',
      farbe: '#ef4444'
    }
  ],

  NACHRICHT_STATUS: [
    { id: 'wartend', name: 'Wartend', farbe: '#6b7280' },
    { id: 'gesendet', name: 'Gesendet', farbe: '#3b82f6' },
    { id: 'zugestellt', name: 'Zugestellt', farbe: '#10b981' },
    { id: 'gelesen', name: 'Gelesen', farbe: '#059669' },
    { id: 'fehler', name: 'Fehler', farbe: '#ef4444' }
  ],

  VALIDIERUNG: {
    telefonnummer_regex: /^\+49[1-9][0-9]{9,13}$/,
    max_nachricht_laenge: 4096,
    max_anhang_groesse_mb: 16,
    erlaubte_dateitypen: ['pdf', 'jpeg', 'jpg', 'png', 'docx', 'xlsx']
  },

  STANDARD_TEMPLATES: [
    {
      name: 'nebenkostenabrechnung',
      anzeige_name: 'Nebenkostenabrechnung verfügbar',
      kategorie: 'utility',
      body_text: 'Guten Tag {{1}},\n\nIhre Nebenkostenabrechnung für {{2}} steht bereit. Sie finden diese im Anhang.\n\nBei Fragen stehe ich gerne zur Verfügung.\n\nMit freundlichen Grüßen',
      platzhalter: [
        { name: 'Name', beispiel: 'Herr Müller' },
        { name: 'Zeitraum', beispiel: '2024' }
      ]
    },
    {
      name: 'mietrechnung',
      anzeige_name: 'Mietrechnung',
      kategorie: 'utility',
      body_text: 'Guten Tag {{1}},\n\nanbei erhalten Sie Ihre Mietrechnung für {{2}}.\n\nBetrag: {{3}} EUR\nFällig am: {{4}}\n\nVielen Dank!',
      platzhalter: [
        { name: 'Name', beispiel: 'Herr Müller' },
        { name: 'Monat', beispiel: 'Januar 2026' },
        { name: 'Betrag', beispiel: '850,00' },
        { name: 'Fälligkeitsdatum', beispiel: '01.02.2026' }
      ]
    }
  ],
  
  OPT_IN_EMAIL_VORLAGE: `Guten Tag {{mieter_name}},

wir möchten Ihnen künftig wichtige Informationen rund um Ihr Mietverhältnis auch per WhatsApp zusenden können. 

Damit wir Sie über WhatsApp kontaktieren dürfen, benötigen wir Ihre Einwilligung.

✅ Einwilligung erteilen: {{opt_in_url}}

Mit freundlichen Grüßen
{{verwalter_name}}`
};