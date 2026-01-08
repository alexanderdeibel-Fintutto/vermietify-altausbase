import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { building_id, tax_year } = await req.json();

    console.log('[OPTIMIZE] Generating tax optimization suggestions');

    const year = tax_year || new Date().getFullYear() - 1;
    const suggestions = [];

    // Hole Finanz-Daten
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const financialItems = await base44.entities.FinancialItem.filter({
      building_id,
      date: { $gte: yearStart.toISOString(), $lte: yearEnd.toISOString() }
    });

    const expenses = financialItems.filter(f => f.type === 'expense');
    const income = financialItems.filter(f => f.type === 'income');

    const totalExpenses = expenses.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
    const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);

    // Optimierung 1: Fehlende Ausgaben-Kategorien
    const maintenanceExpenses = expenses.filter(e => 
      e.category?.toLowerCase().includes('instandhaltung') || 
      e.category?.toLowerCase().includes('reparatur')
    );

    if (maintenanceExpenses.length === 0) {
      suggestions.push({
        category: 'Instandhaltung',
        priority: 'high',
        potential_savings: 1000,
        title: 'Keine Instandhaltungskosten erfasst',
        description: 'Reparaturen und Instandhaltungsmaßnahmen sind sofort absetzbar und reduzieren Ihre Steuerlast erheblich.',
        action: 'Prüfen Sie, ob im Jahr Reparaturen, Renovierungen oder Wartungen durchgeführt wurden.',
        examples: [
          'Heizungswartung',
          'Dachreparaturen',
          'Malerarbeiten',
          'Elektriker-Einsätze',
          'Rohrreinigung'
        ]
      });
    }

    // Optimierung 2: Verwaltungskosten
    const adminExpenses = expenses.filter(e => 
      e.category?.toLowerCase().includes('verwaltung')
    );
    const adminTotal = adminExpenses.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);

    if (adminTotal < 500) {
      suggestions.push({
        category: 'Verwaltung',
        priority: 'medium',
        potential_savings: 500,
        title: 'Verwaltungskosten scheinen niedrig',
        description: 'Viele Kosten der Immobilienverwaltung können steuerlich geltend gemacht werden.',
        action: 'Erfassen Sie alle administrativen Aufwendungen',
        examples: [
          'Kontoführungsgebühren (anteilig)',
          'Software & Apps (z.B. diese Verwaltungssoftware)',
          'Porto & Versand',
          'Büromaterial',
          'Steuerberatung',
          'Fahrtkosten zu Objekten'
        ]
      });
    }

    // Optimierung 3: Schuldzinsen
    const interestExpenses = expenses.filter(e => 
      e.category?.toLowerCase().includes('zins')
    );

    if (interestExpenses.length === 0 && totalIncome > 5000) {
      suggestions.push({
        category: 'Finanzierung',
        priority: 'medium',
        potential_savings: 2000,
        title: 'Keine Schuldzinsen erfasst',
        description: 'Kreditzinsen für vermietete Immobilien sind vollständig absetzbar.',
        action: 'Erfassen Sie Darlehenszinsen aus Ihren Finanzierungsverträgen',
        examples: [
          'Hypothekenzinsen',
          'Bauzinsen',
          'Modernisierungskredite'
        ]
      });
    }

    // Optimierung 4: Nebenkosten-Nachzahlung
    const utilitiesExpenses = expenses.filter(e => 
      e.category?.toLowerCase().includes('nebenkosten')
    );

    if (utilitiesExpenses.length > 0 && totalIncome > 0) {
      const utilitiesTotal = utilitiesExpenses.reduce((sum, e) => sum + Math.abs(e.amount || 0), 0);
      const utilitiesRatio = utilitiesTotal / totalIncome;

      if (utilitiesRatio > 0.3) {
        suggestions.push({
          category: 'Nebenkosten',
          priority: 'info',
          potential_savings: 0,
          title: 'Hohe Nebenkosten erkannt',
          description: 'Nicht umlagefähige Nebenkosten können Sie vollständig absetzen.',
          action: 'Prüfen Sie die Nebenkostenabrechnung auf nicht umlagefähige Positionen',
          examples: [
            'Verwaltungskosten',
            'Instandhaltungsrücklage',
            'Nicht umgelegte Betriebskosten'
          ]
        });
      }
    }

    // Optimierung 5: AfA prüfen
    const buildings = await base44.entities.Building.filter({ id: building_id });
    const building = buildings[0];

    if (building && building.purchase_price && !building.afa_start_date) {
      const landValue = building.land_value || building.purchase_price * 0.2;
      const buildingValue = building.purchase_price - landValue;
      const potentialAfa = buildingValue * 0.02;

      suggestions.push({
        category: 'AfA',
        priority: 'high',
        potential_savings: potentialAfa * 0.25, // 25% Steuersatz
        title: 'AfA nicht aktiviert',
        description: 'Die Abschreibung für Abnutzung (AfA) ist eine der wichtigsten Steuerersparnisse bei Immobilien.',
        action: 'Aktivieren Sie die AfA für dieses Gebäude',
        examples: [
          `Gebäudewert: ${buildingValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`,
          `Jährliche AfA (2%): ${potentialAfa.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`,
          `Geschätzte Steuerersparnis: ${(potentialAfa * 0.25).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`
        ]
      });
    }

    // Berechne Gesamtpotenzial
    const totalSavingsPotential = suggestions.reduce((sum, s) => sum + s.potential_savings, 0);

    console.log(`[SUCCESS] Generated ${suggestions.length} optimization suggestions`);

    return Response.json({
      success: true,
      suggestions: suggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, info: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      total_potential_savings: totalSavingsPotential,
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        optimization_count: suggestions.length
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});