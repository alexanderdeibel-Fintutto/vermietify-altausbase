import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PACKAGE_FLOWS = {
  immobilienverwaltung: {
    eigenheimbesitzer: ['user_type_detected', 'simple_object', 'tax_setup', 'completion'],
    vermieter: ['user_type_detected', 'simple_object', 'quick_tenant', 'tax_setup', 'bank_hint', 'completion'],
    verwalter: ['user_type_detected', 'simple_object', 'multi_object_hint', 'automation_hint', 'completion']
  },
  persoenliche_finanzen: {
    angestellter: ['user_type_detected', 'account_setup', 'expense_categories', 'budget_setup', 'completion'],
    familie: ['user_type_detected', 'account_setup', 'family_categories', 'budget_goals', 'completion'],
    student: ['user_type_detected', 'simple_budget', 'completion']
  },
  selbstaendig: {
    freelancer: ['user_type_detected', 'business_setup', 'client_setup', 'invoice_template', 'completion'],
    kleinunternehmer: ['user_type_detected', 'business_setup', 'client_setup', 'tax_hints', 'completion'],
    dienstleister: ['user_type_detected', 'business_setup', 'service_setup', 'completion']
  }
};

const STEP_MESSAGES = {
  user_type_detected: (userType) => `Super! Ich erkenne, dass Sie ${userType} sind. Perfekt! 🎯\n\nLassen Sie uns mit Ihrem ersten Objekt starten.`,
  simple_object: () => `Bitte füllen Sie die Informationen zu Ihrem Objekt aus.`,
  quick_tenant: () => `Sehr gut! 🏠 Möchten Sie jetzt Ihren ersten Mieter hinzufügen?`,
  tax_setup: () => `Fast geschafft! Jetzt noch kurz die Steuer-Kategorien einrichten.`,
  bank_hint: () => `💡 Tipp: Mit einer Bank-Verbindung können Sie Zahlungen automatisch zuordnen. Möchten Sie das später einrichten?`,
  completion: (userType) => `🎉 Fantastisch! Ihr Setup ist komplett!\n\nSie können jetzt richtig loslegen mit EasyVermieter. Viel Erfolg!`
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user_package, user_type, current_step, completed_steps = [] } = await req.json();

    // Bestimme Flow für User-Typ
    const flow = PACKAGE_FLOWS[user_package]?.[user_type] || ['completion'];
    
    // Finde nächsten Schritt
    const currentIndex = flow.indexOf(current_step);
    const nextStep = currentIndex >= 0 && currentIndex < flow.length - 1 
      ? flow[currentIndex + 1] 
      : flow[0];

    // Generiere Message für nächsten Schritt
    const message = STEP_MESSAGES[nextStep] 
      ? STEP_MESSAGES[nextStep](user_type)
      : 'Was möchten Sie als nächstes tun?';

    // Bestimme welche Komponente angezeigt werden soll
    let component = null;
    let suggestions = [];

    switch (nextStep) {
      case 'simple_object':
        component = 'object';
        break;
      case 'quick_tenant':
        component = null;
        suggestions = [
          { label: '✅ Ja, Mieter hinzufügen', value: 'tenant_yes' },
          { label: '⏭️ Später', value: 'tenant_skip' }
        ];
        break;
      case 'tax_setup':
        component = 'tax';
        break;
      case 'bank_hint':
        component = null;
        suggestions = [
          { label: '💳 Bank verbinden', value: 'bank_connect' },
          { label: '⏭️ Später', value: 'bank_skip' }
        ];
        break;
      case 'completion':
        component = 'completion';
        break;
    }

    return Response.json({
      next_step: nextStep,
      message,
      component,
      suggestions,
      progress: {
        current: completed_steps.length + 1,
        total: flow.length
      }
    });

  } catch (error) {
    console.error('Error orchestrating step:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});