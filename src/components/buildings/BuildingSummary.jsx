import React from 'react';

export default function BuildingSummary({
  totalBuildings,
  totalUnitsCount,
  totalRentedUnits,
  totalRevenue
}) {
  return (
    <div className="px-6 py-4 bg-white border-t border-slate-100">
      <p className="text-xs font-extralight text-slate-400">
        {totalBuildings} Gebäude • {totalRentedUnits}/{totalUnitsCount} Einheiten vermietet • €{totalRevenue.toLocaleString('de-DE')} Gesamt-Ertrag
      </p>
    </div>
  );
}