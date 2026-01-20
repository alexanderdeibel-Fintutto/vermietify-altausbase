import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
    {
        category: 'Allgemein',
        questions: [
            {
                q: 'Was ist Vermitify?',
                a: 'Vermitify ist eine All-in-One Plattform für professionelle Immobilienverwaltung. Sie vereint Mieterverwaltung, Finanzen, Dokumente, Steuern und mehr in einer einfachen Software.'
            },
            {
                q: 'Für wen ist Vermitify geeignet?',
                a: 'Vermitify richtet sich an private Vermieter, professionelle Immobilienverwalter, Steuerberater und Immobilieninvestoren - von Einzelobjekten bis zu großen Portfolios.'
            },
            {
                q: 'Benötige ich technische Kenntnisse?',
                a: 'Nein, Vermitify ist intuitiv gestaltet und ohne technische Vorkenntnisse nutzbar. Unsere Wizards führen Sie Schritt für Schritt durch komplexe Prozesse.'
            }
        ]
    },
    {
        category: 'Preise & Abonnement',
        questions: [
            {
                q: 'Was kostet Vermitify?',
                a: 'Vermitify bietet Pläne ab 19 €/Monat. Alle Pläne können 14 Tage kostenlos getestet werden. Jährliche Zahlung spart 20%.'
            },
            {
                q: 'Kann ich jederzeit kündigen?',
                a: 'Ja, alle Pläne sind monatlich kündbar. Es gibt keine Mindestvertragslaufzeit. Bei jährlicher Zahlung erhalten Sie 2 Monate gratis.'
            },
            {
                q: 'Welche Zahlungsmethoden werden akzeptiert?',
                a: 'Wir akzeptieren alle gängigen Kreditkarten sowie SEPA-Lastschrift. Die Abrechnung erfolgt über unseren Partner Stripe.'
            }
        ]
    },
    {
        category: 'Funktionen',
        questions: [
            {
                q: 'Kann ich Betriebskostenabrechnungen erstellen?',
                a: 'Ja, unser BK-Wizard führt Sie durch den gesamten Prozess nach BetrKV. Inklusive automatischer Berechnung, Verteilung und PDF-Export.'
            },
            {
                q: 'Unterstützt Vermitify die Anlage V?',
                a: 'Ja, wir generieren automatisch die Anlage V für Ihre Steuererklärung basierend auf Ihren Einnahmen und Ausgaben.'
            },
            {
                q: 'Gibt es eine Mobile App?',
                a: 'Vermitify ist vollständig responsive und funktioniert perfekt auf allen Geräten - Desktop, Tablet und Smartphone.'
            }
        ]
    },
    {
        category: 'Datenschutz & Sicherheit',
        questions: [
            {
                q: 'Wo werden meine Daten gespeichert?',
                a: 'Alle Daten werden in ISO-27001 zertifizierten Rechenzentren in Deutschland gespeichert und sind DSGVO-konform verschlüsselt.'
            },
            {
                q: 'Wer hat Zugriff auf meine Daten?',
                a: 'Nur Sie haben Zugriff auf Ihre Daten. Wir verkaufen keine Daten und geben diese nicht an Dritte weiter.'
            },
            {
                q: 'Wie sicher sind meine Daten?',
                a: 'Wir verwenden moderne Verschlüsselung (SSL/TLS), regelmäßige Backups und mehrstufige Sicherheitsprotokolle.'
            }
        ]
    },
    {
        category: 'Support',
        questions: [
            {
                q: 'Welchen Support bietet Vermitify?',
                a: 'Alle Nutzer erhalten E-Mail-Support. Professional und Enterprise Kunden erhalten Prioritäts-Support und persönliche Beratung.'
            },
            {
                q: 'Gibt es Schulungen oder Tutorials?',
                a: 'Ja, wir bieten Video-Tutorials, eine umfangreiche Wissensdatenbank und persönliche Onboarding-Sessions für Enterprise-Kunden.'
            }
        ]
    }
];

function FAQItem({ question, answer }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="vf-card">
            <button
                onClick={() => setOpen(!open)}
                className="w-full vf-card-body flex justify-between items-center text-left"
            >
                <h3 className="font-semibold pr-4">{question}</h3>
                <ChevronDown className={cn("w-5 h-5 flex-shrink-0 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
                <div className="vf-card-body border-t border-gray-200 text-gray-600">
                    {answer}
                </div>
            )}
        </div>
    );
}

export default function VermitifyFAQ() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <div className="bg-gradient-to-br from-blue-50 to-orange-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h1 className="text-5xl font-bold mb-6 vf-gradient-text">
                        Häufige Fragen
                    </h1>
                    <p className="text-xl text-gray-600">
                        Antworten auf die wichtigsten Fragen zu Vermitify
                    </p>
                </div>
            </div>

            {/* FAQ Categories */}
            <div className="max-w-4xl mx-auto px-6 py-20">
                {faqs.map((category, idx) => (
                    <div key={idx} className="mb-12">
                        <h2 className="text-2xl font-bold mb-6">{category.category}</h2>
                        <div className="space-y-3">
                            {category.questions.map((faq, i) => (
                                <FAQItem key={i} question={faq.q} answer={faq.a} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Contact CTA */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold mb-4">Weitere Fragen?</h2>
                    <p className="text-xl text-gray-600 mb-8">
                        Unser Support-Team hilft Ihnen gerne weiter
                    </p>
                    <Link to={createPageUrl('VermitifyContact')}>
                        <Button className="vf-btn-gradient vf-btn-lg">
                            Kontakt aufnehmen
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}