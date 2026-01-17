import React from 'react';
import { VfMarketingLayout } from '@/components/marketing/VfMarketingLayout';

export default function VermitifyImpressum() {
  return (
    <VfMarketingLayout>
      <div className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">Impressum</h1>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
            <p>
              vermitify GmbH<br />
              Musterstraße 1<br />
              10115 Berlin<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
            <p>
              Telefon: +49 30 1234 5678<br />
              E-Mail: info@vermitify.de
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Registereintrag</h2>
            <p>
              Eintragung im Handelsregister<br />
              Registergericht: Amtsgericht Berlin<br />
              Registernummer: HRB 12345
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß §27a UStG:<br />
              DE123456789
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Geschäftsführer</h2>
            <p>Max Mustermann</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Verantwortlich für den Inhalt</h2>
            <p>
              Max Mustermann<br />
              Musterstraße 1<br />
              10115 Berlin
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
              <a href="https://ec.europa.eu/consumers/odr" className="text-[var(--vf-primary-600)] hover:underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </section>
        </div>
      </div>
    </VfMarketingLayout>
  );
}