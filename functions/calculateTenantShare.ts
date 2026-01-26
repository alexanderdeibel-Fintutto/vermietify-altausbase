import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Berechnet den Kostenanteil eines einzelnen Mieters/Leerstands
 * 
 * Input:
 * - statementId: string
 * - itemId: string (contract or vacancy ID)
 * - isVacancy: boolean
 * - periodStart: date string
 * - periodEnd: date string
 * - costItems: array of OperatingCostItem
 * - directCosts: object { costId: { itemId: amount } }
 * 
 * Output:
 * - totalCost: number
 * - costDetails: array of { category, amount, distributionKey }
 * - advancePayments: number
 * - difference: number
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { statementId, itemId, isVacancy, periodStart, periodEnd, costItems, directCosts } = await req.json();

    // 1. Item-Daten laden
    let item, unit, tenant;
    
    if (isVacancy) {
      // Leerstand - Unit direkt
      unit = await base44.entities.Unit.get(itemId);
      item = { 
        unit_id: unit.id,
        effective_start: periodStart,
        effective_end: periodEnd,
        is_vacancy: true
      };
    } else {
      // Mietvertrag
      const contract = await base44.entities.LeaseContract.get(itemId);
      unit = await base44.entities.Unit.get(contract.unit_id);
      tenant = await base44.entities.Tenant.get(contract.tenant_id);
      item = contract;
    }

    // 2. Zeitanteil berechnen
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);
    const itemStartDate = new Date(item.effective_start || item.start_date);
    const itemEndDate = new Date(item.effective_end || item.end_date || periodEnd);
    
    const totalDays = Math.ceil((periodEndDate - periodStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const itemDays = Math.ceil((itemEndDate - itemStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const dayFactor = itemDays / totalDays;

    // 3. Alle Units und Contracts für Verteilungsberechnung laden
    const statement = await base44.entities.OperatingCostStatement.get(statementId);
    const allUnits = await base44.entities.Unit.filter({ gebaeude_id: statement.building_id });
    const allContracts = await base44.entities.LeaseContract.list();

    // 4. Kostenberechnung
    let totalCost = 0;
    const costDetails = [];

    for (const costItem of costItems) {
      let itemCost = 0;
      
      // Direkte Kosten
      if (costItem.verteilerschluessel === 'direkt' && directCosts?.[costItem.id]?.[itemId]) {
        itemCost = directCosts[costItem.id][itemId];
      }
      // Verteilung nach Fläche
      else if (costItem.verteilerschluessel === 'Flaeche') {
        const totalSqm = allUnits.reduce((sum, u) => sum + (u.wohnflaeche_qm || 0), 0);
        if (totalSqm > 0) {
          itemCost = (costItem.gesamtbetrag * ((unit.wohnflaeche_qm || 0) / totalSqm)) * dayFactor;
        }
      }
      // Verteilung nach Personen
      else if (costItem.verteilerschluessel === 'Personen' && !isVacancy) {
        const totalPersons = allContracts
          .filter(c => c.unit_id && allUnits.some(u => u.id === c.unit_id))
          .reduce((sum, c) => sum + (c.number_of_persons || 0), 0);
        if (totalPersons > 0) {
          itemCost = (costItem.gesamtbetrag * ((item.number_of_persons || 0) / totalPersons)) * dayFactor;
        }
      }
      // Verteilung nach Einheiten
      else if (costItem.verteilerschluessel === 'Einheiten') {
        const totalUnits = allUnits.length;
        itemCost = (costItem.gesamtbetrag / totalUnits) * dayFactor;
      }
      // HeizkostenV - wird von separater Funktion behandelt
      else if (costItem.verteilerschluessel === 'HeizkostenV') {
        const heizkostenResult = await base44.asServiceRole.functions.invoke('calculateHeizkostenV', {
          costItem,
          unitId: unit.id,
          contractId: itemId,
          periodStart,
          periodEnd,
          dayFactor
        });
        itemCost = heizkostenResult.data.amount;
      }

      if (itemCost > 0) {
        costDetails.push({
          category: costItem.kostenart,
          description: costItem.bezeichnung,
          amount: parseFloat(itemCost.toFixed(2)),
          distributionKey: costItem.verteilerschluessel
        });
        totalCost += itemCost;
      }
    }

    // 5. Vorauszahlungen berechnen
    let advancePayments = 0;
    if (!isVacancy) {
      const financialItems = await base44.entities.FinancialItem.filter({
        related_to_contract_id: itemId
      });
      
      advancePayments = financialItems
        .filter(fi => {
          const paymentDate = new Date(fi.payment_month);
          return paymentDate >= periodStartDate && paymentDate <= periodEndDate;
        })
        .reduce((sum, fi) => sum + (fi.amount || 0), 0);
    }

    // 6. Differenz berechnen
    const difference = totalCost - advancePayments;

    // 7. OperatingCostUnitResult speichern
    const unitResult = await base44.entities.OperatingCostUnitResult.create({
      statement_id: statementId,
      unit_id: unit.id,
      contract_id: isVacancy ? null : itemId,
      tenant_id: isVacancy ? null : tenant.id,
      nutzungszeitraum_von: item.effective_start || item.start_date,
      nutzungszeitraum_bis: item.effective_end || item.end_date || periodEnd,
      nutzungstage: itemDays,
      anteil_flaeche: unit.wohnflaeche_qm || 0,
      anteil_personen: isVacancy ? 0 : (item.number_of_persons || 0),
      kosten_anteil_gesamt: parseFloat(totalCost.toFixed(2)),
      vorauszahlungen_gesamt: parseFloat(advancePayments.toFixed(2)),
      ergebnis: parseFloat(difference.toFixed(2)),
      status: 'Berechnet'
    });

    // 8. OperatingCostUnitDetails speichern
    for (const detail of costDetails) {
      await base44.entities.OperatingCostUnitDetail.create({
        unit_result_id: unitResult.id,
        item_id: detail.itemId || null,
        betrag_anteil: detail.amount,
        zeitanteil_faktor: dayFactor
      });
    }

    return Response.json({
      success: true,
      unitResultId: unitResult.id,
      totalCost: parseFloat(totalCost.toFixed(2)),
      costDetails,
      advancePayments: parseFloat(advancePayments.toFixed(2)),
      difference: parseFloat(difference.toFixed(2)),
      tenant: tenant ? {
        id: tenant.id,
        name: `${tenant.first_name} ${tenant.last_name}`,
        email: tenant.email
      } : null,
      unit: {
        id: unit.id,
        unit_number: unit.unit_number,
        wohnflaeche_qm: unit.wohnflaeche_qm
      }
    });

  } catch (error) {
    console.error('Error calculating tenant share:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});