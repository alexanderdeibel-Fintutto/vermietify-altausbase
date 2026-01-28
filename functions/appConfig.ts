
// App-Konfiguration - ZENTRAL DEFINIEREN
export const APP_CONFIG = {
  id: 'nk-abrechnung',
  name: 'NK-Abrechnung',
  slug: 'nk-abrechnung',
  categories: ['core', 'tool', 'calculator'],
  targetAudience: ['landlord', 'property_manager', 'caretaker'],
  description: 'Automatisierte Nebenkostenabrechnungen für Immobilienverwalter',
  
  // Kommunikations-Einstellungen
  messaging: {
    appId: 'vermietify',
    userType: 'landlord',
    features: {
      directMessages: true,
      taskComments: true,
      documentDiscussions: true,
      groupChats: true,
      broadcasts: true
    }
  },
  
  // MieterApp Integration
  mieterApp: {
    appId: '696feb63b8085b338cf6c4e7',
    baseUrl: 'https://mieterapp.fintutto.de',
    inviteUrlTemplate: 'https://mieterapp.fintutto.de/invite/{inviteCode}'
  }
};
