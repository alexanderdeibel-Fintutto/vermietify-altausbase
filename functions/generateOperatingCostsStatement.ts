import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { buildingId, year, forceRegenerate } = body;

        if (!buildingId || !year) {
            return Response.json({ error: 'buildingId und year erforderlich' }, { status: 400 });
        }

        // Prüfe ob Abrechnung für dieses Jahr bereits existiert
        const existingStatement = await base44.entities.OperatingCostStatement.filter({
            building_id: buildingId,
            year: year
        });

        if (existingStatement.length > 0 && !forceRegenerate) {
            return Response.json({ error: 'Betriebskostenabrechnung existiert bereits' }, { status: 400 });
        }

        // Sammle alle Betriebskosten für das Jahr
        const operatingCosts = await base44.entities.OperatingCostStatementItem.filter({
            building_id: buildingId,
            cost_year: year
        });

        if (operatingCosts.length === 0) {
            return Response.json({ error: 'Keine Betriebskosten für dieses Jahr gefunden' }, { status: 404 });
        }

        // Berechne Gesamtbetriebskosten pro Kategorie
        const costsByCategory = {};
        let totalCosts = 0;

        operatingCosts.forEach(cost => {
            const category = cost.cost_category || 'other';
            if (!costsByCategory[category]) {
                costsByCategory[category] = 0;
            }
            costsByCategory[category] += cost.amount || 0;
            totalCosts += cost.amount || 0;
        });

        // Hole alle aktiven Mietverträge für das Gebäude
        const contracts = await base44.entities.LeaseContract.filter({
            status: 'active'
        });

        const buildingContracts = contracts.filter(c => c.unit_id && c.unit_id.includes(buildingId));

        if (buildingContracts.length === 0) {
            return Response.json({ error: 'Keine aktiven Mietverträge gefunden' }, { status: 404 });
        }

        // Erstelle Betriebskostenabrechnung
        const statement = await base44.entities.OperatingCostStatement.create({
            building_id: buildingId,
            year: year,
            total_costs: totalCosts,
            costs_by_category: costsByCategory,
            number_of_units: buildingContracts.length,
            statement_date: new Date().toISOString().split('T')[0],
            status: 'draft'
        });

        const generatedDocuments = [];

        // Generiere Abrechnungsdokumente pro Mieter
        for (const contract of buildingContracts) {
            const tenant = await base44.entities.Tenant.filter({ id: contract.tenant_id });
            if (!tenant || !tenant[0]) continue;

            // Berechne Anteil pro Mieter (vereinfacht: gleichmäßige Verteilung)
            const tenantCosts = totalCosts / buildingContracts.length;
            
            // Hole bisherige Zahlungen (Vorauszahlungen)
            const prepayments = contract.utilities || 0;
            const balance = prepayments - tenantCosts;

            // Generiere Betriebskostenabrechnung
            const doc = await base44.entities.GeneratedDocument.create({
                document_type: 'betriebskostenabrechnung',
                contract_id: contract.id,
                tenant_id: contract.tenant_id,
                unit_id: contract.unit_id,
                building_id: buildingId,
                document_data: {
                    statementNumber: `BKA-${year}-${buildingId.substring(0, 6)}-${contract.id.substring(0, 6)}`,
                    year: year,
                    issueDate: new Date().toISOString().split('T')[0],
                    tenantName: `${tenant[0]?.first_name} ${tenant[0]?.last_name}`,
                    costsBreakdown: costsByCategory,
                    totalCosts: tenantCosts,
                    prepaidAmount: prepayments,
                    balance: balance,
                    description: balance > 0 ? 'Erstattung' : 'Nachzahlung'
                },
                distribution_status: 'generated'
            });

            generatedDocuments.push({
                documentId: doc.id,
                tenantId: contract.tenant_id,
                amount: tenantCosts,
                balance: balance,
                email: tenant[0]?.email
            });
        }

        // Aktualisiere Statement Status
        await base44.entities.OperatingCostStatement.update(statement.id, {
            status: 'generated'
        });

        // Versende Abrechnungen per Email
        for (const doc of generatedDocuments) {
            if (doc.email) {
                const balanceText = doc.balance > 0 
                    ? `Erstattung: ${Math.abs(doc.balance).toFixed(2)}€`
                    : `Nachzahlung: ${Math.abs(doc.balance).toFixed(2)}€`;

                await base44.integrations.Core.SendEmail({
                    to: doc.email,
                    subject: `Betriebskostenabrechnung ${year}`,
                    body: `Sehr geehrte Damen und Herren,\n\nhiermit erhalten Sie Ihre Betriebskostenabrechnung für das Jahr ${year}.\n\nGesamtbetriebskosten (Ihr Anteil): ${doc.amount.toFixed(2)}€\nBisherige Zahlungen: ${(doc.amount - doc.balance).toFixed(2)}€\n\n${balanceText}\n\nBitte begleichen Sie offene Beträge bis zum 31.01. des nächsten Jahres.\n\nMit freundlichen Grüßen`
                });
            }
        }

        return Response.json({
            success: true,
            statementId: statement.id,
            year: year,
            totalCosts: totalCosts,
            unitsProcessed: generatedDocuments.length,
            documentsGenerated: generatedDocuments.length,
            message: `Betriebskostenabrechnung ${year} mit ${generatedDocuments.length} Dokumenten erstellt und versendet`
        });
    } catch (error) {
        console.error('Fehler:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});