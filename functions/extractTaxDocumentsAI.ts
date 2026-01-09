import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_urls, document_type } = await req.json();

    // KI-basierte Dokumentenanalyse
    const extractedData = await base44.integrations.Core.InvokeLLM({
      prompt: `Du bist ein Steuer-Dokumentenanalyst. Analysiere die folgenden Dokumente und extrahiere alle relevanten Steuerdaten:

Dokumenttyp: ${document_type}
Mögliche Typen: Kontoauszug, Handelsbestätigung, Krypto-Report, Immobiliendokument, GmbH-Auszug, Steuerbescheid

Extrahiere:
- Alle monetären Beträge mit Währung
- Daten (Transaktionsdaten, Perioden)
- Beteiligung/Anteilsquoten
- Länderinformationen
- Steuerkennzeichen (Steuer-IDs, etc.)
- Gewinn/Verlust-Informationen
- Meldepflicht-relevante Informationen (CRS, FATCA)

Struktur die Ausgabe logisch nach Dokumenttyp.`,
      file_urls: file_urls,
      response_json_schema: {
        type: "object",
        properties: {
          document_type: { type: "string" },
          data_points: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                value: { type: "string" },
                amount: { type: "number" },
                currency: { type: "string" },
                date: { type: "string" }
              }
            }
          },
          reporting_requirements: {
            type: "array",
            items: { type: "string" }
          },
          tax_jurisdictions_affected: {
            type: "array",
            items: { type: "string" }
          },
          confidence_score: { type: "number" }
        }
      }
    });

    // Automatische Zuordnung zu Steuerjahr
    const currentYear = new Date().getFullYear();
    const tax_year = extractedData.data_points[0]?.date 
      ? parseInt(extractedData.data_points[0].date.split('-')[0]) 
      : currentYear - 1;

    return Response.json({
      user_email: user.email,
      extracted_data: extractedData,
      tax_year: tax_year,
      suggested_entity_type: suggestEntityType(document_type, extractedData),
      next_actions: generateNextActions(extractedData),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function suggestEntityType(docType, data) {
  const mapping = {
    'bank_statement': 'BankTransaction',
    'trading_confirmation': 'Investment',
    'crypto_report': 'CryptoHolding',
    'real_estate': 'DocumentOriginal',
    'gmbh_excerpt': 'CrossBorderTransaction',
    'tax_notice': 'TaxDocument'
  };
  return mapping[docType] || 'TaxDocument';
}

function generateNextActions(data) {
  const actions = [];
  
  if (data.data_points?.length > 0) {
    actions.push('Daten überprüfen und bestätigen');
  }
  
  if (data.reporting_requirements?.includes('CRS')) {
    actions.push('CRS-Meldung vorbereiten');
  }
  
  if (data.tax_jurisdictions_affected?.length > 1) {
    actions.push('Multi-Country-Bericht generieren');
  }
  
  if (data.confidence_score < 0.8) {
    actions.push('Manuelle Überprüfung empfohlen');
  }
  
  return actions;
}