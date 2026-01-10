import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateType, tenantId, contractId, buildingId, unitId, customData } = await req.json();

    // Fetch relevant data
    let tenant = null;
    let contract = null;
    let building = null;
    let unit = null;

    if (tenantId) {
      tenant = (await base44.entities.Tenant.filter({ id: tenantId }))[0];
    }

    if (contractId) {
      contract = (await base44.entities.LeaseContract.filter({ id: contractId }))[0];
    }

    if (buildingId) {
      building = (await base44.entities.Building.filter({ id: buildingId }))[0];
    }

    if (unitId) {
      unit = (await base44.entities.Unit.filter({ id: unitId }))[0];
    }

    // Build context for AI
    const context = {
      tenant: tenant ? {
        name: `${tenant.first_name} ${tenant.last_name}`,
        email: tenant.email,
        phone: tenant.phone,
        birthdate: tenant.birthdate
      } : null,
      contract: contract ? {
        start_date: contract.start_date,
        end_date: contract.end_date,
        base_rent: contract.base_rent,
        utilities: contract.utilities,
        total_rent: contract.total_rent,
        deposit: contract.deposit,
        rent_due_day: contract.rent_due_day
      } : null,
      building: building ? {
        name: building.name,
        address: `${building.street} ${building.house_number}, ${building.postal_code} ${building.city}`
      } : null,
      unit: unit ? {
        name: unit.name,
        floor: unit.floor,
        size: unit.size,
        rooms: unit.rooms
      } : null,
      customData: customData || {}
    };

    // Define templates
    const templates = {
      lease_agreement: `Erstelle einen professionellen Mietvertrag auf Deutsch mit folgenden Informationen:

Vermieter: [Wird vom System eingefügt]
Mieter: ${context.tenant?.name || '[NAME]'}
Adresse: ${context.tenant?.email || '[EMAIL]'}

Mietobjekt:
- Gebäude: ${context.building?.name || '[GEBÄUDE]'}
- Adresse: ${context.building?.address || '[ADRESSE]'}
- Einheit: ${context.unit?.name || '[EINHEIT]'}
- Stockwerk: ${context.unit?.floor || '[STOCKWERK]'}
- Größe: ${context.unit?.size || '[GRÖSSE]'} m²
- Zimmer: ${context.unit?.rooms || '[ZIMMER]'}

Mietkonditionen:
- Mietbeginn: ${context.contract?.start_date || new Date().toISOString().split('T')[0]}
- Kaltmiete: ${context.contract?.base_rent || '[BETRAG]'} €
- Nebenkosten: ${context.contract?.utilities || '[BETRAG]'} €
- Warmmiete: ${context.contract?.total_rent || '[BETRAG]'} €
- Kaution: ${context.contract?.deposit || '[BETRAG]'} €
- Fälligkeitstag: ${context.contract?.rent_due_day || '1'}. des Monats

Erstelle einen vollständigen, rechtssicheren Mietvertrag mit allen notwendigen Klauseln (Kündigungsfrist, Schönheitsreparaturen, Hausordnung, etc.). Formatiere ihn professionell mit Überschriften und Absätzen.`,

      notice_to_vacate: `Erstelle eine professionelle Kündigungsbestätigung/Kündigungsschreiben auf Deutsch:

Mieter: ${context.tenant?.name || '[NAME]'}
Adresse: ${context.building?.address || '[ADRESSE]'}
Einheit: ${context.unit?.name || '[EINHEIT]'}

Vertragsdaten:
- Mietbeginn: ${context.contract?.start_date || '[DATUM]'}
- Kündigungsdatum: ${customData?.notice_date || '[DATUM]'}
- Auszugsdatum: ${customData?.moveout_date || '[DATUM]'}
- Kündigungsfrist: ${customData?.notice_period || '3'} Monate

Erstelle ein formelles Kündigungsschreiben, das die Kündigung bestätigt, wichtige Termine nennt und Hinweise zur Wohnungsübergabe gibt.`,

      maintenance_summary: `Erstelle eine professionelle Wartungszusammenfassung auf Deutsch:

Mieter: ${context.tenant?.name || '[NAME]'}
Objekt: ${context.building?.name || '[GEBÄUDE]'} - ${context.unit?.name || '[EINHEIT]'}

Zeitraum: ${customData?.period || 'Letzten 30 Tage'}

Anzahl Meldungen: ${customData?.issueCount || '[ANZAHL]'}
Gelöste Meldungen: ${customData?.resolvedCount || '[ANZAHL]'}
Durchschnittliche Bearbeitungszeit: ${customData?.avgResolutionTime || '[ZEIT]'}

Erstelle einen übersichtlichen Bericht über alle Wartungsarbeiten, inklusive Kategorisierung nach Art der Störung und Empfehlungen für präventive Maßnahmen.`,

      rent_increase_notice: `Erstelle ein professionelles Mieterhöhungsschreiben auf Deutsch:

Mieter: ${context.tenant?.name || '[NAME]'}
Adresse: ${context.building?.address || '[ADRESSE]'}
Einheit: ${context.unit?.name || '[EINHEIT]'}

Aktuelle Miete: ${context.contract?.total_rent || '[BETRAG]'} €
Neue Miete: ${customData?.new_rent || '[BETRAG]'} €
Erhöhung: ${customData?.increase_amount || '[BETRAG]'} € (${customData?.increase_percent || '[PROZENT]'}%)
Gültig ab: ${customData?.effective_date || '[DATUM]'}

Begründung: ${customData?.reason || 'Anpassung an ortsübliche Vergleichsmiete'}

Erstelle ein rechtssicheres Mieterhöhungsschreiben mit allen erforderlichen rechtlichen Hinweisen und Fristen.`,

      handover_protocol: `Erstelle ein detailliertes Wohnungsübergabeprotokoll auf Deutsch:

Mieter: ${context.tenant?.name || '[NAME]'}
Adresse: ${context.building?.address || '[ADRESSE]'}
Einheit: ${context.unit?.name || '[EINHEIT]'}
Größe: ${context.unit?.size || '[GRÖSSE]'} m²
Zimmer: ${context.unit?.rooms || '[ZIMMER]'}

Art der Übergabe: ${customData?.handover_type || 'Einzug'}
Datum: ${customData?.handover_date || new Date().toISOString().split('T')[0]}

Erstelle ein professionelles Übergabeprotokoll mit allen Räumen, Checklisten für Böden, Wände, Fenster, Türen, Sanitär, Elektrik, und Platz für Zählerstände und Schlüsselübergabe.`
    };

    const prompt = templates[templateType] || templates.lease_agreement;

    // Generate document using AI
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    return Response.json({
      content: result,
      context: context,
      templateType: templateType
    });

  } catch (error) {
    console.error('Error generating document:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});