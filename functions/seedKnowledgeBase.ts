import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const articles = [
    {
      title: 'Mietzahlung',
      category: 'zahlung',
      question: 'Wann und wie zahle ich meine Miete?',
      answer: 'Ihre Miete ist monatlich im Voraus fällig. Der genaue Fälligkeitstag steht in Ihrem Mietvertrag. Sie können per Überweisung oder Lastschrift zahlen. Die Bankverbindung finden Sie in Ihrem Vertrag oder im Mieterportal unter "Zahlungen".',
      tags: ['Miete', 'Zahlung', 'Fälligkeit'],
      priority: 10
    },
    {
      title: 'Heizung funktioniert nicht',
      category: 'wartung',
      question: 'Was tue ich, wenn die Heizung nicht funktioniert?',
      answer: 'Prüfen Sie zunächst, ob die Thermostatventile geöffnet sind und entlüften Sie die Heizkörper. Wenn das Problem weiterhin besteht, melden Sie dies bitte über das Mieterportal unter "Wartung" oder rufen Sie in dringenden Fällen unsere Notfall-Hotline an.',
      tags: ['Heizung', 'Wartung', 'Notfall'],
      priority: 9
    },
    {
      title: 'Wasserschaden',
      category: 'notfall',
      question: 'Was mache ich bei einem Wasserschaden?',
      answer: 'Bei einem Wasserschaden:\n1. Drehen Sie sofort das Hauptwasserventil zu\n2. Schalten Sie den Strom in betroffenen Bereichen ab\n3. Rufen Sie unsere 24h-Notfall-Hotline an\n4. Dokumentieren Sie den Schaden mit Fotos\n5. Informieren Sie Ihre Versicherung',
      tags: ['Notfall', 'Wasser', 'Schaden'],
      priority: 10
    },
    {
      title: 'Kündigung Mietvertrag',
      category: 'mietvertrag',
      question: 'Wie kündige ich meinen Mietvertrag?',
      answer: 'Die Kündigung muss schriftlich erfolgen und unter Einhaltung der im Vertrag festgelegten Kündigungsfrist eingereicht werden. Typischerweise beträgt diese 3 Monate. Senden Sie die Kündigung per Einschreiben oder laden Sie sie im Mieterportal hoch.',
      tags: ['Kündigung', 'Mietvertrag', 'Auszug'],
      priority: 8
    },
    {
      title: 'Nebenkosten',
      category: 'zahlung',
      question: 'Was sind Nebenkosten und wie werden sie abgerechnet?',
      answer: 'Nebenkosten umfassen Betriebskosten wie Wasser, Heizung, Müllabfuhr und Hausmeisterdienste. Die Abrechnung erfolgt einmal jährlich. Sie zahlen monatliche Vorauszahlungen, die dann mit den tatsächlichen Kosten verrechnet werden.',
      tags: ['Nebenkosten', 'Abrechnung', 'Betriebskosten'],
      priority: 7
    },
    {
      title: 'Reparaturen in der Wohnung',
      category: 'wartung',
      question: 'Wer ist für Reparaturen zuständig?',
      answer: 'Kleinreparaturen bis 100€ trägt der Mieter. Größere Reparaturen und strukturelle Schäden sind Vermietersache. Melden Sie alle Schäden zeitnah über das Mieterportal, damit wir die Zuständigkeit klären können.',
      tags: ['Reparatur', 'Schaden', 'Zuständigkeit'],
      priority: 7
    },
    {
      title: 'Störung der Nachbarruhe',
      category: 'hausverwaltung',
      question: 'Was kann ich bei Lärmbelästigung durch Nachbarn tun?',
      answer: 'Versuchen Sie zunächst, das Gespräch mit dem Nachbarn zu suchen. Wenn das nicht hilft, dokumentieren Sie die Störungen (Datum, Uhrzeit, Art) und informieren Sie die Hausverwaltung. Die Ruhezeiten sind in der Hausordnung festgelegt.',
      tags: ['Lärm', 'Nachbarn', 'Ruhezeiten'],
      priority: 6
    },
    {
      title: 'Schlüsselverlust',
      category: 'allgemein',
      question: 'Was mache ich bei Verlust des Wohnungsschlüssels?',
      answer: 'Informieren Sie umgehend die Hausverwaltung. Bei Verlust des Hauptschlüssels muss ggf. die gesamte Schließanlage ausgetauscht werden. Die Kosten hierfür trägt der Mieter. Bewahren Sie Ersatzschlüssel sicher auf.',
      tags: ['Schlüssel', 'Verlust', 'Sicherheit'],
      priority: 5
    }
  ];

  const created = [];
  for (const article of articles) {
    const newArticle = await base44.asServiceRole.entities.KnowledgeBaseArticle.create(article);
    created.push(newArticle.id);
  }

  return Response.json({ 
    success: true,
    articles_created: created.length,
    article_ids: created
  });
});