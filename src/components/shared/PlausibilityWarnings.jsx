import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ContractWithoutBookingsWarning({ show }) {
  if (!show) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Für diesen Vertrag wurden noch keine Buchungen generiert.</strong>
          {' '}Mieteinnahmen fehlen in der Finanzübersicht!
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

export function InvoiceWithoutCategoryWarning({ show }) {
  if (!show) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Diese Rechnung ist nicht kategorisiert</strong>
          {' '}und wird in BK-Abrechnungen/Anlage V nicht berücksichtigt.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

export function HighAfAWarning({ afaAmount, show }) {
  if (!show || !afaAmount || afaAmount <= 5000) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Hohe AfA ({afaAmount.toLocaleString('de-DE')}€)</strong>
          {' '}– Wurde der Grundstücksanteil korrekt abgezogen?
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

export function BKWithNoCostsWarning({ show, costsCount = 0 }) {
  if (!show || costsCount > 0) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Keine umlagefähigen Kosten gefunden.</strong>
          {' '}Wurden die Rechnungen kategorisiert?
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

export function HighRentWarning({ rentPerSqm, show }) {
  if (!show || !rentPerSqm || rentPerSqm <= 20) return null;
  
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Mietpreis über Durchschnitt ({rentPerSqm.toFixed(2)}€/m²)</strong>
          {' '}– Mietpreisbremse prüfen?
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}