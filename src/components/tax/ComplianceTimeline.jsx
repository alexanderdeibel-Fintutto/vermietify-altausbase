import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ComplianceTimeline() {
  const [taxYear] = React.useState(new Date().getFullYear() - 1);

  const { data: timeline } = useQuery({
    queryKey: ['complianceTimeline', taxYear],
    queryFn: async () => {
      const res = await base44.functions.invoke('generateComplianceTimeline', { tax_year: taxYear });
      return res.data.timeline;
    }
  });

  if (!timeline) return <div className="p-4 text-slate-500">Loading...</div>;

  const getIcon = (priority) => {
    if (priority === 'critical') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (priority === 'high') return <Clock className="w-5 h-5 text-orange-600" />;
    return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-3">
      {timeline.map((item, i) => (
        <Card key={i} className={`p-4 border-l-4 ${
          item.priority === 'critical' ? 'border-l-red-600 bg-red-50' :
          item.priority === 'high' ? 'border-l-orange-600 bg-orange-50' :
          'border-l-blue-600 bg-blue-50'
        }`}>
          <div className="flex gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(item.priority)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-light text-sm">{item.title}</p>
                  <p className="text-xs text-slate-600 font-light mt-1">{item.description}</p>
                </div>
                <span className="text-xs text-slate-500 font-light">{item.target_date}</span>
              </div>
              {item.action_items?.length > 0 && (
                <ul className="mt-2 text-xs space-y-1 text-slate-700">
                  {item.action_items.map((action, j) => (
                    <li key={j} className="font-light">○ {action}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}