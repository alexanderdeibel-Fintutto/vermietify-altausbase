import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';

export default function VermitifyDatenschutz() {
  return (
    <VfMarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Datenschutz auf einen Blick</h2>
            <h3 className="text-xl font-semibold mb-3">Allgemeine Hinweise</h3>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
              Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, 
              mit denen Sie persönlich identifiziert werden können.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Datenerfassung</h2>
            <h3 className="text-xl font-semibold mb-3">Welche Daten erfassen wir?</h3>
            <ul className="list-disc pl-6 space-y-2 text-[var(--theme-text-secondary)]">
              <li>Kontaktdaten (Name, E-Mail, Telefon)</li>
              <li>Immobiliendaten (Objekte, Einheiten, Mietverträge)</li>
              <li>Finanzdaten (Mieten, Ausgaben)</li>
              <li>Nutzungsdaten (Berechnungen, Dokumente)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Ihre Rechte</h2>
            <ul className="list-disc pl-6 space-y-2 text-[var(--theme-text-secondary)]">
              <li>Auskunft über Ihre gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung Ihrer Daten</li>
              <li>Einschränkung der Datenverarbeitung</li>
              <li>Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Datenverarbeitung</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Datensicherheit</h2>
            <p className="text-[var(--theme-text-secondary)] leading-relaxed">
              Wir verwenden SSL-Verschlüsselung für die Datenübertragung. Ihre Daten werden auf 
              Servern in Deutschland gespeichert. Regelmäßige Backups und Sicherheitsaudits 
              gewährleisten die Sicherheit Ihrer Daten.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Kontakt Datenschutz</h2>
            <p className="text-[var(--theme-text-secondary)]">
              Bei Fragen zum Datenschutz:<br />
              E-Mail: datenschutz@vermitify.de<br />
              Telefon: +49 30 1234 5678
            </p>
          </section>

          <div className="mt-12 p-6 bg-[var(--vf-primary-50)] rounded-lg">
            <p className="text-sm text-[var(--theme-text-secondary)]">
              Stand: Januar 2026<br />
              Letzte Aktualisierung: 17.01.2026
            </p>
          </div>
        </div>
      </div>
    </VfMarketingLayout>
  );
}