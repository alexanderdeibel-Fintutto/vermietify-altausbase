import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Nicht autorisiert' 
            }, { status: 401 });
        }

        const body = await req.json();
        const { transactions, payments, tenants, units, buildings } = body;

        // Prepare context for AI
        const context = {
            transactions: transactions.map(t => ({
                id: t.id,
                date: t.transaction_date,
                amount: t.amount,
                sender: t.sender_receiver,
                description: t.description,
                reference: t.reference,
                iban: t.iban,
                is_matched: t.is_matched
            })),
            payments: payments.map(p => {
                const tenant = tenants.find(t => t.id === p.tenant_id);
                const unit = units.find(u => u.id === p.unit_id);
                const building = unit ? buildings.find(b => b.id === unit.building_id) : null;
                
                return {
                    id: p.id,
                    tenant_name: tenant ? `${tenant.first_name} ${tenant.last_name}` : null,
                    tenant_email: tenant?.email,
                    unit: unit ? `${building?.name || ''} ${unit.unit_number}` : null,
                    expected_amount: p.expected_amount,
                    amount_paid: p.amount || 0,
                    payment_month: p.payment_month,
                    payment_date: p.payment_date,
                    status: p.status,
                    reference: p.reference
                };
            })
        };

        const prompt = `Du bist ein KI-Assistent für Zahlungsabgleich in einer Immobilienverwaltung.

Analysiere die folgenden Banktransaktionen und Zahlungen:

TRANSAKTIONEN:
${JSON.stringify(context.transactions, null, 2)}

ZAHLUNGEN:
${JSON.stringify(context.payments, null, 2)}

Führe folgende Analysen durch:

1. FEHLENDE DETAILS ERGÄNZEN:
   - Identifiziere Transaktionen mit fehlenden Informationen (z.B. fehlender Sender, unklare Beschreibung)
   - Schlage basierend auf Betrag, Datum und Kontext vor, welcher Mieter/welche Zahlung gemeint sein könnte

2. ALTERNATIVE MATCHING-KRITERIEN:
   - Finde Übereinstimmungen zwischen Transaktionen und Zahlungen über Betrag und Datum hinaus
   - Berücksichtige: ähnliche Namen, Teilbeträge, zeitliche Nähe, Muster in Referenzen/Beschreibungen
   - Bewerte jede potenzielle Übereinstimmung mit einem Confidence-Score (0-100%)

3. DISKREPANZEN IDENTIFIZIEREN:
   - Finde ungewöhnliche Muster (z.B. Beträge weichen ab, erwartete Zahlungen fehlen)
   - Identifiziere potenzielle Fehler oder Ausnahmen, die überprüft werden sollten

Gib deine Analyse im folgenden JSON-Format zurück (keine zusätzlichen Texte, nur JSON).`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    missing_details_predictions: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                transaction_id: { type: "string" },
                                predicted_tenant: { type: "string" },
                                predicted_payment_id: { type: "string" },
                                reasoning: { type: "string" },
                                confidence: { type: "number" }
                            }
                        }
                    },
                    alternative_matches: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                transaction_id: { type: "string" },
                                payment_id: { type: "string" },
                                match_criteria: { type: "string" },
                                confidence: { type: "number" },
                                reasoning: { type: "string" }
                            }
                        }
                    },
                    discrepancies: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                type: { 
                                    type: "string",
                                    enum: ["amount_mismatch", "missing_payment", "duplicate", "timing_issue", "other"]
                                },
                                transaction_id: { type: "string" },
                                payment_id: { type: "string" },
                                description: { type: "string" },
                                severity: { 
                                    type: "string",
                                    enum: ["high", "medium", "low"]
                                },
                                suggested_action: { type: "string" }
                            }
                        }
                    }
                }
            }
        });

        return Response.json({
            success: true,
            analysis: response
        });

    } catch (error) {
        console.error('AI Analysis error:', error);
        return Response.json({ 
            error: 'KI-Analyse fehlgeschlagen',
            details: error.message
        }, { status: 500 });
    }
});