import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, MapPin, Users } from 'lucide-react';

export default function ProblemReportCard({ report, onClick }) {
  const getPriorityBadge = () => {
    const config = {
      p1_critical: { label: 'P1 CRITICAL', color: 'bg-red-600', pulse: true },
      p2_high: { label: 'P2 HIGH', color: 'bg-orange-600', pulse: false },
      p3_medium: { label: 'P3 MEDIUM', color: 'bg-yellow-600', pulse: false },
      p4_low: { label: 'P4 LOW', color: 'bg-blue-600', pulse: false }
    };
    const cfg = config[report.business_priority] || config.p4_low;
    
    return (
      <Badge className={`${cfg.color} text-white ${cfg.pulse ? 'animate-pulse' : ''}`}>
        {cfg.label}
      </Badge>
    );
  };

  const getTypeIcon = () => {
    switch(report.problem_type) {
      case 'functional_bug': return '🐛';
      case 'ux_issue': return '🎨';
      case 'performance': return '⚡';
      case 'visual_bug': return '👁️';
      case 'data_integrity': return '📊';
      case 'security': return '🔒';
      default: return '📝';
    }
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-l-4"
      style={{
        borderLeftColor: report.business_priority === 'p1_critical' ? '#dc2626' :
                         report.business_priority === 'p2_high' ? '#ea580c' :
                         report.business_priority === 'p3_medium' ? '#ca8a04' : '#2563eb'
      }}
      onClick={() => onClick(report)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getPriorityBadge()}
              <Badge variant="outline">{getTypeIcon()} {report.problem_type}</Badge>
              {report.priority_score && (
                <Badge variant="outline" className="font-mono">
                  Score: {report.priority_score}
                </Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-slate-900 mb-1">{report.problem_titel}</h3>
            <p className="text-sm text-slate-600 line-clamp-2">{report.problem_beschreibung}</p>
            
            <div className="flex flex-wrap gap-2 mt-3">
              {report.business_area && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {report.business_area}
                </Badge>
              )}
              {report.affected_user_count_estimate && (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {report.affected_user_count_estimate}
                </Badge>
              )}
              {report.user_journey_stage && (
                <Badge variant="outline" className="text-xs">
                  {report.user_journey_stage}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xs text-slate-500">
              {report.tester_name || report.created_by}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {new Date(report.created_date).toLocaleDateString('de-DE')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}