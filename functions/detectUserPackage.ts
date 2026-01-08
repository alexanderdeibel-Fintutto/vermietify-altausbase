import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const PACKAGE_MODULES = {
  immobilienverwaltung: [
    "objektverwaltung", "mieterverwaltung", "finanzverwaltung", 
    "steuern", "betriebskosten", "dokumentenverwaltung", 
    "kommunikation", "aufgaben", "banking", "eigentuemer", "vertraege"
  ],
  persoenliche_finanzen: [
    "finanzverwaltung", "steuern", "banking", "budgeting", "ausgaben_tracking"
  ],
  selbstaendig: [
    "finanzverwaltung", "steuern", "rechnungsstellung", 
    "kundenverwaltung", "projektmanagement", "banking"
  ]
};

const PACKAGE_USER_TYPES = {
  immobilienverwaltung: [
    "eigenheimbesitzer", "vermieter", "verwalter", "steuerberater"
  ],
  persoenliche_finanzen: [
    "angestellter", "rentner", "student", "familie", "sparer"
  ],
  selbstaendig: [
    "freelancer", "kleinunternehmer", "dienstleister", "handwerker", "berater"
  ]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Methode 1: Aus User-Subscription/Profil
    let detectedPackage = user.subscription_plan || user.app_package;

    // Methode 2: Aus UserPackageConfig Entity
    if (!detectedPackage) {
      const configResult = await base44.entities.UserPackageConfig.filter({
        user_id: user.id
      });
      detectedPackage = configResult[0]?.package_name;
    }

    // Fallback: Immobilienverwaltung (aktuell implementiert)
    if (!detectedPackage) {
      detectedPackage = "immobilienverwaltung";
    }

    return Response.json({
      package: detectedPackage,
      available_modules: PACKAGE_MODULES[detectedPackage] || [],
      user_types: PACKAGE_USER_TYPES[detectedPackage] || [],
      package_display_name: detectedPackage === 'immobilienverwaltung' ? 'Immobilienverwaltung' :
                           detectedPackage === 'persoenliche_finanzen' ? 'Persönliche Finanzen' :
                           detectedPackage === 'selbstaendig' ? 'Selbständig' : detectedPackage
    });
  } catch (error) {
    console.error('Error detecting user package:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});