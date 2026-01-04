import React from 'react';
import { Card } from "@/components/ui/card";
import { Home, Building2, Calendar, Euro, Gauge, Plug } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, subtitle, color = "emerald" }) => {
    const colorClasses = {
        emerald: "bg-emerald-50 text-emerald-600",
        blue: "bg-blue-50 text-blue-600",
        purple: "bg-purple-50 text-purple-600",
        amber: "bg-amber-50 text-amber-600",
        slate: "bg-slate-50 text-slate-600",
    };

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500 mb-1">{label}</p>
                    <p className="text-2xl font-bold text-slate-800 truncate">{value}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default function BuildingStats({ building, meters = [], suppliers = [] }) {
    // Berechne Gesamtfläche und Breakdown
    const flaechen = building.flaechen_einheiten || [];
    const totalQm = flaechen.reduce((sum, f) => sum + (f.qm || 0), 0);
    const vermietbareQm = flaechen
        .filter(f => f.art !== 'nicht vermietbar')
        .reduce((sum, f) => sum + (f.qm || 0), 0);

    // Zähle Einheiten nach Art
    const artCounts = {};
    flaechen.forEach(f => {
        const art = f.art || 'Unbekannt';
        artCounts[art] = (artCounts[art] || 0) + 1;
    });
    const artBreakdown = Object.entries(artCounts)
        .map(([art, count]) => `${count}x ${art}`)
        .join(', ');

    // Gebäude-Info
    const gebaeudeCount = building.gebaeude_data?.length || 0;
    const gebaeudeLabel = gebaeudeCount === 1 ? 'Gebäude' : 'Gebäude';

    // Kaufpreis
    const kaufpreis = building.purchase_price || 0;
    const kaufpreisText = kaufpreis > 0 
        ? kaufpreis.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
        : '-';

    // Baujahr
    const baujahr = building.year_built || '-';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <StatCard
                icon={Home}
                label="Gesamtfläche"
                value={`${totalQm.toFixed(0)} m²`}
                subtitle={vermietbareQm < totalQm ? `${vermietbareQm.toFixed(0)} m² vermietbar` : null}
                color="emerald"
            />
            <StatCard
                icon={Building2}
                label="Flächen/Einheiten"
                value={flaechen.length}
                subtitle={artBreakdown || null}
                color="blue"
            />
            <StatCard
                icon={Building2}
                label={gebaeudeLabel}
                value={gebaeudeCount}
                subtitle={gebaeudeCount > 0 ? `${gebaeudeCount} auf dem Grundstück` : 'Noch keine angelegt'}
                color="purple"
            />
            <StatCard
                icon={Calendar}
                label="Baujahr"
                value={baujahr}
                subtitle={building.construction_method || null}
                color="amber"
            />
            <StatCard
                icon={Euro}
                label="Kaufpreis"
                value={kaufpreisText}
                subtitle={null}
                color="slate"
            />
            <StatCard
                icon={Gauge}
                label="Zähler & Versorger"
                value={`${meters.length} / ${suppliers.length}`}
                subtitle={`${meters.length} Zähler, ${suppliers.length} Versorger`}
                color="emerald"
            />
        </div>
    );
}