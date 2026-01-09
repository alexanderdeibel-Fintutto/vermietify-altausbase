export const ASSET_CATEGORIES = {
  stocks: {
    id: 'stocks',
    label: 'Aktien',
    icon: 'TrendingUp',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_9',
    subcategories: ['einzelaktien', 'etf', 'aktienfonds', 'reits']
  },
  bonds: {
    id: 'bonds',
    label: 'Anleihen',
    icon: 'FileText',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_7',
    subcategories: ['staatsanleihen', 'unternehmensanleihen', 'pfandbriefe']
  },
  funds: {
    id: 'funds',
    label: 'Investmentfonds',
    icon: 'Briefcase',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_12',
    subcategories: ['aktienfonds', 'mischfonds', 'immobilienfonds']
  },
  crypto: {
    id: 'crypto',
    label: 'Kryptowährungen',
    icon: 'Zap',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_41',
    subcategories: ['bitcoin', 'ethereum', 'altcoins', 'stablecoins']
  },
  precious_metals: {
    id: 'precious_metals',
    label: 'Edelmetalle',
    icon: 'Award',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_41',
    subcategories: ['gold', 'silber', 'platin', 'palladium']
  },
  cash: {
    id: 'cash',
    label: 'Bankguthaben',
    icon: 'DollarSign',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_7',
    subcategories: ['tagesgeld', 'festgeld', 'sparbuch', 'girokonto']
  },
  insurance: {
    id: 'insurance',
    label: 'Lebensversicherungen',
    icon: 'Shield',
    steuer_formular: 'anlage_kap',
    steuer_zeile: 'zeile_33',
    subcategories: ['kapitallebensversicherung', 'rentenversicherung', 'fondsgebunden']
  },
  business_shares: {
    id: 'business_shares',
    label: 'Unternehmensbeteiligungen',
    icon: 'Building2',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_13',
    subcategories: ['gmbh_anteile', 'personengesellschaft', 'stille_beteiligung']
  },
  collectibles: {
    id: 'collectibles',
    label: 'Sammlerobjekte',
    icon: 'Palette',
    steuer_formular: 'anlage_so',
    steuer_zeile: 'zeile_41',
    subcategories: ['kunst', 'oldtimer', 'uhren', 'muenzen', 'briefmarken']
  },
  foreign_assets: {
    id: 'foreign_assets',
    label: 'Ausländische Vermögenswerte',
    icon: 'Globe',
    steuer_formular: 'anlage_aus',
    steuer_zeile: 'zeile_7',
    subcategories: ['auslaendische_aktien', 'auslaendische_immobilien', 'offshore_konten']
  }
};

export const getCategoryById = (id) => ASSET_CATEGORIES[id] || null;

export const getCategoryIcon = (id) => {
  const category = ASSET_CATEGORIES[id];
  return category?.icon || 'Package';
};

export const getSubcategories = (categoryId) => {
  const category = ASSET_CATEGORIES[categoryId];
  return category?.subcategories || [];
};