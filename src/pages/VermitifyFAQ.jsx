import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function VermitifyFAQ() {
  const faqs = [
    {
      category: 'Allgemein',
      questions: [
        {
          q: 'Für wen ist vermitify geeignet?',
          a: 'vermitify richtet sich an private Vermieter, professionelle Vermieter, Hausverwaltungen und Immobilien-Investoren in Deutschland, Österreich und der Schweiz.'
        },
        {
          q: 'Brauche ich technisches Wissen?',
          a: 'Nein. vermitify ist so einfach wie Online-Banking. Sie brauchen keine Vorkenntnisse.'
        },
        {
          q: 'Kann ich vermitify testen?',
          a: 'Ja! Sie können alle Professional-Features 14 Tage kostenlos testen. Keine Kreditkarte erforderlich.'
        }
      ]
    },
    {
      category: 'Funktionen',
      questions: [
        {
          q: 'Welche Rechner sind kostenlos verfügbar?',
          a: 'Alle 9 Rechner (Rendite, AfA, Indexmiete, Cashflow, Tilgung, Kaufpreis, Wertentwicklung, BK-Checker, Mietvertrag-Generator) sind komplett kostenlos - auch ohne Registrierung.'
        },
        {
          q: 'Wie funktioniert die Anlage V Erstellung?',
          a: 'vermitify sammelt automatisch alle relevanten Daten (Mieteinnahmen, Ausgaben, AfA) und generiert daraus die Anlage V. Export für ELSTER mit einem Klick.'
        },
        {
          q: 'Kann ich Dokumente automatisch versenden?',
          a: 'Ja, über die LetterXpress-Integration können Sie BK-Abrechnungen, Mieterhöhungen, etc. automatisch per Post versenden.'
        }
      ]
    },
    {
      category: 'Sicherheit & Datenschutz',
      questions: [
        {
          q: 'Wo werden meine Daten gespeichert?',
          a: 'Alle Daten werden auf Servern in Deutschland gespeichert. Wir sind DSGVO-konform und erfüllen höchste Sicherheitsstandards.'
        },
        {
          q: 'Wer hat Zugriff auf meine Daten?',
          a: 'Nur Sie. Ihre Daten werden verschlüsselt übertragen und gespeichert. Nicht einmal unser Support-Team hat Zugriff ohne Ihre Zustimmung.'
        },
        {
          q: 'Was passiert bei Kündigung?',
          a: 'Sie können alle Ihre Daten jederzeit exportieren. Nach Kündigung werden Ihre Daten nach 90 Tagen vollständig gelöscht.'
        }
      ]
    },
    {
      category: 'Preise & Abrechnung',
      questions: [
        {
          q: 'Gibt es versteckte Kosten?',
          a: 'Nein. Der monatliche Preis ist alles, was Sie zahlen. Keine Setup-Gebühren, keine versteckten Kosten.'
        },
        {
          q: 'Kann ich monatlich kündigen?',
          a: 'Ja. Es gibt keine Mindestlaufzeit. Sie können jederzeit zum Monatsende kündigen.'
        },
        {
          q: 'Gibt es einen Jahresrabatt?',
          a: 'Ja! Bei jährlicher Zahlung sparen Sie 20% (2 Monate kostenlos).'
        }
      ]
    }
  ];

  return (
    <VfMarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Häufige Fragen</h1>
          <p className="text-xl text-[var(--theme-text-secondary)]">
            Alles, was Sie über vermitify wissen müssen
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((category) => (
            <div key={category.category}>
              <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
              <Accordion type="single" collapsible className="space-y-2">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="vf-card">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline">
                      <span className="font-semibold text-left">{faq.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <p className="text-[var(--theme-text-secondary)] leading-relaxed">
                        {faq.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-8 bg-[var(--vf-primary-50)] rounded-xl">
          <h3 className="text-xl font-bold mb-2">Noch Fragen?</h3>
          <p className="text-[var(--theme-text-secondary)] mb-4">
            Unser Team beantwortet Ihre Fragen gerne persönlich
          </p>
          <a href="mailto:support@vermitify.de" className="vf-btn vf-btn-gradient vf-btn-md">
            Kontakt aufnehmen
          </a>
        </div>
      </div>
    </VfMarketingLayout>
  );
}