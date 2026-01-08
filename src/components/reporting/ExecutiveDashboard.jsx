import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Clock, CheckCircle2, Target } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ExecutiveDashboard({ summary }) {
  if (!summary) return null;

  const criticalIssues = summary.most_critical_issues || [];
  const focusAreas = summary.suggested_focus_areas || [];
  const immediateActions = summary.immediate_actions_needed || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Reports', value: summary.total_reports, icon: Target, color: 'blue' },
          { label: 'Critical Blockers', value: summary.reports_by_priority?.p1 || 0, icon: AlertTriangle, color: 'red' },
          { label: 'Ungelöst Critical', value: summary.executive_summary?.unresolved_critical || 0, icon: AlertTriangle, color: 'orange' },
          { label: 'Ø Lösungszeit', value: `${summary.resolution_stats?.avg_resolution_time || 0}h`, icon: Clock, color: 'purple' }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 text-${stat.color}-600`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {immediateActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-2 border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Sofortmaßnahmen erforderlich
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {immediateActions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-red-200">
                    <h4 className="font-semibold text-slate-900">{action.action}</h4>
                    <p className="text-sm text-slate-600 mt-1">{action.reason}</p>
                    {action.affected_areas && (
                      <div className="flex gap-1 mt-2">
                        {action.affected_areas.map(area => (
                          <Badge key={area} variant="outline" className="text-xs">{area}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Top Problembereiche</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.top_problem_areas && summary.top_problem_areas.length > 0 ? (
                <div className="space-y-2">
                  {summary.top_problem_areas.slice(0, 8).map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <div className="font-medium">{area.area}</div>
                        <div className="text-sm text-slate-600">
                          {area.count} Reports • Ø {Math.round(area.avg_priority_score)} Score
                        </div>
                      </div>
                      {area.critical_count > 0 && (
                        <Badge className="bg-red-600">{area.critical_count} P1</Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Keine Daten verfügbar</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Focus-Areas für Development</CardTitle>
            </CardHeader>
            <CardContent>
              {focusAreas.length > 0 ? (
                <div className="space-y-3">
                  {focusAreas.map((focus, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{focus.area}</div>
                          <p className="text-sm text-slate-600 mt-1">{focus.reason}</p>
                        </div>
                        <Badge className={
                          focus.priority_level === 'urgent' ? 'bg-red-600' : 'bg-orange-600'
                        }>
                          {focus.priority_level}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Keine Focus-Areas identifiziert</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {criticalIssues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Top 10 kritischste Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalIssues.map((issue, idx) => (
                  <div key={issue.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="text-lg font-bold text-slate-400">#{idx + 1}</div>
                    <div className="flex-1">
                      <div className="font-medium">{issue.title}</div>
                    </div>
                    <Badge className="bg-red-600">Score: {issue.score}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}