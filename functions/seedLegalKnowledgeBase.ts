import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin required' }, { status: 403 });
    }

    console.log('[SEED] Initializing Legal Knowledge Base...');

    const knowledgeRules = [
      {
        knowledge_category: 'STEUERRECHT',
        topic: 'Anlage V - Vermietung und Verpachtung',
        current_rule: 'Vermietungseinkünfte müssen in der Anlage V erklärt werden. Betriebsausgaben sind abzugsfähig.',
        rule_source: '§ 21 EStG, EStAV 2023',
        affected_legal_forms: ['PRIVATPERSON'],
        affected_modules: ['ELSTER', 'FINANZEN'],
        automated_decision_rule: 'IF tax_form_type == "ANLAGE_V" THEN use_anlage_v_template',
        confidence_threshold: 95,
        is_active: true
      },
      {
        knowledge_category: 'AFA_REGELN',
        topic: 'Abschreibung für Immobilien - Nutzungsdauer',
        current_rule: 'Für Gebäude: 50 Jahre (2% p.a.) ab Fertigstellung. Komponenten können separate AfA haben.',
        rule_source: '§ 7 EStG, AfA-Tabellen',
        affected_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH'],
        affected_modules: ['ELSTER', 'FINANZEN'],
        automated_decision_rule: 'IF building.type == "residential" THEN afa_rate = 2',
        confidence_threshold: 98,
        is_active: true
      },
      {
        knowledge_category: 'BETRIEBSKOSTEN',
        topic: 'Betriebskostenumlage auf Mieter',
        current_rule: 'Betriebskosten sind umlagefähig nach BetrKV. Keine Umlage von Finanzierungskosten.',
        rule_source: 'Betriebskostenverordnung (BetrKV)',
        affected_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH'],
        affected_modules: ['OPERATING_COSTS', 'CONTRACTS'],
        automated_decision_rule: 'IF cost.category.allocatable == true THEN include_in_umlagefaehig',
        confidence_threshold: 90,
        is_active: true
      },
      {
        knowledge_category: 'ELSTER_TECHNICAL',
        topic: 'ERiC Version Kompatibilität',
        current_rule: 'Aktuelle ERiC-Version: 28.0.0 (2024). Backward-compatibility zu Version 25.0.0.',
        rule_source: 'ELSTER/BZSt Entwickler-Dokumentation',
        affected_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH', 'UG', 'AG'],
        affected_modules: ['ELSTER'],
        automated_decision_rule: 'IF eric_version < 25 THEN reject_submission',
        confidence_threshold: 99,
        is_active: true
      },
      {
        knowledge_category: 'MIETRECHT',
        topic: 'Nebenkostenabrechnungen - Fristen',
        current_rule: 'Abrechnung muss innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums erfolgen.',
        rule_source: '§ 556 Abs. 3 BGB',
        affected_legal_forms: ['PRIVATPERSON', 'GBR', 'GMBH'],
        affected_modules: ['CONTRACTS', 'OPERATING_COSTS'],
        automated_decision_rule: 'IF current_date > statement.end_date + 12_months THEN overdue_warning',
        confidence_threshold: 95,
        is_active: true
      }
    ];

    let created = 0;

    for (const rule of knowledgeRules) {
      try {
        const existing = await base44.entities.LegalKnowledgeBase.filter({
          topic: rule.topic
        });

        if (existing.length === 0) {
          await base44.entities.LegalKnowledgeBase.create(rule);
          created++;
        }
      } catch (error) {
        console.error('[ERROR] Creating rule:', error.message);
      }
    }

    return Response.json({
      success: true,
      rules_created: created,
      total_rules: knowledgeRules.length
    });

  } catch (error) {
    console.error('[ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});