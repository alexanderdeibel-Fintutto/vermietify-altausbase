import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ComplianceTimeline() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadTimeline = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateComplianceTimeline', {
        year
      });

      if (response.data.success) {
        setTimeline(response.data.timeline);
      }
    } catch (error) {
      toast.error('Timeline-Laden fehlgeschlagen');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTimeline();
  }, [year]);

  const getStatusIcon = (item) => {
    if (item.status === 'submitted') return CheckCircle;
    if (item.days_until < 30) return AlertCircle;
    return Clock;
  };

  const getStatusColor = (item) => {
    if (item.status === 'submitted') return 'text-green-600';
    if (item.days_until < 30) return 'text-red-600';
    if (item.days_until < 60) return 'text-yellow-600';
    return 'text-slate-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Compliance-Timeline
          </CardTitle>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-1 border rounded"
          >
            {[0, 1, 2].map(offset => (
              <option key={offset} value={new Date().getFullYear() - offset}>
                {new Date().getFullYear() - offset}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-8 text-slate-600">Lädt...</p>
        ) : timeline && timeline.length > 0 ? (
          <div className="space-y-4">
            {timeline.map((item, idx) => {
              const Icon = getStatusIcon(item);
              const color = getStatusColor(item);

              return (
                <div key={idx} className="flex items-start gap-3 pb-4 border-b last:border-0">
                  <Icon className={`w-5 h-5 mt-0.5 ${color}`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-slate-600">
                      {new Date(item.date).toLocaleDateString('de-DE')}
                    </div>
                    {item.days_until !== undefined && (
                      <div className="text-xs text-slate-500 mt-1">
                        {item.days_until > 0 ? `In ${item.days_until} Tagen` : 'Überfällig'}
                      </div>
                    )}
                  </div>
                  <Badge variant={item.status === 'submitted' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-8 text-slate-600">Keine Events</p>
        )}
      </CardContent>
    </Card>
  );
}