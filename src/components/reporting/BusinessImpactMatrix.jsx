import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Zap } from 'lucide-react';

export default function BusinessImpactMatrix({ reports }) {
  const efforts = ['quick_fix', 'small', 'medium', 'large', 'epic'];
  const impacts = ['p1_critical', 'p2_high', 'p3_medium', 'p4_low'];

  const matrixData = impacts.map(impact => 
    efforts.map(effort => ({
      impact,
      effort,
      reports: reports.filter(r => 
        r.business_priority === impact && r.estimated_fix_effort === effort
      )
    }))
  );

  const getQuadrantColor = (impact, effort) => {
    if ((impact === 'p1_critical' || impact === 'p2_high') && (effort === 'quick_fix' || effort === 'small')) {
      return 'bg-emerald-100 border-emerald-400 hover:bg-emerald-200';
    }
    if (impact === 'p1_critical') {
      return 'bg-red-100 border-red-400 hover:bg-red-200';
    }
    if (impact === 'p2_high') {
      return 'bg-orange-100 border-orange-400 hover:bg-orange-200';
    }
    if (impact === 'p3_medium') {
      return 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200';
    }
    return 'bg-slate-100 border-slate-300 hover:bg-slate-200';
  };

  const getQuadrantLabel = (impact, effort) => {
    if ((impact === 'p1_critical' || impact === 'p2_high') && (effort === 'quick_fix' || effort === 'small')) {
      return { icon: Zap, label: 'Quick Win!', color: 'text-emerald-700' };
    }
    if (impact === 'p1_critical') {
      return { icon: Target, label: 'Urgent', color: 'text-red-700' };
    }
    return null;
  };

  const effortLabels = {
    quick_fix: 'Quick Fix',
    small: 'Klein',
    medium: 'Mittel',
    large: 'Groß',
    epic: 'Epic'
  };

  const impactLabels = {
    p1_critical: 'P1 Kritisch',
    p2_high: 'P2 Hoch',
    p3_medium: 'P3 Mittel',
    p4_low: 'P4 Niedrig'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          Impact vs Effort Matrix
        </CardTitle>
        <p className="text-sm text-slate-600">Quick Wins identifizieren und priorisieren</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-6 gap-2">
            <div className="text-xs font-medium text-slate-600 flex items-center justify-end pr-2">
              Impact →
            </div>
            {efforts.map(effort => (
              <div key={effort} className="text-xs font-medium text-slate-600 text-center">
                {effortLabels[effort]}
              </div>
            ))}
          </div>

          {matrixData.map((row, rowIdx) => (
            <div key={impacts[rowIdx]} className="grid grid-cols-6 gap-2">
              <div className="text-xs font-medium text-slate-600 flex items-center justify-end pr-2">
                {impactLabels[impacts[rowIdx]]}
              </div>
              {row.map((cell, cellIdx) => {
                const quadrantInfo = getQuadrantLabel(cell.impact, cell.effort);
                return (
                  <motion.div
                    key={`${cell.impact}-${cell.effort}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: (rowIdx * 5 + cellIdx) * 0.02 }}
                    className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${getQuadrantColor(cell.impact, cell.effort)}`}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold">{cell.reports.length}</div>
                      {quadrantInfo && (
                        <div className={`flex items-center justify-center gap-1 text-xs font-medium mt-1 ${quadrantInfo.color}`}>
                          <quadrantInfo.icon className="w-3 h-3" />
                          {quadrantInfo.label}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-900">Quick Win Empfehlung</div>
              <div className="text-sm text-emerald-700 mt-1">
                Fokussieren Sie auf hohe Impact / niedrige Effort Probleme für schnelle Verbesserungen
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}