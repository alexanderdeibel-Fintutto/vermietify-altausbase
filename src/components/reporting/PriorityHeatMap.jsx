import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from 'lucide-react';

export default function PriorityHeatMap({ reports }) {
  const areas = [
    { key: 'auth_login', label: 'Login/Auth', critical: true },
    { key: 'finances', label: 'Finanzen', critical: true },
    { key: 'objects', label: 'Objekte', critical: true },
    { key: 'tenants', label: 'Mieter', critical: true },
    { key: 'documents', label: 'Dokumente', important: true },
    { key: 'taxes', label: 'Steuern', important: true },
    { key: 'operating_costs', label: 'Betriebskosten', important: true },
    { key: 'reports', label: 'Reports', standard: true },
    { key: 'dashboard', label: 'Dashboard', standard: true },
    { key: 'settings', label: 'Einstellungen', standard: true }
  ];

  const areaStats = areas.map(area => {
    const areaReports = reports.filter(r => r.business_area === area.key);
    const avgPriority = areaReports.length > 0
      ? areaReports.reduce((sum, r) => sum + (r.priority_score || 0), 0) / areaReports.length
      : 0;
    const criticalCount = areaReports.filter(r => r.business_priority === "p1_critical").length;
    
    return {
      ...area,
      count: areaReports.length,
      avgPriority,
      criticalCount
    };
  });

  const getHeatColor = (avgPriority, criticalCount) => {
    if (criticalCount > 0 || avgPriority >= 300) return 'bg-red-600 border-red-700';
    if (avgPriority >= 150) return 'bg-orange-500 border-orange-600';
    if (avgPriority >= 75) return 'bg-yellow-500 border-yellow-600';
    if (avgPriority > 0) return 'bg-blue-500 border-blue-600';
    return 'bg-slate-200 border-slate-300';
  };

  const maxCount = Math.max(...areaStats.map(a => a.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Priority Heat Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {areaStats.map((area, idx) => (
            <motion.div
              key={area.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative p-4 rounded-lg border-2 ${getHeatColor(area.avgPriority, area.criticalCount)} text-white`}
              style={{
                opacity: area.count === 0 ? 0.3 : 0.7 + (area.count / maxCount) * 0.3
              }}
            >
              <div className="text-xs font-medium mb-1">{area.label}</div>
              <div className="text-2xl font-bold">{area.count}</div>
              {area.criticalCount > 0 && (
                <Badge className="absolute top-2 right-2 bg-red-800 text-white text-xs">
                  {area.criticalCount} P1
                </Badge>
              )}
              {area.avgPriority > 0 && (
                <div className="text-xs mt-1 opacity-90">
                  Ø {Math.round(area.avgPriority)} Score
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-6 pt-4 border-t text-sm">
          <span className="text-slate-600">Legende:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-600 border-2 border-red-700" />
            <span>Kritisch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500 border-2 border-orange-600" />
            <span>Hoch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500 border-2 border-yellow-600" />
            <span>Mittel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500 border-2 border-blue-600" />
            <span>Niedrig</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}