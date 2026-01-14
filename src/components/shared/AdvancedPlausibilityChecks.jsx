import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { motion } from 'framer-motion';

// Check 1: Kaution > 3 Monatsmieten
export function DepositTooHighWarning({ deposit, monthlyRent }) {
  if (!deposit || !monthlyRent) return null;
  
  const maxDeposit = monthlyRent * 3;
  if (deposit <= maxDeposit) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-900">
          <p className="font-semibold">⚠️ Kaution zu hoch</p>
          <p className="text-sm mt-1">
            Kaution: €{deposit.toFixed(2)} | Max. erlaubt: €{maxDeposit.toFixed(2)} (3× Kaltmiete)
          </p>
          <p className="text-xs text-red-700 mt-1">
            § 551 BGB: Die Kaution darf maximal 3 Monatsmieten betragen.
          </p>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

// Check 2: Miete deutlich über Durchschnitt
export function RentAboveAverageWarning({ rentPerSqm, area, city }) {
  if (!rentPerSqm || !city) return null;
  
  // Simplified average rent by city (€/m²)
  const averageRents = {
    'Berlin': 12,
    'München': 18,
    'Hamburg': 13,
    'Frankfurt': 15,
    'Köln': 11,
    'Stuttgart': 14,
    'Düsseldorf': 12,
    'Leipzig': 8,
    'Dresden': 9
  };
  
  const avgRent = averageRents[city] || 10;
  const threshold = avgRent * 1.4; // 40% above average
  
  if (rentPerSqm <= threshold) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-amber-500 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <p className="font-semibold">💡 Miete überdurchschnittlich</p>
          <p className="text-sm mt-1">
            Ihr Preis: €{rentPerSqm.toFixed(2)}/m² | Durchschnitt {city}: ~€{avgRent}/m²
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Prüfen Sie Mietpreisbremse und Mietspiegel für {city}.
          </p>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

// Check 3: Nebenkosten-Verhältnis zur Wohnfläche
export function OperatingCostsRatioWarning({ operatingCosts, area }) {
  if (!operatingCosts || !area || area <= 0) return null;
  
  const costsPerSqm = operatingCosts / area;
  const typicalMin = 2.0;
  const typicalMax = 4.0;
  
  if (costsPerSqm >= typicalMin && costsPerSqm <= typicalMax) return null;

  const isTooLow = costsPerSqm < typicalMin;
  const isTooHigh = costsPerSqm > typicalMax;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className={isTooHigh ? "border-amber-500 bg-amber-50" : "border-blue-500 bg-blue-50"}>
        <Info className={`h-4 w-4 ${isTooHigh ? 'text-amber-600' : 'text-blue-600'}`} />
        <AlertDescription className={isTooHigh ? "text-amber-900" : "text-blue-900"}>
          <p className="font-semibold">
            {isTooHigh ? '⚠️ Nebenkosten ungewöhnlich hoch' : 'ℹ️ Nebenkosten ungewöhnlich niedrig'}
          </p>
          <p className="text-sm mt-1">
            €{costsPerSqm.toFixed(2)}/m² | Üblich: €{typicalMin}-{typicalMax}/m²
          </p>
          <p className="text-xs mt-1 opacity-80">
            {isTooHigh ? 
              'Prüfen Sie, ob alle Kosten umlagefähig sind.' : 
              'Möglicherweise fehlen Positionen.'}
          </p>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

// Check 4: AfA > 100% des Gebäudewerts
export function AfAValidationWarning({ afaPercentage, buildingValue, landValue }) {
  if (!afaPercentage || !buildingValue) return null;
  
  const depreciableValue = buildingValue - (landValue || 0);
  const annualAfA = depreciableValue * (afaPercentage / 100);
  const years = 100 / afaPercentage;
  
  // Warning if AfA percentage seems wrong
  if (afaPercentage > 10 || afaPercentage < 0.5) {
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <p className="font-semibold">⚠️ Ungewöhnlicher AfA-Satz</p>
            <p className="text-sm mt-1">
              {afaPercentage}% AfA = €{annualAfA.toFixed(2)}/Jahr über {years.toFixed(0)} Jahre
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Üblich: 2% (50 Jahre) oder 2.5% (40 Jahre) für Wohngebäude.
            </p>
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return null;
}

// Check 5: Rent increase > legal limit
export function RentIncreaseValidationWarning({ oldRent, newRent, years }) {
  if (!oldRent || !newRent || oldRent >= newRent) return null;
  
  const increasePercent = ((newRent - oldRent) / oldRent) * 100;
  const increasePerYear = years > 0 ? increasePercent / years : increasePercent;
  
  // Kappungsgrenze: max 15% in 3 Jahren = 5%/Jahr
  const legalLimit = 5;
  
  if (increasePerYear <= legalLimit) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-red-500 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-900">
          <p className="font-semibold">⚠️ Mieterhöhung überschreitet Kappungsgrenze</p>
          <p className="text-sm mt-1">
            +{increasePercent.toFixed(1)}% ({increasePerYear.toFixed(1)}%/Jahr) | Max: 15% in 3 Jahren
          </p>
          <p className="text-xs text-red-700 mt-1">
            § 558 Abs. 3 BGB: Kappungsgrenze beachten (in Gebieten mit Wohnungsmangel evtl. nur 10%).
          </p>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

// Check 6: Operating costs missing allocation keys
export function MissingAllocationKeyWarning({ totalCosts, allocatedCosts }) {
  if (!totalCosts || totalCosts <= 0) return null;
  
  const allocated = allocatedCosts || 0;
  const unallocated = totalCosts - allocated;
  const unallocatedPercent = (unallocated / totalCosts) * 100;
  
  if (unallocatedPercent < 10) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-amber-500 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <p className="font-semibold">💡 Verteilungsschlüssel fehlen</p>
          <p className="text-sm mt-1">
            {unallocatedPercent.toFixed(0)}% der Kosten (€{unallocated.toFixed(2)}) haben keinen Umlageschlüssel
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Fügen Sie Verteilungsschlüssel hinzu (Wohnfläche, Personenanzahl, etc.)
          </p>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}