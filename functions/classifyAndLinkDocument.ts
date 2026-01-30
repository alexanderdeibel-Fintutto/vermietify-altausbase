import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Klassifiziert Dokument, extrahiert Daten und verknüpft mit Entities
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { document_name, file_url } = await req.json();

        if (!document_name || !file_url) {
            return Response.json({ 
                error: 'Missing required fields: document_name, file_url' 
            }, { status: 400 });
        }

        // Erstelle Klassifizierungsdatensatz
        const classification = await base44.asServiceRole.entities.SmartDocumentClassification.create({
            document_name,
            file_url,
            processing_status: 'classifying'
        });

        // Starte Verarbeitung asynchron
        processDocument(base44, classification.id, file_url, document_name).catch(err => {
            console.error('Background processing failed:', err);
        });

        return Response.json({
            success: true,
            classification_id: classification.id,
            status: 'processing'
        });

    } catch (error) {
        console.error('Classification request failed:', error);
        return Response.json({ 
            error: error.message,
            success: false
        }, { status: 500 });
    }
});

async function processDocument(base44, classificationId, fileUrl, documentName) {
    try {
        // SCHRITT 1: Klassifizierung
        await base44.asServiceRole.entities.SmartDocumentClassification.update(classificationId, {
            processing_status: 'classifying'
        });

        const classifyPrompt = `Analysiere das hochgeladene Dokument und klassifiziere es. Gib das Ergebnis im JSON-Format zurück:

{
    "detected_type": "invoice|lease_contract|employment_contract|service_contract|operating_cost_statement|insurance_policy|energy_certificate|maintenance_report|tax_document|letter|other",
    "classification_confidence": 95,
    "reasoning": "Kurze Begründung für die Klassifizierung"
}

Mögliche Typen:
- invoice: Rechnungen, Rechnungsbelege
- lease_contract: Mietverträge
- employment_contract: Arbeitsverträge
- service_contract: Service- oder Dienstleistungsverträge
- operating_cost_statement: Betriebskostenabrechnungen
- insurance_policy: Versicherungspolicen
- energy_certificate: Energieausweise
- maintenance_report: Wartungsberichte, Inspektionsberichte
- tax_document: Steuerdokumente, Steuerbescheide
- letter: Briefe, Schreiben
- other: Sonstiges

Analysiere den Inhalt sorgfältig und wähle den passendsten Typ.`;

        const { data: classifyResponse } = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'analysis',
            prompt: classifyPrompt,
            featureKey: 'document_analysis',
            file_urls: [fileUrl]
        });

        let classificationData = {};
        try {
            const responseText = classifyResponse.content || classifyResponse;
            const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
            if (jsonMatch) {
                classificationData = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse classification:', e);
            classificationData = { detected_type: 'other', classification_confidence: 50 };
        }

        const detectedType = classificationData.detected_type || 'other';

        // SCHRITT 2: Datenextraktion basierend auf Typ
        await base44.asServiceRole.entities.SmartDocumentClassification.update(classificationId, {
            detected_type: detectedType,
            classification_confidence: classificationData.classification_confidence,
            processing_status: 'extracting'
        });

        const extractPrompt = getExtractionPrompt(detectedType);
        
        const { data: extractResponse } = await base44.asServiceRole.functions.invoke('aiCoreService', {
            action: 'analysis',
            prompt: extractPrompt,
            featureKey: 'document_analysis',
            file_urls: [fileUrl]
        });

        let extractedFields = {};
        try {
            const responseText = extractResponse.content || extractResponse;
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                extractedFields = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse extraction:', e);
        }

        // SCHRITT 3: Entity-Verknüpfung
        await base44.asServiceRole.entities.SmartDocumentClassification.update(classificationId, {
            extracted_fields: extractedFields,
            processing_status: 'linking'
        });

        const suggestedLinks = await findEntityLinks(base44, detectedType, extractedFields);

        // Auto-Link bei hoher Konfidenz (>85%)
        const autoLinkedEntities = [];
        let buildingId = null, unitId = null, tenantId = null, supplierId = null;

        for (const link of suggestedLinks) {
            if (link.confidence >= 85) {
                autoLinkedEntities.push({
                    entity_type: link.entity_type,
                    entity_id: link.entity_id,
                    linked_at: new Date().toISOString(),
                    linked_by: 'auto'
                });

                if (link.entity_type === 'Building') buildingId = link.entity_id;
                if (link.entity_type === 'Unit') unitId = link.entity_id;
                if (link.entity_type === 'Tenant') tenantId = link.entity_id;
                if (link.entity_type === 'Supplier') supplierId = link.entity_id;
            }
        }

        // Finalize
        await base44.asServiceRole.entities.SmartDocumentClassification.update(classificationId, {
            suggested_entity_links: suggestedLinks,
            linked_entities: autoLinkedEntities,
            building_id: buildingId,
            unit_id: unitId,
            tenant_id: tenantId,
            supplier_id: supplierId,
            auto_linked: autoLinkedEntities.length > 0,
            processing_status: 'completed'
        });

        console.log(`Document processing completed: ${documentName}`);
    } catch (error) {
        console.error('Document processing failed:', error);
        await base44.asServiceRole.entities.SmartDocumentClassification.update(classificationId, {
            processing_status: 'failed'
        });
    }
}

function getExtractionPrompt(documentType) {
    const prompts = {
        invoice: `Extrahiere alle relevanten Daten aus dieser Rechnung im JSON-Format:
{
    "invoice_number": "RE-2024-001",
    "invoice_date": "YYYY-MM-DD",
    "due_date": "YYYY-MM-DD",
    "supplier_name": "Firma XY",
    "supplier_address": "Straße 1, PLZ Stadt",
    "customer_name": "Kunde",
    "total_amount": 1234.56,
    "net_amount": 1000.00,
    "tax_amount": 234.56,
    "currency": "EUR",
    "building_address": "falls erwähnt: Adresse des Gebäudes",
    "unit_number": "falls erwähnt: Wohnungsnummer",
    "description": "Kurzbeschreibung"
}`,
        
        lease_contract: `Extrahiere alle relevanten Daten aus diesem Mietvertrag:
{
    "tenant_name": "Name des Mieters",
    "landlord_name": "Name des Vermieters",
    "building_address": "Gebäudeadresse",
    "unit_number": "Wohnungsnummer",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "monthly_rent": 1000.00,
    "deposit": 3000.00,
    "termination_notice": "3 Monate"
}`,

        employment_contract: `Extrahiere alle relevanten Daten aus diesem Arbeitsvertrag:
{
    "employee_name": "Name des Arbeitnehmers",
    "employer_name": "Name des Arbeitgebers",
    "position": "Position/Rolle",
    "start_date": "YYYY-MM-DD",
    "salary": 50000,
    "notice_period": "3 Monate",
    "probation_period": "6 Monate"
}`,

        operating_cost_statement: `Extrahiere Daten aus dieser Betriebskostenabrechnung:
{
    "building_address": "Gebäudeadresse",
    "unit_number": "Wohnungsnummer",
    "tenant_name": "Mietername",
    "period_start": "YYYY-MM-DD",
    "period_end": "YYYY-MM-DD",
    "total_costs": 1500.00,
    "advance_payments": 1200.00,
    "balance": 300.00
}`,

        other: `Extrahiere alle relevanten Informationen aus diesem Dokument:
{
    "sender": "Absender",
    "recipient": "Empfänger",
    "date": "YYYY-MM-DD",
    "subject": "Betreff",
    "key_information": ["Info 1", "Info 2"],
    "addresses_mentioned": ["Adresse 1"],
    "amounts_mentioned": [1000.00],
    "dates_mentioned": ["YYYY-MM-DD"]
}`
    };

    return prompts[documentType] || prompts.other;
}

async function findEntityLinks(base44, documentType, extractedFields) {
    const suggestions = [];

    try {
        // Suche nach Building
        if (extractedFields.building_address) {
            const buildings = await base44.asServiceRole.entities.Building.list();
            for (const building of buildings) {
                const addressSimilarity = calculateSimilarity(
                    extractedFields.building_address.toLowerCase(),
                    `${building.address} ${building.city}`.toLowerCase()
                );
                
                if (addressSimilarity > 0.6) {
                    suggestions.push({
                        entity_type: 'Building',
                        entity_id: building.id,
                        entity_name: building.name,
                        confidence: Math.round(addressSimilarity * 100),
                        match_reason: `Adresse stimmt überein (${Math.round(addressSimilarity * 100)}%)`
                    });
                }
            }
        }

        // Suche nach Tenant
        if (extractedFields.tenant_name) {
            const tenants = await base44.asServiceRole.entities.Tenant.list();
            for (const tenant of tenants) {
                const fullName = `${tenant.first_name} ${tenant.last_name}`.toLowerCase();
                const nameSimilarity = calculateSimilarity(
                    extractedFields.tenant_name.toLowerCase(),
                    fullName
                );
                
                if (nameSimilarity > 0.7) {
                    suggestions.push({
                        entity_type: 'Tenant',
                        entity_id: tenant.id,
                        entity_name: `${tenant.first_name} ${tenant.last_name}`,
                        confidence: Math.round(nameSimilarity * 100),
                        match_reason: `Name stimmt überein (${Math.round(nameSimilarity * 100)}%)`
                    });
                }
            }
        }

        // Suche nach Supplier (falls Invoice)
        if (documentType === 'invoice' && extractedFields.supplier_name) {
            const suppliers = await base44.asServiceRole.entities.Supplier.list();
            for (const supplier of suppliers) {
                const nameSimilarity = calculateSimilarity(
                    extractedFields.supplier_name.toLowerCase(),
                    supplier.name?.toLowerCase() || ''
                );
                
                if (nameSimilarity > 0.7) {
                    suggestions.push({
                        entity_type: 'Supplier',
                        entity_id: supplier.id,
                        entity_name: supplier.name,
                        confidence: Math.round(nameSimilarity * 100),
                        match_reason: `Lieferantenname stimmt überein (${Math.round(nameSimilarity * 100)}%)`
                    });
                }
            }
        }

        // Suche nach Unit
        if (extractedFields.unit_number) {
            const units = await base44.asServiceRole.entities.Unit.list();
            for (const unit of units) {
                if (unit.unit_number?.toLowerCase().includes(extractedFields.unit_number.toLowerCase())) {
                    suggestions.push({
                        entity_type: 'Unit',
                        entity_id: unit.id,
                        entity_name: unit.unit_number,
                        confidence: 90,
                        match_reason: 'Einheitsnummer gefunden'
                    });
                }
            }
        }

    } catch (error) {
        console.error('Entity linking failed:', error);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
}

function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Einfache Ähnlichkeitsberechnung
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
        for (const word2 of words2) {
            if (word1.length > 2 && word2.includes(word1)) {
                matches++;
                break;
            }
        }
    }
    
    return matches / Math.max(words1.length, words2.length);
}