export const ASSET_CATEGORIES = {
  STOCKS: {
    id: 'stocks',
    label: 'Aktien',
    icon: '📈',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_9',
    subcategories: ['einzelaktien', 'etf', 'aktienfonds', 'reits']
  },
  BONDS: {
    id: 'bonds',
    label: 'Anleihen',
    icon: '📋',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_7',
    subcategories: ['staatsanleihen', 'unternehmensanleihen', 'pfandbriefe']
  },
  FUNDS: {
    id: 'funds',
    label: 'Investmentfonds',
    icon: '💼',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_12',
    subcategories: ['aktienfonds', 'mischfonds', 'immobilienfonds']
  },
  CRYPTO: {
    id: 'crypto',
    label: 'Kryptowährungen',
    icon: '₿',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_41',
    subcategories: ['bitcoin', 'ethereum', 'altcoins', 'stablecoins']
  },
  PRECIOUS_METALS: {
    id: 'precious_metals',
    label: 'Edelmetalle',
    icon: '💎',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_41',
    subcategories: ['gold', 'silber', 'platin', 'palladium']
  },
  CASH: {
    id: 'cash',
    label: 'Bankguthaben',
    icon: '🏦',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_7',
    subcategories: ['tagesgeld', 'festgeld', 'sparbuch', 'girokonto']
  },
  INSURANCE: {
    id: 'insurance',
    label: 'Lebensversicherungen',
    icon: '🛡️',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_33',
    subcategories: ['kapitallebensversicherung', 'rentenversicherung', 'fondsgebunden']
  },
  BUSINESS_SHARES: {
    id: 'business_shares',
    label: 'Unternehmensbeteiligungen',
    icon: '🏢',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_13',
    subcategories: ['gmbh_anteile', 'personengesellschaft', 'stille_beteiligung']
  },
  COLLECTIBLES: {
    id: 'collectibles',
    label: 'Sammlerobjekte',
    icon: '🎨',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_41',
    subcategories: ['kunst', 'oldtimer', 'uhren', 'muenzen', 'briefmarken']
  },
  FOREIGN_ASSETS: {
    id: 'foreign_assets',
    label: 'Ausländische Vermögenswerte',
    icon: '🌍',
    steuer_formular: 'anlage_aus',
    steuer_zeile: 'zeile_7',
    subcategories: ['auslaendische_aktien', 'auslaendische_immobilien', 'offshore_konten']
  }
};

export const getCategoryById = (categoryId) => {
  return Object.values(ASSET_CATEGORIES).find(cat => cat.id === categoryId);
};

export const getAllCategories = () => {
  return Object.values(ASSET_CATEGORIES).map(cat => ({
    value: cat.id,
    label: cat.label,
    icon: cat.icon
  }));
};

export const getSubcategories = (categoryId) => {
  const category = getCategoryById(categoryId);
  return category?.subcategories || [];
};