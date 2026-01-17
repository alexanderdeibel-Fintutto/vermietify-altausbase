import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';

export default function VermitifyAGB() {
  return (
    <VfMarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 1 Geltungsbereich</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen 
              der vermitify GmbH (nachfolgend "Anbieter") und den Nutzern der Software 
              vermitify (nachfolgend "Nutzer").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 2 Vertragsgegenstand</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Der Anbieter stellt dem Nutzer eine cloudbasierte Software zur Verwaltung von 
              Immobilien zur Verfügung. Der Funktionsumfang richtet sich nach dem gewählten 
              Tarif (Starter, Professional, Business).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 3 Vertragsschluss</h2>
            <ol className="list-decimal pl-6 space-y-2 text-[var(--theme-text-secondary)]">
              <li>Der Vertrag kommt durch Registrierung und Bestätigung der E-Mail-Adresse zustande.</li>
              <li>Der Nutzer erhält eine Bestätigungs-E-Mail mit Zugang zur Software.</li>
              <li>Mit der Registrierung akzeptiert der Nutzer diese AGB.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 4 Leistungen des Anbieters</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Der Anbieter gewährleistet eine Verfügbarkeit der Software von mindestens 99% 
              im Jahresmittel. Ausgenommen sind Wartungsarbeiten, die rechtzeitig angekündigt werden.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 5 Pflichten des Nutzers</h2>
            <ol className="list-decimal pl-6 space-y-2 text-[var(--theme-text-secondary)]">
              <li>Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten.</li>
              <li>Der Nutzer haftet für alle Aktivitäten unter seinem Account.</li>
              <li>Missbräuchliche Nutzung ist untersagt.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 6 Preise und Zahlung</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Die Preise ergeben sich aus der aktuellen Preisliste auf www.vermitify.de. 
              Zahlungen erfolgen monatlich oder jährlich im Voraus per SEPA-Lastschrift 
              oder Kreditkarte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 7 Kündigung</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Beide Parteien können den Vertrag mit einer Frist von einem Monat zum Monatsende 
              kündigen. Die Kündigung erfolgt in Textform (E-Mail ausreichend).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">§ 8 Datenschutz</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Der Anbieter verarbeitet personenbezogene Daten gemäß der Datenschutzerklärung 
              und den Vorgaben der DSGVO.
            </p>
          </section>

          <div className="mt-12 p-6 bg-[var(--vf-primary-50)] rounded-lg">
            <p className="text-sm text-[var(--theme-text-secondary)]">
              Stand: Januar 2026<br />
              vermitify GmbH • Musterstraße 1 • 10115 Berlin
            </p>
          </div>
        </div>
      </div>
    </VfMarketingLayout>
  );
}