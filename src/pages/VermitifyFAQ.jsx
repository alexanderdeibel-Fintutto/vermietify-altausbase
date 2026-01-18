import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VermitifyFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'Wie funktioniert die kostenlose Testphase?',
      answer: 'Sie können Vermitify 14 Tage lang kostenlos und ohne Angabe von Zahlungsdaten testen. Nach Ablauf der Testphase können Sie einen Plan wählen oder Ihr Konto wird automatisch deaktiviert.'
    },
    {
      question: 'Kann ich jederzeit kündigen?',
      answer: 'Ja, Sie können Ihr Abonnement jederzeit mit einem Klick kündigen. Es gibt keine Mindestlaufzeit und keine Kündigungsfrist.'
    },
    {
      question: 'Sind meine Daten sicher?',
      answer: 'Absolut. Wir nutzen Bank-Level-Verschlüsselung (SSL/TLS), tägliche Backups und Server ausschließlich in Deutschland. Vermitify ist vollständig DSGVO-konform.'
    },
    {
      question: 'Funktioniert die ELSTER-Integration wirklich?',
      answer: 'Ja! Wir generieren die Anlage V automatisch aus Ihren Daten und exportieren sie als XML-Datei, die Sie direkt in ELSTER importieren können. Eine direkte API-Übertragung zu ELSTER ist in Arbeit.'
    },
    {
      question: 'Kann ich mehrere Objekte verwalten?',
      answer: 'Ja. Je nach Plan können Sie 3 Objekte (Starter), unbegrenzte Objekte (Professional) oder Objekte mit Multi-Mandanten-Verwaltung (Business) anlegen.'
    },
    {
      question: 'Brauche ich technische Kenntnisse?',
      answer: 'Nein. Vermitify ist bewusst einfach und intuitiv gestaltet. Alle Funktionen werden Schritt-für-Schritt durch Assistenten begleitet.'
    },
    {
      question: 'Was passiert mit meinen Daten bei Kündigung?',
      answer: 'Sie können jederzeit alle Ihre Daten als PDF oder Excel exportieren. Nach Kündigung haben Sie 30 Tage Zeit, Ihre Daten zu sichern, bevor sie gelöscht werden.'
    },
    {
      question: 'Gibt es eine API?',
      answer: 'Ja, ab dem Professional Plan erhalten Sie vollen API-Zugang für Integrationen mit anderen Systemen.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">Häufig gestellte Fragen</h1>
          <p className="text-xl text-[var(--vf-neutral-600)]">
            Alles, was Sie über Vermitify wissen müssen
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-[var(--vf-neutral-200)] rounded-xl overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[var(--vf-neutral-50)] transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <ChevronDown 
                  className={`h-5 w-5 text-[var(--vf-neutral-500)] transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-[var(--vf-neutral-50)] border-t border-[var(--vf-neutral-200)]">
                  <p className="text-[var(--vf-neutral-700)]">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16 p-8 bg-gradient-to-br from-[var(--vf-primary-50)] to-[var(--vf-accent-50)] rounded-2xl">
          <h2 className="text-2xl font-bold mb-3">Noch Fragen?</h2>
          <p className="text-[var(--vf-neutral-600)] mb-6">
            Unser Support-Team hilft Ihnen gerne weiter
          </p>
          <Button variant="gradient" size="lg">
            Kontakt aufnehmen
          </Button>
        </div>
      </div>
    </div>
  );
}