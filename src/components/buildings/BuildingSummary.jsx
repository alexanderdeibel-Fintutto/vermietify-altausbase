import React from 'react';

export default function BuildingSummary({
  totalBuildings,
  totalUnitsCount,
  totalRentedUnits,
  totalRevenue
}) {
  return (
    <div className="px-4 py-3 bg-slate-25 border-t border-slate-200">
      <p className="text-xs font-normal text-slate-600">
        📊 {totalBuildings} Gebäude • {totalRentedUnits}/{totalUnitsCount} Einheiten vermietet • €{totalRevenue.toLocaleString('de-DE')} Gesamt-Ertrag
      </p>
    </div>
  );
}