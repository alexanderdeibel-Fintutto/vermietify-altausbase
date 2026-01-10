import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { document_url, document_type_hint, context } = await req.json();

    // Analyze document with AI
    const analysisResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Analysiere dieses Dokument (${document_type_hint || 'unbekannter Typ'}) und extrahiere alle relevanten Daten.

Kontext: ${context || 'Immobilienverwaltung'}

Extrahiere folgende Informationen:
- Dokumenttyp (Rechnung, Beleg, Mietvertrag, Übergabeprotokoll, etc.)
- Betrag (Gesamtbetrag)
- Datum (Rechnungsdatum oder Leistungsdatum)
- Lieferant/Absender (Firmenname)
- Rechnungsnummer oder Belegnummer
- Kategorie (Wartung, Nebenkosten, Versicherung, Miete, etc.)
- Mieter oder Gebäudebezug (falls erkennbar)
- Zusätzliche Details (Beschreibung, Positionen)

Sei präzise und gib nur Informationen zurück, die du sicher erkennen kannst.`,
      file_urls: [document_url],
      response_json_schema: {
        type: "object",
        properties: {
          document_type: {
            type: "string",
            enum: ["invoice", "receipt", "contract", "protocol", "bank_statement", "other"]
          },
          amount: { type: "number" },
          date: { type: "string" },
          vendor_name: { type: "string" },
          invoice_number: { type: "string" },
          category: { type: "string" },
          tenant_name: { type: "string" },
          building_reference: { type: "string" },
          description: { type: "string" },
          line_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                amount: { type: "number" }
              }
            }
          },
          vat_amount: { type: "number" },
          confidence: { type: "number" }
        }
      }
    });

    // Try to match with existing entities
    let building = null;
    let tenant = null;
    let supplier = null;

    // Match building
    if (analysisResult.building_reference) {
      const buildings = await base44.asServiceRole.entities.Building.list();
      building = buildings.find(b => 
        analysisResult.building_reference.toLowerCase().includes(b.name?.toLowerCase()) ||
        analysisResult.building_reference.toLowerCase().includes(b.street?.toLowerCase())
      );
    }

    // Match tenant
    if (analysisResult.tenant_name) {
      const tenants = await base44.asServiceRole.entities.Tenant.list();
      tenant = tenants.find(t => 
        analysisResult.tenant_name.toLowerCase().includes(t.last_name?.toLowerCase())
      );
    }

    // Match or create supplier
    if (analysisResult.vendor_name && analysisResult.document_type === 'invoice') {
      const suppliers = await base44.asServiceRole.entities.Supplier.list();
      supplier = suppliers.find(s => 
        s.company_name?.toLowerCase() === analysisResult.vendor_name.toLowerCase()
      );

      if (!supplier && analysisResult.vendor_name) {
        supplier = await base44.asServiceRole.entities.Supplier.create({
          company_name: analysisResult.vendor_name,
          notes: 'Automatisch erstellt durch Dokumentenanalyse'
        });
      }
    }

    // Create DocumentAnalysis record
    const documentAnalysis = await base44.asServiceRole.entities.DocumentAnalysis.create({
      document_url,
      document_type: analysisResult.document_type,
      extracted_data: analysisResult,
      amount: analysisResult.amount || 0,
      date: analysisResult.date,
      vendor_name: analysisResult.vendor_name,
      tenant_name: analysisResult.tenant_name,
      invoice_number: analysisResult.invoice_number,
      category: analysisResult.category,
      confidence_score: analysisResult.confidence || 0,
      building_id: building?.id,
      unit_id: tenant?.unit_id,
      status: 'pending'
    });

    // Auto-create financial item if confidence is high
    let financialItem = null;
    if (analysisResult.confidence > 0.8 && analysisResult.amount && analysisResult.date) {
      const type = analysisResult.document_type === 'invoice' || 
                   analysisResult.document_type === 'receipt' ? 'expense' : 'income';
      
      financialItem = await base44.asServiceRole.entities.FinancialItem.create({
        type,
        category: analysisResult.category || 'general',
        amount: analysisResult.amount,
        date: analysisResult.date,
        description: analysisResult.description || `${analysisResult.vendor_name || 'Unbekannt'} - ${analysisResult.invoice_number || ''}`,
        building_id: building?.id,
        supplier_id: supplier?.id,
        invoice_number: analysisResult.invoice_number,
        notes: 'Automatisch erstellt aus Dokumentenanalyse'
      });

      // Link to analysis
      await base44.asServiceRole.entities.DocumentAnalysis.update(documentAnalysis.id, {
        financial_item_id: financialItem.id,
        status: 'linked'
      });
    }

    return Response.json({
      analysis: documentAnalysis,
      extracted: analysisResult,
      matched: {
        building,
        tenant,
        supplier
      },
      auto_created: {
        financial_item: financialItem
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      details: error.stack
    }, { status: 500 });
  }
});