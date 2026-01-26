import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Hauptberechnung der Nebenkostenabrechnung (Backend-First Approach)
 * 
 * Input:
 * - buildingId: string
 * - periodStart: date string
 * - periodEnd: date string
 * - selectedUnits: array of unit IDs
 * - costItems: array of { costTypeId, amount, distributionKey, invoiceIds?, manualEntry? }
 * - directCosts: object { costId: { contractId: amount } }
 * 
 * Output:
 * - statementId: string
 * - tenantResults: array of tenant-specific billing results
 * - summary: { totalCosts, totalAdvances, totalRefunds, totalBalances }
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { buildingId, periodStart, periodEnd, selectedUnits, costItems, directCosts } = payload;

    // 1. Daten laden
    const building = await base44.entities.Building.get(buildingId);
    const units = await base44.entities.Unit.filter({ gebaeude_id: buildingId });
    const filteredUnits = units.filter(u => selectedUnits.includes(u.id));
    
    // 2. Mietverträge und Leerstände ermitteln
    const allContracts = await base44.entities.LeaseContract.list();
    const relevantContracts = allContracts.filter(c => 
      selectedUnits.includes(c.unit_id) &&
      c.start_date <= periodEnd &&
      (!c.end_date || c.end_date >= periodStart)
    );

    // 3. Zeiträume berechnen
    const { contracts, vacancies } = await calculatePeriodsAndVacancies(
      filteredUnits, 
      relevantContracts, 
      periodStart, 
      periodEnd
    );

    // 4. OperatingCostStatement erstellen
    const statement = await base44.entities.OperatingCostStatement.create({
      building_id: buildingId,
      abrechnungsjahr: new Date(periodStart).getFullYear(),
      zeitraum_von: periodStart,
      zeitraum_bis: periodEnd,
      erstellungsdatum: new Date().toISOString().split('T')[0],
      status: 'Berechnet',
      gesamtflaeche: filteredUnits.reduce((sum, u) => sum + (u.wohnflaeche_qm || 0), 0),
      gesamtpersonen: contracts.reduce((sum, c) => sum + (c.number_of_persons || 0), 0)
    });

    // 5. OperatingCostItems erstellen
    const createdItems = [];
    for (const costItem of costItems) {
      const item = await base44.entities.OperatingCostItem.create({
        statement_id: statement.id,
        kostenart: costItem.costType,
        bezeichnung: costItem.description,
        gesamtbetrag: costItem.amount,
        verteilerschluessel: costItem.distributionKey,
        verteilungsgrundlage_gesamt: await calculateDistributionBase(
          costItem.distributionKey,
          filteredUnits,
          contracts
        )
      });
      createdItems.push(item);
    }

    // 6. Kostenverteilung berechnen (für alle Items)
    const allItems = [...contracts, ...vacancies];
    const tenantResults = [];
    
    for (const item of allItems) {
      const result = await base44.asServiceRole.functions.invoke('calculateTenantShare', {
        statementId: statement.id,
        itemId: item.id,
        isVacancy: item.is_vacancy || false,
        periodStart,
        periodEnd,
        costItems: createdItems,
        directCosts: directCosts || {}
      });
      
      tenantResults.push(result.data);
    }

    // 7. Summary berechnen
    const summary = {
      totalCosts: tenantResults.reduce((sum, r) => sum + r.totalCost, 0),
      totalAdvances: tenantResults.reduce((sum, r) => sum + r.advancePayments, 0),
      totalRefunds: tenantResults.filter(r => r.difference < 0).reduce((sum, r) => sum + Math.abs(r.difference), 0),
      totalBalances: tenantResults.filter(r => r.difference > 0).reduce((sum, r) => sum + r.difference, 0)
    };

    // 8. Statement aktualisieren
    await base44.entities.OperatingCostStatement.update(statement.id, {
      gesamtkosten: summary.totalCosts,
      gesamtvorauszahlungen: summary.totalAdvances,
      gesamtergebnis: summary.totalBalances - summary.totalRefunds
    });

    return Response.json({
      success: true,
      statementId: statement.id,
      tenantResults,
      summary
    });

  } catch (error) {
    console.error('Error calculating statement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper: Zeiträume und Leerstände berechnen
async function calculatePeriodsAndVacancies(units, contracts, periodStart, periodEnd) {
  const result = { contracts: [], vacancies: [] };
  
  for (const unit of units) {
    const unitContracts = contracts
      .filter(c => c.unit_id === unit.id)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

    // Effektive Zeiträume berechnen
    for (const contract of unitContracts) {
      const effectiveStart = contract.start_date < periodStart ? periodStart : contract.start_date;
      const effectiveEnd = !contract.end_date || contract.end_date > periodEnd 
        ? periodEnd 
        : contract.end_date;
      
      result.contracts.push({
        ...contract,
        effective_start: effectiveStart,
        effective_end: effectiveEnd,
        unit_id: unit.id
      });
    }

    // Leerstände identifizieren
    let currentDate = new Date(periodStart);
    const endDate = new Date(periodEnd);
    
    while (currentDate <= endDate) {
      const dayStr = currentDate.toISOString().split('T')[0];
      const isCovered = unitContracts.some(c => 
        dayStr >= c.start_date && (!c.end_date || dayStr <= c.end_date)
      );
      
      if (!isCovered) {
        // Leerstandsperiode finden oder erstellen
        const lastVacancy = result.vacancies[result.vacancies.length - 1];
        if (lastVacancy && lastVacancy.unit_id === unit.id) {
          lastVacancy.vacancy_end = dayStr;
        } else {
          result.vacancies.push({
            unit_id: unit.id,
            vacancy_start: dayStr,
            vacancy_end: dayStr,
            is_vacancy: true
          });
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return result;
}

// Helper: Verteilungsgrundlage berechnen
async function calculateDistributionBase(distributionKey, units, contracts) {
  if (distributionKey === 'Flaeche') {
    return units.reduce((sum, u) => sum + (u.wohnflaeche_qm || 0), 0);
  } else if (distributionKey === 'Personen') {
    return contracts.reduce((sum, c) => sum + (c.number_of_persons || 0), 0);
  } else if (distributionKey === 'Einheiten') {
    return units.length;
  }
  return 0;
}