import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { inbox_item_id } = await req.json();

    if (!inbox_item_id) {
      return Response.json({ error: 'Missing inbox_item_id' }, { status: 400 });
    }

    const inboxItem = await base44.asServiceRole.entities.DocumentInbox.get(inbox_item_id);
    if (!inboxItem) {
      return Response.json({ error: 'Inbox item not found' }, { status: 404 });
    }

    // SCHRITT 1: Dokumenttyp erkennen
    const typeAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere diesen Dokumenttyp:
      
Bekannte Typen:
- invoice: Rechnung, Beleg, Quittung
- lease_contract: Mietvertrag
- handover_protocol: Übergabeprotokoll
- property_tax: Grundsteuerbescheid
- insurance: Versicherungspolice
- bank_statement: Kontoauszug
- other: Sonstiges
- unknown: Nicht klassifizierbar

Bestimme den Typ basierend auf dem Dateinamen: "${inboxItem.original_filename}"
und dem E-Mail-Betreff: "${inboxItem.source_email_subject || ''}"`,
      response_json_schema: {
        type: 'object',
        properties: {
          document_type: { type: 'string' },
          type_confidence: { type: 'number' },
          rejection_reason: { type: 'string' }
        }
      }
    });

    if (typeAnalysis.document_type === 'unknown') {
      await base44.asServiceRole.entities.DocumentInbox.update(inbox_item_id, {
        status: 'rejected',
        document_type: 'unknown',
        ai_detected_type: 'unknown',
        ai_type_confidence: 0,
        rejection_reason: typeAnalysis.rejection_reason || 'Dokumenttyp nicht erkannt'
      });
      return Response.json({ success: true, action: 'rejected' });
    }

    // SCHRITT 2: Daten je nach Typ extrahieren
    let extractedData = {};
    const typeConfidence = typeAnalysis.type_confidence || 85;

    switch (typeAnalysis.document_type) {
      case 'invoice':
        extractedData = await base44.integrations.Core.InvokeLLM({
          prompt: `Extrahiere Rechnungsdaten aus: ${inboxItem.original_filename}
          
Rechnungsnummer, Datum, Betrag, Lieferant, IBAN`,
          response_json_schema: {
            type: 'object',
            properties: {
              invoice_number: { type: 'string' },
              invoice_date: { type: 'string' },
              due_date: { type: 'string' },
              total_amount: { type: 'number' },
              net_amount: { type: 'number' },
              tax_rate: { type: 'number' },
              supplier_name: { type: 'string' },
              supplier_iban: { type: 'string' }
            }
          }
        });
        break;

      case 'lease_contract':
        extractedData = await base44.integrations.Core.InvokeLLM({
          prompt: `Extrahiere Mietvertragsdaten:
          
Mieter, Adresse, Wohnung, Mietdaten, Kaution`,
          response_json_schema: {
            type: 'object',
            properties: {
              tenant_first_name: { type: 'string' },
              tenant_last_name: { type: 'string' },
              building_address: { type: 'string' },
              unit_identifier: { type: 'string' },
              contract_start_date: { type: 'string' },
              base_rent: { type: 'number' },
              total_rent: { type: 'number' },
              deposit: { type: 'number' },
              is_signed: { type: 'boolean' }
            }
          }
        });
        break;

      case 'handover_protocol':
        extractedData = await base44.integrations.Core.InvokeLLM({
          prompt: `Extrahiere Übergabedaten:
          
Mieter, Datum, Einzug/Auszug, Zählerstände`,
          response_json_schema: {
            type: 'object',
            properties: {
              tenant_last_name: { type: 'string' },
              handover_date: { type: 'string' },
              handover_type: { type: 'string' },
              is_signed: { type: 'boolean' }
            }
          }
        });
        break;

      case 'property_tax':
        extractedData = {
          property_tax_year: new Date().getFullYear(),
          property_tax_amount: 0
        };
        break;

      case 'insurance':
        extractedData = {
          insurance_type: 'Versicherung',
          insurance_premium: 0
        };
        break;
    }

    // SCHRITT 3: Matching
    let matchCandidates = [];
    if (typeAnalysis.document_type === 'invoice' && extractedData.invoice_number) {
      const invoices = await base44.asServiceRole.entities.Invoice.filter({
        invoice_number: extractedData.invoice_number
      });
      if (invoices.length > 0) {
        matchCandidates.push({
          entity_type: 'Invoice',
          entity_id: invoices[0].id,
          confidence: 100,
          details: { matched_on: ['invoice_number'] }
        });
      }
    }

    if (typeAnalysis.document_type === 'lease_contract' && extractedData.tenant_last_name) {
      const tenants = await base44.asServiceRole.entities.Tenant.filter({
        last_name: extractedData.tenant_last_name
      });
      if (tenants.length > 0) {
        const contracts = await base44.asServiceRole.entities.LeaseContract.filter({
          tenant_id: tenants[0].id
        });
        if (contracts.length > 0) {
          matchCandidates.push({
            entity_type: 'LeaseContract',
            entity_id: contracts[0].id,
            confidence: 85,
            details: { matched_on: ['tenant_name'] }
          });
        }
      }
    }

    const topMatch = matchCandidates.length > 0 ? matchCandidates[0] : null;
    const shouldAutoMatch = topMatch && topMatch.confidence >= 90;

    // Aktualisiere DocumentInbox
    await base44.asServiceRole.entities.DocumentInbox.update(inbox_item_id, {
      status: shouldAutoMatch ? 'auto_matched' : 'pending',
      document_type: typeAnalysis.document_type,
      ai_detected_type: typeAnalysis.document_type,
      ai_type_confidence: typeConfidence,
      ai_extracted_data: extractedData,
      ai_extraction_confidence: 80,
      ai_extraction_date: new Date().toISOString(),
      ...extractedData,
      matched_entity_type: topMatch?.entity_type || 'none',
      matched_entity_id: topMatch?.entity_id || null,
      match_confidence: topMatch?.confidence || 0,
      match_details: topMatch?.details || {},
      match_candidates: matchCandidates,
      was_auto_matched: shouldAutoMatch
    });

    return Response.json({
      success: true,
      document_type: typeAnalysis.document_type,
      was_auto_matched: shouldAutoMatch,
      match_confidence: topMatch?.confidence || 0
    });
  } catch (error) {
    console.error('processDocumentAnalysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});