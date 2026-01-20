import React from 'react';

export default function VermitifyImpressum() {
    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-6 py-20">
                <h1 className="text-4xl font-bold mb-8">Impressum</h1>

                <div className="prose prose-lg max-w-none space-y-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
                        <p>
                            Vermitify GmbH<br />
                            Musterstraße 123<br />
                            1010 Wien<br />
                            Österreich
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Kontakt</h2>
                        <p>
                            Telefon: +43 1 234 5678<br />
                            E-Mail: info@vermitify.com<br />
                            Website: www.vermitify.com
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Handelsregister</h2>
                        <p>
                            Registergericht: Handelsgericht Wien<br />
                            Registernummer: FN 123456a<br />
                            UID-Nummer: ATU12345678
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Geschäftsführung</h2>
                        <p>Max Mustermann</p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Verantwortlich für den Inhalt</h2>
                        <p>
                            Max Mustermann<br />
                            Musterstraße 123<br />
                            1010 Wien
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">EU-Streitschlichtung</h2>
                        <p>
                            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
                            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                https://ec.europa.eu/consumers/odr
                            </a>
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Haftungsausschluss</h2>
                        <h3 className="text-xl font-semibold mb-2">Haftung für Inhalte</h3>
                        <p className="text-gray-600 mb-4">
                            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
                        </p>

                        <h3 className="text-xl font-semibold mb-2">Haftung für Links</h3>
                        <p className="text-gray-600">
                            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen 
                            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}