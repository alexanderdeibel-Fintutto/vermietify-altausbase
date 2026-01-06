import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Detaillierte Einnahmenberechnung für Anlage V
 * Ermittelt alle Einnahmen aus Vermietung & Verpachtung
 */

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { building_id, tax_year } = await req.json();

        // Zeitraum definieren
        const yearStart = `${tax_year}-01-01`;
        const yearEnd = `${tax_year}-12-31`;

        // Mietverträge für Soll-Miete
        const contracts = await base44.entities.LeaseContract.filter({
            building_id: building_id
        });

        // Tatsächliche Zahlungen (Ist-Miete)
        const payments = await base44.entities.Payment.filter({
            related_to_contract_id: { $in: contracts.map(c => c.id) }
        });

        const financialItems = await base44.entities.FinancialItem.filter({
            related_to_unit_id: { $in: contracts.map(c => c.unit_id).filter(Boolean) }
        });

        // Soll-Miete berechnen (Zeile 13)
        let sollMiete = 0;
        for (const contract of contracts) {
            // Prüfen ob Vertrag im Steuerjahr aktiv
            const startDate = new Date(contract.start_date);
            const endDate = contract.end_date ? new Date(contract.end_date) : new Date('2099-12-31');
            const yearStartDate = new Date(yearStart);
            const yearEndDate = new Date(yearEnd);

            if (startDate <= yearEndDate && endDate >= yearStartDate) {
                // Anteilige Berechnung bei unterjährigen Verträgen
                const effectiveStart = startDate > yearStartDate ? startDate : yearStartDate;
                const effectiveEnd = endDate < yearEndDate ? endDate : yearEndDate;
                
                const months = this.calculateMonthsBetween(effectiveStart, effectiveEnd);
                sollMiete += (contract.rent_cold || 0) * months;
            }
        }

        // Ist-Miete berechnen (Zeile 14)
        const istMiete = payments
            .filter(p => p.category === 'rent' && p.status === 'paid')
            .filter(p => {
                const paymentDate = new Date(p.due_date || p.created_date);
                return paymentDate >= new Date(yearStart) && paymentDate <= new Date(yearEnd);
            })
            .reduce((sum, p) => sum + (p.expected_amount || 0), 0);

        // Vereinnahmte Miete (Zeile 15)
        const vereinnahmteMiete = Math.min(sollMiete, istMiete);

        // Nachzahlungen/Vorauszahlungen (Zeile 16-17)
        const nachzahlungen = financialItems
            .filter(f => f.type === 'receivable' && f.category === 'rent_adjustment')
            .filter(f => f.status === 'paid')
            .reduce((sum, f) => sum + (f.amount || 0), 0);

        // Mietminderungen/Ausfälle (Zeile 18-19)
        const mietminderungen = financialItems
            .filter(f => f.category === 'rent_reduction')
            .reduce((sum, f) => sum + Math.abs(f.amount || 0), 0);

        const mietausfaelle = sollMiete - istMiete > 0 ? sollMiete - istMiete : 0;

        // Umlagen vereinnahmt (Zeile 20)
        const umlagen = payments
            .filter(p => p.category === 'utilities' && p.status === 'paid')
            .filter(p => {
                const paymentDate = new Date(p.due_date || p.created_date);
                return paymentDate >= new Date(yearStart) && paymentDate <= new Date(yearEnd);
            })
            .reduce((sum, p) => sum + (p.expected_amount || 0), 0);

        // Sonstige Einnahmen (Zeile 21-23)
        const sonstigeEinnahmen = financialItems
            .filter(f => f.type === 'receivable' && 
                   ['parking', 'storage', 'other_income'].includes(f.category))
            .filter(f => f.status === 'paid')
            .reduce((sum, f) => sum + (f.amount || 0), 0);

        // Summe Einnahmen (Zeile 32)
        const summeEinnahmen = vereinnahmteMiete + nachzahlungen - mietminderungen - mietausfaelle + umlagen + sonstigeEinnahmen;

        return Response.json({
            success: true,
            einnahmen: {
                zeile_13_soll_miete: Math.round(sollMiete * 100) / 100,
                zeile_14_ist_miete: Math.round(istMiete * 100) / 100,
                zeile_15_vereinnahmt: Math.round(vereinnahmteMiete * 100) / 100,
                zeile_16_17_nachzahlungen: Math.round(nachzahlungen * 100) / 100,
                zeile_18_19_minderungen: Math.round((mietminderungen + mietausfaelle) * 100) / 100,
                zeile_20_umlagen: Math.round(umlagen * 100) / 100,
                zeile_21_23_sonstige: Math.round(sonstigeEinnahmen * 100) / 100,
                zeile_32_summe: Math.round(summeEinnahmen * 100) / 100
            },
            details: {
                contracts_count: contracts.length,
                payments_count: payments.length,
                financial_items_count: financialItems.length
            }
        });

    } catch (error) {
        console.error('Calculate Einnahmen error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function calculateMonthsBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    
    // Anteilige Berechnung bei Teilmonaten
    const startDayFactor = (30 - start.getDate() + 1) / 30;
    const endDayFactor = end.getDate() / 30;
    
    return Math.max(0, months + startDayFactor + endDayFactor - 1);
}