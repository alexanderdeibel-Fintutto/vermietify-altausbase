import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ============================================================================
// MASTER-DATEN: KOSTENKATEGORIEN
// ============================================================================

const COST_CATEGORIES = [
  // ERHALTUNGSAUFWAND
  { id: 'K001', name: 'Heizungswartung', name_short: 'Heizung Wartung', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Regelmäßige Wartung der Heizungsanlage' },
  { id: 'K002', name: 'Heizungsreparatur', name_short: 'Heizung Reparatur', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reparatur ohne Substanzmehrung' },
  { id: 'K003', name: 'Dachrinnenreinigung', name_short: 'Dachrinne', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reinigung und Wartung Dachrinnen' },
  { id: 'K004', name: 'Fassadenreinigung', name_short: 'Fassade Reinigung', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reinigung der Außenfassade' },
  { id: 'K005', name: 'Schönheitsreparatur', name_short: 'Schönheitsrep.', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Tapezieren, Streichen innerhalb Wohnung' },
  { id: 'K006', name: 'Malerarbeiten Treppenhaus', name_short: 'Maler Treppenhaus', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Malerarbeiten in Gemeinschaftsflächen' },
  { id: 'K007', name: 'Elektroinstallation Reparatur', name_short: 'Elektro Reparatur', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reparatur vorhandener E-Installationen' },
  { id: 'K008', name: 'Sanitär Reparatur', name_short: 'Sanitär Reparatur', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reparatur Sanitärinstallationen' },
  { id: 'K009', name: 'Fensterreparatur', name_short: 'Fenster Reparatur', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reparatur vorhandener Fenster' },
  { id: 'K010', name: 'Türreparatur', name_short: 'Tür Reparatur', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reparatur vorhandener Türen' },
  { id: 'K011', name: 'Dachdeckerarbeiten Reparatur', name_short: 'Dachdecker Reparatur', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Reparatur Dacheindeckung ohne Erneuerung' },
  { id: 'K012', name: 'Gartenpflege', name_short: 'Garten', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Laufende Gartenpflege und -wartung' },
  { id: 'K013', name: 'Winterdienst', name_short: 'Winterdienst', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Schneeräumung und Streudienst' },
  { id: 'K014', name: 'Schädlingsbekämpfung', name_short: 'Schädlinge', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Professionelle Schädlingsbekämpfung' },
  { id: 'K015', name: 'Aufzugswartung', name_short: 'Aufzug Wartung', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Regelmäßige Wartung Aufzugsanlage' },
  { id: 'K016', name: 'Treppenhausreinigung', name_short: 'Treppe Reinigung', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Professionelle Reinigung Treppenhaus' },
  { id: 'K017', name: 'Glasreinigung', name_short: 'Glasreinigung', type: 'ERHALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Professionelle Fensterreinigung' },
  
  // HERSTELLUNGSKOSTEN
  { id: 'K020', name: 'Neue Heizungsanlage', name_short: 'Heizung Neu', type: 'HERSTELLUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'AFA', standard_depreciation_years: 15, can_be_allocated: false, requires_additional_info: ['Nutzungsdauer'], description: 'Komplette neue Heizung oder Austausch' },
  { id: 'K021', name: 'Neue Elektroinstallation', name_short: 'Elektro Neu', type: 'HERSTELLUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'AFA', standard_depreciation_years: 20, can_be_allocated: false, requires_additional_info: ['Nutzungsdauer'], description: 'Komplette Neuinstallation Elektrik' },
  { id: 'K034', name: 'Grundstückserwerb', name_short: 'Grundstück', type: 'HERSTELLUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'NICHT_ABSETZBAR', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Grundstückskaufpreis (nicht AfA-fähig!)' },
  { id: 'K035', name: 'Gebäudeerwerb', name_short: 'Gebäude Kauf', type: 'HERSTELLUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'AFA', standard_depreciation_years: 50, can_be_allocated: false, requires_additional_info: ['Nutzungsdauer'], description: 'Gebäudekaufpreis (AfA-Basis)' },
  
  // BETRIEBSKOSTEN
  { id: 'K040', name: 'Wasser/Abwasser', name_short: 'Wasser', type: 'BETRIEB', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Laufende Wasserkosten' },
  { id: 'K041', name: 'Heizkosten', name_short: 'Heizkosten', type: 'BETRIEB', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Brennstoffkosten (Öl, Gas, Fernwärme)' },
  { id: 'K042', name: 'Strom Allgemeinstrom', name_short: 'Strom Allgemein', type: 'BETRIEB', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Strom für Gemeinschaftsflächen' },
  { id: 'K043', name: 'Müllabfuhr', name_short: 'Müll', type: 'BETRIEB', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Müllabfuhrgebühren' },
  { id: 'K044', name: 'Straßenreinigung', name_short: 'Straßenreinigung', type: 'BETRIEB', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Kommunale Straßenreinigungsgebühr' },
  { id: 'K045', name: 'Hausmeisterservice', name_short: 'Hausmeister', type: 'BETRIEB', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Hausmeisterkosten' },
  
  // VERWALTUNGSKOSTEN
  { id: 'K050', name: 'Hausverwaltung', name_short: 'Hausverwaltung', type: 'VERWALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'WEG- oder Mietverwaltung' },
  { id: 'K051', name: 'Steuerberater', name_short: 'Steuerberater', type: 'VERWALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Steuerberatungskosten' },
  { id: 'K052', name: 'Rechtsanwalt', name_short: 'Rechtsanwalt', type: 'VERWALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Rechtsberatung Vermietung' },
  { id: 'K053', name: 'Kontoführung', name_short: 'Kontoführung', type: 'VERWALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Kontoführungsgebühren Mietkonto' },
  { id: 'K057', name: 'Mietausfall', name_short: 'Mietausfall', type: 'VERWALTUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Uneinbringliche Miete' },
  
  // VERSICHERUNGEN
  { id: 'K060', name: 'Gebäudeversicherung', name_short: 'Gebäudevers.', type: 'VERSICHERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Wohngebäudeversicherung' },
  { id: 'K061', name: 'Haftpflichtversicherung', name_short: 'Haftpflicht', type: 'VERSICHERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Haus- und Grundbesitzerhaftpflicht' },
  { id: 'K062', name: 'Rechtsschutzversicherung', name_short: 'Rechtsschutz', type: 'VERSICHERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Mietrechtsschutz' },
  
  // STEUERN
  { id: 'K070', name: 'Grundsteuer', name_short: 'Grundsteuer', type: 'STEUER', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: true, requires_additional_info: [], description: 'Jährliche Grundsteuer' },
  
  // FINANZIERUNG
  { id: 'K080', name: 'Darlehen Zinsen', name_short: 'Zinsen', type: 'FINANZIERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: ['Darlehens_ID'], description: 'Sollzinsen auf Darlehen' },
  { id: 'K081', name: 'Darlehen Tilgung', name_short: 'Tilgung', type: 'FINANZIERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'NICHT_ABSETZBAR', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: ['Darlehens_ID'], description: 'Tilgung (nicht absetzbar!)' },
  { id: 'K082', name: 'Disagio', name_short: 'Disagio', type: 'FINANZIERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'VERTEILT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: ['Laufzeit'], description: 'Damnum (verteilt über Laufzeit)' },
  { id: 'K083', name: 'Bereitstellungszinsen', name_short: 'Bereitstellung', type: 'FINANZIERUNG', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Zinsen während Bereitstellung' },
  
  // SONSTIGE
  { id: 'K090', name: 'Gutachterkosten', name_short: 'Gutachter', type: 'SONSTIGE', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Wertgutachten, Energieausweis' },
  { id: 'K091', name: 'Anzeigenkosten Vermietung', name_short: 'Anzeigen', type: 'SONSTIGE', applies_to_legal_form: ['ALLE'], applies_to_usage: ['ALLE'], tax_treatment: 'SOFORT', standard_depreciation_years: null, can_be_allocated: false, requires_additional_info: [], description: 'Inserate Mieterwerbung' }
];

// ============================================================================
// KONTEN: SKR03
// ============================================================================

const ACCOUNTS_SKR03 = {
  PRIVATPERSON: {
    '8400': { name: 'Erlöse 19% USt', tax_line: 'Anlage V, Z. 8+15' },
    '8300': { name: 'Erlöse steuerfrei', tax_line: 'Anlage V, Z. 8' },
    '8921': { name: 'Betriebskostennachzahlungen', tax_line: 'Anlage V, Z. 9' },
    '4832': { name: 'Abschreibungen Gebäude', tax_line: 'Anlage V, Z. 33' },
    '4840': { name: 'Abschreibungen BGA', tax_line: 'Anlage V, Z. 34' },
    '4120': { name: 'Instandhaltung allgemein', tax_line: 'Anlage V, Z. 36' },
    '4121': { name: 'Instandhaltung Heizung', tax_line: 'Anlage V, Z. 36' },
    '4122': { name: 'Instandhaltung Sanitär', tax_line: 'Anlage V, Z. 36' },
    '4123': { name: 'Instandhaltung Elektrik', tax_line: 'Anlage V, Z. 36' },
    '4124': { name: 'Instandhaltung Dach', tax_line: 'Anlage V, Z. 36' },
    '4125': { name: 'Instandhaltung Fassade', tax_line: 'Anlage V, Z. 36' },
    '4126': { name: 'Schönheitsreparaturen', tax_line: 'Anlage V, Z. 36' },
    '4127': { name: 'Malerarbeiten', tax_line: 'Anlage V, Z. 36' },
    '4130': { name: 'Reparatur Aufzug', tax_line: 'Anlage V, Z. 47' },
    '4136': { name: 'Treppenhausreinigung', tax_line: 'Anlage V, Z. 47' },
    '4137': { name: 'Glasreinigung', tax_line: 'Anlage V, Z. 47' },
    '4220': { name: 'Stromkosten', tax_line: 'Anlage V, Z. 47' },
    '4230': { name: 'Heizkosten', tax_line: 'Anlage V, Z. 47' },
    '4240': { name: 'Wasserkosten', tax_line: 'Anlage V, Z. 47' },
    '4250': { name: 'Müllabfuhr', tax_line: 'Anlage V, Z. 47' },
    '4260': { name: 'Straßenreinigung', tax_line: 'Anlage V, Z. 47' },
    '4270': { name: 'Hausmeister', tax_line: 'Anlage V, Z. 45' },
    '4280': { name: 'Garten/Beleuchtung', tax_line: 'Anlage V, Z. 46' },
    '4281': { name: 'Winterdienst', tax_line: 'Anlage V, Z. 46' },
    '4282': { name: 'Schädlingsbekämpfung', tax_line: 'Anlage V, Z. 47' },
    '4290': { name: 'Hausverwaltung', tax_line: 'Anlage V, Z. 47' },
    '4970': { name: 'Steuerberater', tax_line: 'Anlage V, Z. 47' },
    '4980': { name: 'Rechtsanwalt', tax_line: 'Anlage V, Z. 47' },
    '4951': { name: 'Kontoführung', tax_line: 'Anlage V, Z. 47' },
    '4140': { name: 'Grundsteuer', tax_line: 'Anlage V, Z. 41' },
    '4361': { name: 'Gebäudeversicherung', tax_line: 'Anlage V, Z. 43' },
    '4362': { name: 'Haftpflichtversicherung', tax_line: 'Anlage V, Z. 43' },
    '4363': { name: 'Rechtsschutzversicherung', tax_line: 'Anlage V, Z. 43' },
    '4920': { name: 'Zinsen langfristig', tax_line: 'Anlage V, Z. 39' },
    '4921': { name: 'Bereitstellungszinsen', tax_line: 'Anlage V, Z. 39' },
    '4922': { name: 'Disagio', tax_line: 'Anlage V, Z. 39' },
    '4952': { name: 'Gutachterkosten', tax_line: 'Anlage V, Z. 47' },
    '4953': { name: 'Mietausfall', tax_line: 'Anlage V, Z. 47' },
    '0280': { name: 'Grundstücke', tax_line: 'Aktivierung' },
    '0282': { name: 'Gebäude Wohn', tax_line: 'Aktivierung' },
    '0360': { name: 'Heizungsanlage', tax_line: 'Aktivierung' },
    '0650': { name: 'Darlehen', tax_line: 'Passiva' },
    '1200': { name: 'Bank', tax_line: 'Aktiva' },
    '1576': { name: 'Vorsteuer 19%', tax_line: 'USt' },
    '1406': { name: 'Umsatzsteuer 19%', tax_line: 'USt' }
  },
  GMBH: {
    '8400': { name: 'Erlöse 19% USt', tax_line: 'GuV Pos. 1' },
    '8300': { name: 'Erlöse steuerfrei', tax_line: 'GuV Pos. 1' },
    '4832': { name: 'Abschreibungen Gebäude', tax_line: 'GuV Pos. 7a' },
    '4833': { name: 'Abschreibungen Heizung', tax_line: 'GuV Pos. 7a' },
    '4120': { name: 'Instandhaltung allgemein', tax_line: 'GuV Pos. 8' },
    '4121': { name: 'Instandhaltung Heizung', tax_line: 'GuV Pos. 8' },
    '4122': { name: 'Instandhaltung Sanitär', tax_line: 'GuV Pos. 8' },
    '4123': { name: 'Instandhaltung Elektrik', tax_line: 'GuV Pos. 8' },
    '4124': { name: 'Instandhaltung Dach', tax_line: 'GuV Pos. 8' },
    '4125': { name: 'Instandhaltung Fassade', tax_line: 'GuV Pos. 8' },
    '4126': { name: 'Schönheitsreparaturen', tax_line: 'GuV Pos. 8' },
    '4127': { name: 'Malerarbeiten', tax_line: 'GuV Pos. 8' },
    '4220': { name: 'Stromkosten', tax_line: 'GuV Pos. 8' },
    '4230': { name: 'Heizkosten', tax_line: 'GuV Pos. 8' },
    '4240': { name: 'Wasserkosten', tax_line: 'GuV Pos. 8' },
    '4250': { name: 'Müllabfuhr', tax_line: 'GuV Pos. 8' },
    '4260': { name: 'Straßenreinigung', tax_line: 'GuV Pos. 8' },
    '4270': { name: 'Hausmeister', tax_line: 'GuV Pos. 8' },
    '4280': { name: 'Garten/Beleuchtung', tax_line: 'GuV Pos. 8' },
    '4281': { name: 'Winterdienst', tax_line: 'GuV Pos. 8' },
    '4290': { name: 'Hausverwaltung', tax_line: 'GuV Pos. 8' },
    '4970': { name: 'Steuerberater', tax_line: 'GuV Pos. 8' },
    '4980': { name: 'Rechtsanwalt', tax_line: 'GuV Pos. 8' },
    '4140': { name: 'Grundsteuer', tax_line: 'GuV Pos. 8' },
    '4361': { name: 'Gebäudeversicherung', tax_line: 'GuV Pos. 8' },
    '4362': { name: 'Haftpflichtversicherung', tax_line: 'GuV Pos. 8' },
    '4363': { name: 'Rechtsschutzversicherung', tax_line: 'GuV Pos. 8' },
    '4920': { name: 'Zinsen langfristig', tax_line: 'GuV Pos. 12' },
    '4921': { name: 'Bereitstellungszinsen', tax_line: 'GuV Pos. 12' },
    '4922': { name: 'Disagio', tax_line: 'GuV Pos. 12' },
    '4952': { name: 'Gutachterkosten', tax_line: 'GuV Pos. 8' },
    '4951': { name: 'Werbekosten', tax_line: 'GuV Pos. 8' },
    '4953': { name: 'Mietausfall', tax_line: 'GuV Pos. 8' },
    '0280': { name: 'Grundstücke', tax_line: 'Bilanz Aktiva' },
    '0282': { name: 'Gebäude Wohn', tax_line: 'Bilanz Aktiva' },
    '0360': { name: 'Heizungsanlage', tax_line: 'Bilanz Aktiva' },
    '0650': { name: 'Darlehen', tax_line: 'Bilanz Passiva' },
    '1200': { name: 'Bank', tax_line: 'Bilanz Aktiva' },
    '1576': { name: 'Vorsteuer 19%', tax_line: 'USt' },
    '1406': { name: 'Umsatzsteuer 19%', tax_line: 'USt' },
    '7300': { name: 'Gewerbesteuer', tax_line: 'GuV Pos. 13' },
    '7310': { name: 'Körperschaftsteuer', tax_line: 'GuV Pos. 13' },
    '7320': { name: 'Solidaritätszuschlag', tax_line: 'GuV Pos. 13' }
  }
};

ACCOUNTS_SKR03.GBR = ACCOUNTS_SKR03.PRIVATPERSON;

// ============================================================================
// KONTEN: SKR04
// ============================================================================

const ACCOUNTS_SKR04 = {
  PRIVATPERSON: {
    '4400': { name: 'Erlöse 19% USt', tax_line: 'Anlage V, Z. 8+15' },
    '4300': { name: 'Erlöse steuerfrei', tax_line: 'Anlage V, Z. 8' },
    '4821': { name: 'Betriebskostennachzahlungen', tax_line: 'Anlage V, Z. 9' },
    '6222': { name: 'Abschreibungen Gebäude', tax_line: 'Anlage V, Z. 33' },
    '6230': { name: 'Abschreibungen BGA', tax_line: 'Anlage V, Z. 34' },
    '6340': { name: 'Instandhaltung allgemein', tax_line: 'Anlage V, Z. 36' },
    '6341': { name: 'Instandhaltung Heizung', tax_line: 'Anlage V, Z. 36' },
    '6342': { name: 'Instandhaltung Sanitär', tax_line: 'Anlage V, Z. 36' },
    '6343': { name: 'Instandhaltung Elektrik', tax_line: 'Anlage V, Z. 36' },
    '6344': { name: 'Instandhaltung Dach', tax_line: 'Anlage V, Z. 36' },
    '6345': { name: 'Instandhaltung Fassade', tax_line: 'Anlage V, Z. 36' },
    '6346': { name: 'Schönheitsreparaturen', tax_line: 'Anlage V, Z. 36' },
    '6347': { name: 'Malerarbeiten', tax_line: 'Anlage V, Z. 36' },
    '6360': { name: 'Reparatur Aufzug', tax_line: 'Anlage V, Z. 47' },
    '6366': { name: 'Treppenhausreinigung', tax_line: 'Anlage V, Z. 47' },
    '6367': { name: 'Glasreinigung', tax_line: 'Anlage V, Z. 47' },
    '6410': { name: 'Stromkosten', tax_line: 'Anlage V, Z. 47' },
    '6420': { name: 'Heizkosten', tax_line: 'Anlage V, Z. 47' },
    '6430': { name: 'Wasserkosten', tax_line: 'Anlage V, Z. 47' },
    '6440': { name: 'Müllabfuhr', tax_line: 'Anlage V, Z. 47' },
    '6450': { name: 'Straßenreinigung', tax_line: 'Anlage V, Z. 47' },
    '6460': { name: 'Hausmeister', tax_line: 'Anlage V, Z. 45' },
    '6470': { name: 'Garten/Beleuchtung', tax_line: 'Anlage V, Z. 46' },
    '6471': { name: 'Winterdienst', tax_line: 'Anlage V, Z. 46' },
    '6472': { name: 'Schädlingsbekämpfung', tax_line: 'Anlage V, Z. 47' },
    '6520': { name: 'Hausverwaltung', tax_line: 'Anlage V, Z. 47' },
    '6810': { name: 'Steuerberater', tax_line: 'Anlage V, Z. 47' },
    '6820': { name: 'Rechtsanwalt', tax_line: 'Anlage V, Z. 47' },
    '6855': { name: 'Kontoführung', tax_line: 'Anlage V, Z. 47' },
    '6730': { name: 'Grundsteuer', tax_line: 'Anlage V, Z. 41' },
    '6541': { name: 'Gebäudeversicherung', tax_line: 'Anlage V, Z. 43' },
    '6542': { name: 'Haftpflichtversicherung', tax_line: 'Anlage V, Z. 43' },
    '6543': { name: 'Rechtsschutzversicherung', tax_line: 'Anlage V, Z. 43' },
    '6940': { name: 'Zinsen langfristig', tax_line: 'Anlage V, Z. 39' },
    '6941': { name: 'Bereitstellungszinsen', tax_line: 'Anlage V, Z. 39' },
    '6942': { name: 'Disagio', tax_line: 'Anlage V, Z. 39' },
    '6892': { name: 'Gutachterkosten', tax_line: 'Anlage V, Z. 47' },
    '6891': { name: 'Werbekosten', tax_line: 'Anlage V, Z. 47' },
    '6893': { name: 'Mietausfall', tax_line: 'Anlage V, Z. 47' },
    '0280': { name: 'Grundstücke', tax_line: 'Aktivierung' },
    '0282': { name: 'Gebäude Wohn', tax_line: 'Aktivierung' },
    '0360': { name: 'Heizungsanlage', tax_line: 'Aktivierung' },
    '0650': { name: 'Darlehen', tax_line: 'Passiva' },
    '1200': { name: 'Bank', tax_line: 'Aktiva' },
    '1576': { name: 'Vorsteuer 19%', tax_line: 'USt' },
    '1406': { name: 'Umsatzsteuer 19%', tax_line: 'USt' }
  },
  GMBH: {
    '4400': { name: 'Erlöse 19% USt', tax_line: 'GuV Pos. 1' },
    '4300': { name: 'Erlöse steuerfrei', tax_line: 'GuV Pos. 1' },
    '6222': { name: 'Abschreibungen Gebäude', tax_line: 'GuV Pos. 7a' },
    '6223': { name: 'Abschreibungen Heizung', tax_line: 'GuV Pos. 7a' },
    '6340': { name: 'Instandhaltung allgemein', tax_line: 'GuV Pos. 8' },
    '6341': { name: 'Instandhaltung Heizung', tax_line: 'GuV Pos. 8' },
    '6342': { name: 'Instandhaltung Sanitär', tax_line: 'GuV Pos. 8' },
    '6343': { name: 'Instandhaltung Elektrik', tax_line: 'GuV Pos. 8' },
    '6344': { name: 'Instandhaltung Dach', tax_line: 'GuV Pos. 8' },
    '6345': { name: 'Instandhaltung Fassade', tax_line: 'GuV Pos. 8' },
    '6346': { name: 'Schönheitsreparaturen', tax_line: 'GuV Pos. 8' },
    '6347': { name: 'Malerarbeiten', tax_line: 'GuV Pos. 8' },
    '6410': { name: 'Stromkosten', tax_line: 'GuV Pos. 8' },
    '6420': { name: 'Heizkosten', tax_line: 'GuV Pos. 8' },
    '6430': { name: 'Wasserkosten', tax_line: 'GuV Pos. 8' },
    '6440': { name: 'Müllabfuhr', tax_line: 'GuV Pos. 8' },
    '6450': { name: 'Straßenreinigung', tax_line: 'GuV Pos. 8' },
    '6460': { name: 'Hausmeister', tax_line: 'GuV Pos. 8' },
    '6470': { name: 'Garten/Beleuchtung', tax_line: 'GuV Pos. 8' },
    '6471': { name: 'Winterdienst', tax_line: 'GuV Pos. 8' },
    '6520': { name: 'Hausverwaltung', tax_line: 'GuV Pos. 8' },
    '6810': { name: 'Steuerberater', tax_line: 'GuV Pos. 8' },
    '6820': { name: 'Rechtsanwalt', tax_line: 'GuV Pos. 8' },
    '6730': { name: 'Grundsteuer', tax_line: 'GuV Pos. 8' },
    '6541': { name: 'Gebäudeversicherung', tax_line: 'GuV Pos. 8' },
    '6542': { name: 'Haftpflichtversicherung', tax_line: 'GuV Pos. 8' },
    '6543': { name: 'Rechtsschutzversicherung', tax_line: 'GuV Pos. 8' },
    '6940': { name: 'Zinsen langfristig', tax_line: 'GuV Pos. 12' },
    '6941': { name: 'Bereitstellungszinsen', tax_line: 'GuV Pos. 12' },
    '6942': { name: 'Disagio', tax_line: 'GuV Pos. 12' },
    '6892': { name: 'Gutachterkosten', tax_line: 'GuV Pos. 8' },
    '6891': { name: 'Werbekosten', tax_line: 'GuV Pos. 8' },
    '6893': { name: 'Mietausfall', tax_line: 'GuV Pos. 8' },
    '0280': { name: 'Grundstücke', tax_line: 'Bilanz Aktiva' },
    '0282': { name: 'Gebäude Wohn', tax_line: 'Bilanz Aktiva' },
    '0360': { name: 'Heizungsanlage', tax_line: 'Bilanz Aktiva' },
    '0650': { name: 'Darlehen', tax_line: 'Bilanz Passiva' },
    '1200': { name: 'Bank', tax_line: 'Bilanz Aktiva' },
    '1576': { name: 'Vorsteuer 19%', tax_line: 'USt' },
    '1406': { name: 'Umsatzsteuer 19%', tax_line: 'USt' },
    '7300': { name: 'Gewerbesteuer', tax_line: 'GuV Pos. 13' },
    '7310': { name: 'Körperschaftsteuer', tax_line: 'GuV Pos. 13' },
    '7320': { name: 'Solidaritätszuschlag', tax_line: 'GuV Pos. 13' }
  }
};

ACCOUNTS_SKR04.GBR = ACCOUNTS_SKR04.PRIVATPERSON;

// ============================================================================
// VERKNÜPFUNGSMATRIX
// ============================================================================

const MAPPING_MATRIX = {
  K001: { PRIVATPERSON: { SKR03: '4121', SKR04: '6341' }, GBR: { SKR03: '4121', SKR04: '6341' }, GMBH: { SKR03: '4121', SKR04: '6341' } },
  K002: { PRIVATPERSON: { SKR03: '4121', SKR04: '6341' }, GBR: { SKR03: '4121', SKR04: '6341' }, GMBH: { SKR03: '4121', SKR04: '6341' } },
  K003: { PRIVATPERSON: { SKR03: '4125', SKR04: '6345' }, GBR: { SKR03: '4125', SKR04: '6345' }, GMBH: { SKR03: '4125', SKR04: '6345' } },
  K004: { PRIVATPERSON: { SKR03: '4125', SKR04: '6345' }, GBR: { SKR03: '4125', SKR04: '6345' }, GMBH: { SKR03: '4125', SKR04: '6345' } },
  K005: { PRIVATPERSON: { SKR03: '4126', SKR04: '6346' }, GBR: { SKR03: '4126', SKR04: '6346' }, GMBH: { SKR03: '4126', SKR04: '6346' } },
  K006: { PRIVATPERSON: { SKR03: '4127', SKR04: '6347' }, GBR: { SKR03: '4127', SKR04: '6347' }, GMBH: { SKR03: '4127', SKR04: '6347' } },
  K007: { PRIVATPERSON: { SKR03: '4123', SKR04: '6343' }, GBR: { SKR03: '4123', SKR04: '6343' }, GMBH: { SKR03: '4123', SKR04: '6343' } },
  K008: { PRIVATPERSON: { SKR03: '4122', SKR04: '6342' }, GBR: { SKR03: '4122', SKR04: '6342' }, GMBH: { SKR03: '4122', SKR04: '6342' } },
  K009: { PRIVATPERSON: { SKR03: '4120', SKR04: '6340' }, GBR: { SKR03: '4120', SKR04: '6340' }, GMBH: { SKR03: '4120', SKR04: '6340' } },
  K010: { PRIVATPERSON: { SKR03: '4120', SKR04: '6340' }, GBR: { SKR03: '4120', SKR04: '6340' }, GMBH: { SKR03: '4120', SKR04: '6340' } },
  K011: { PRIVATPERSON: { SKR03: '4124', SKR04: '6344' }, GBR: { SKR03: '4124', SKR04: '6344' }, GMBH: { SKR03: '4124', SKR04: '6344' } },
  K012: { PRIVATPERSON: { SKR03: '4280', SKR04: '6470' }, GBR: { SKR03: '4280', SKR04: '6470' }, GMBH: { SKR03: '4280', SKR04: '6470' } },
  K013: { PRIVATPERSON: { SKR03: '4281', SKR04: '6471' }, GBR: { SKR03: '4281', SKR04: '6471' }, GMBH: { SKR03: '4281', SKR04: '6471' } },
  K014: { PRIVATPERSON: { SKR03: '4282', SKR04: '6472' }, GBR: { SKR03: '4282', SKR04: '6472' }, GMBH: { SKR03: '4282', SKR04: '6472' } },
  K015: { PRIVATPERSON: { SKR03: '4130', SKR04: '6360' }, GBR: { SKR03: '4130', SKR04: '6360' }, GMBH: { SKR03: '4130', SKR04: '6360' } },
  K016: { PRIVATPERSON: { SKR03: '4136', SKR04: '6366' }, GBR: { SKR03: '4136', SKR04: '6366' }, GMBH: { SKR03: '4136', SKR04: '6366' } },
  K017: { PRIVATPERSON: { SKR03: '4137', SKR04: '6367' }, GBR: { SKR03: '4137', SKR04: '6367' }, GMBH: { SKR03: '4137', SKR04: '6367' } },
  K020: { PRIVATPERSON: { SKR03: '0360', SKR04: '0360', afa_account: { SKR03: '4832', SKR04: '6222' } }, GBR: { SKR03: '0360', SKR04: '0360', afa_account: { SKR03: '4832', SKR04: '6222' } }, GMBH: { SKR03: '0360', SKR04: '0360', afa_account: { SKR03: '4833', SKR04: '6223' } } },
  K021: { PRIVATPERSON: { SKR03: '0282', SKR04: '0282', afa_account: { SKR03: '4832', SKR04: '6222' } }, GBR: { SKR03: '0282', SKR04: '0282', afa_account: { SKR03: '4832', SKR04: '6222' } }, GMBH: { SKR03: '0282', SKR04: '0282', afa_account: { SKR03: '4832', SKR04: '6222' } } },
  K034: { PRIVATPERSON: { SKR03: '0280', SKR04: '0280' }, GBR: { SKR03: '0280', SKR04: '0280' }, GMBH: { SKR03: '0280', SKR04: '0280' } },
  K035: { PRIVATPERSON: { SKR03: '0282', SKR04: '0282', afa_account: { SKR03: '4832', SKR04: '6222' } }, GBR: { SKR03: '0282', SKR04: '0282', afa_account: { SKR03: '4832', SKR04: '6222' } }, GMBH: { SKR03: '0282', SKR04: '0282', afa_account: { SKR03: '4832', SKR04: '6222' } } },
  K040: { PRIVATPERSON: { SKR03: '4240', SKR04: '6430' }, GBR: { SKR03: '4240', SKR04: '6430' }, GMBH: { SKR03: '4240', SKR04: '6430' } },
  K041: { PRIVATPERSON: { SKR03: '4230', SKR04: '6420' }, GBR: { SKR03: '4230', SKR04: '6420' }, GMBH: { SKR03: '4230', SKR04: '6420' } },
  K042: { PRIVATPERSON: { SKR03: '4220', SKR04: '6410' }, GBR: { SKR03: '4220', SKR04: '6410' }, GMBH: { SKR03: '4220', SKR04: '6410' } },
  K043: { PRIVATPERSON: { SKR03: '4250', SKR04: '6440' }, GBR: { SKR03: '4250', SKR04: '6440' }, GMBH: { SKR03: '4250', SKR04: '6440' } },
  K044: { PRIVATPERSON: { SKR03: '4260', SKR04: '6450' }, GBR: { SKR03: '4260', SKR04: '6450' }, GMBH: { SKR03: '4260', SKR04: '6450' } },
  K045: { PRIVATPERSON: { SKR03: '4270', SKR04: '6460' }, GBR: { SKR03: '4270', SKR04: '6460' }, GMBH: { SKR03: '4270', SKR04: '6460' } },
  K050: { PRIVATPERSON: { SKR03: '4290', SKR04: '6520' }, GBR: { SKR03: '4290', SKR04: '6520' }, GMBH: { SKR03: '4290', SKR04: '6520' } },
  K051: { PRIVATPERSON: { SKR03: '4970', SKR04: '6810' }, GBR: { SKR03: '4970', SKR04: '6810' }, GMBH: { SKR03: '4970', SKR04: '6810' } },
  K052: { PRIVATPERSON: { SKR03: '4980', SKR04: '6820' }, GBR: { SKR03: '4980', SKR04: '6820' }, GMBH: { SKR03: '4980', SKR04: '6820' } },
  K053: { PRIVATPERSON: { SKR03: '4951', SKR04: '6855' }, GBR: { SKR03: '4951', SKR04: '6855' }, GMBH: { SKR03: '4951', SKR04: '6855' } },
  K057: { PRIVATPERSON: { SKR03: '4953', SKR04: '6893' }, GBR: { SKR03: '4953', SKR04: '6893' }, GMBH: { SKR03: '4953', SKR04: '6893' } },
  K060: { PRIVATPERSON: { SKR03: '4361', SKR04: '6541' }, GBR: { SKR03: '4361', SKR04: '6541' }, GMBH: { SKR03: '4361', SKR04: '6541' } },
  K061: { PRIVATPERSON: { SKR03: '4362', SKR04: '6542' }, GBR: { SKR03: '4362', SKR04: '6542' }, GMBH: { SKR03: '4362', SKR04: '6542' } },
  K062: { PRIVATPERSON: { SKR03: '4363', SKR04: '6543' }, GBR: { SKR03: '4363', SKR04: '6543' }, GMBH: { SKR03: '4363', SKR04: '6543' } },
  K070: { PRIVATPERSON: { SKR03: '4140', SKR04: '6730' }, GBR: { SKR03: '4140', SKR04: '6730' }, GMBH: { SKR03: '4140', SKR04: '6730' } },
  K080: { PRIVATPERSON: { SKR03: '4920', SKR04: '6940' }, GBR: { SKR03: '4920', SKR04: '6940' }, GMBH: { SKR03: '4920', SKR04: '6940' } },
  K081: { PRIVATPERSON: { SKR03: '0650', SKR04: '0650' }, GBR: { SKR03: '0650', SKR04: '0650' }, GMBH: { SKR03: '0650', SKR04: '0650' } },
  K082: { PRIVATPERSON: { SKR03: '4922', SKR04: '6942' }, GBR: { SKR03: '4922', SKR04: '6942' }, GMBH: { SKR03: '4922', SKR04: '6942' } },
  K083: { PRIVATPERSON: { SKR03: '4921', SKR04: '6941' }, GBR: { SKR03: '4921', SKR04: '6941' }, GMBH: { SKR03: '4921', SKR04: '6941' } },
  K090: { PRIVATPERSON: { SKR03: '4952', SKR04: '6892' }, GBR: { SKR03: '4952', SKR04: '6892' }, GMBH: { SKR03: '4952', SKR04: '6892' } },
  K091: { PRIVATPERSON: { SKR03: '4951', SKR04: '6891' }, GBR: { SKR03: '4951', SKR04: '6891' }, GMBH: { SKR03: '4951', SKR04: '6891' } }
};

// ============================================================================
// HAUPTFUNKTION
// ============================================================================

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { building_id, legal_form, account_framework } = await req.json();
    
    // Validierung
    if (!['PRIVATPERSON', 'GBR', 'GMBH'].includes(legal_form)) {
      return Response.json({ 
        error: `Invalid legal_form: ${legal_form}. Must be PRIVATPERSON, GBR, or GMBH.` 
      }, { status: 400 });
    }
    
    if (!['SKR03', 'SKR04'].includes(account_framework)) {
      return Response.json({ 
        error: `Invalid account_framework: ${account_framework}. Must be SKR03 or SKR04.` 
      }, { status: 400 });
    }
    
    // Prüfe ob bereits installiert
    const existing = await base44.entities.BuildingTaxLibrary.filter({ building_id });
    if (existing && existing.length > 0) {
      return Response.json({ 
        error: 'Tax library already installed for this building',
        existing: existing[0]
      }, { status: 400 });
    }
    
    // Filtere Kostenkategorien
    const filteredCategories = COST_CATEGORIES.filter(cat => 
      cat.applies_to_legal_form.includes('ALLE') || 
      cat.applies_to_legal_form.includes(legal_form)
    );
    
    // Hole passende Konten
    const accounts = account_framework === 'SKR03' 
      ? (ACCOUNTS_SKR03[legal_form] || ACCOUNTS_SKR03.PRIVATPERSON)
      : (ACCOUNTS_SKR04[legal_form] || ACCOUNTS_SKR04.PRIVATPERSON);
    
    // Erstelle vollständige Mapping-Liste
    const fullMapping = filteredCategories.map(cat => {
      const mapping = MAPPING_MATRIX[cat.id];
      if (!mapping || !mapping[legal_form]) {
        return null;
      }
      
      const accountNumber = mapping[legal_form][account_framework];
      const accountInfo = accounts[accountNumber];
      
      return {
        cost_category_id: cat.id,
        cost_category_name: cat.name,
        cost_category_type: cat.type,
        tax_treatment: cat.tax_treatment,
        account_number: accountNumber,
        account_name: accountInfo?.name || 'Unknown',
        tax_line: accountInfo?.tax_line || '',
        requires_additional_info: cat.requires_additional_info,
        standard_depreciation_years: cat.standard_depreciation_years,
        can_be_allocated: cat.can_be_allocated,
        afa_account: mapping[legal_form].afa_account?.[account_framework] || null
      };
    }).filter(Boolean);
    
    // Speichere in Datenbank
    await base44.entities.BuildingTaxLibrary.create({
      building_id: building_id,
      legal_form: legal_form,
      account_framework: account_framework,
      installed_at: new Date().toISOString(),
      cost_categories: filteredCategories,
      account_mappings: fullMapping,
      accounts: accounts
    });
    
    return Response.json({
      success: true,
      installed_categories: filteredCategories.length,
      legal_form: legal_form,
      account_framework: account_framework,
      message: `Tax library successfully installed for building ${building_id}`
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});