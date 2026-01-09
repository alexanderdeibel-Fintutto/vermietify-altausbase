import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export default function InsightLinkCard({ insight, linkedPatterns = [], linkedTests = [] }) {
  return (
    <Card className="p-4 border border-slate-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-light text-slate-900 flex-1">{insight.title}</h4>
        <Badge className={`font-light text-xs ${
          insight.priority === 'critical' ? 'bg-red-100 text-red-800' :
          insight.priority === 'high' ? 'bg-orange-100 text-orange-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {insight.priority?.toUpperCase()}
        </Badge>
      </div>

      <p className="text-sm font-light text-slate-600 mb-4">{insight.description}</p>

      {/* Pattern Links */}
      {linkedPatterns?.length > 0 && (
        <div className="mb-3 pb-3 border-b border-slate-200">
          <p className="text-xs font-light text-slate-600 mb-2">🔗 Verknüpfte UX-Muster:</p>
          <div className="flex items-center gap-1 flex-wrap">
            {linkedPatterns.map((p, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs font-light text-blue-700">
                {p.pattern_name}
                <ArrowRight className="w-3 h-3" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* A/B Test Links */}
      {linkedTests?.length > 0 && (
        <div>
          <p className="text-xs font-light text-slate-600 mb-2">🧪 Empfohlene Tests:</p>
          <div className="space-y-1">
            {linkedTests.map((t, idx) => (
              <p key={idx} className="text-xs font-light text-slate-700">
                • {t.test_name}
              </p>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}