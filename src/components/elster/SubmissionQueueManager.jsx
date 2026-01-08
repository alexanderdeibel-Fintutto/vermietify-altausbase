import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListChecks, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SubmissionQueueManager() {
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('manageSubmissionQueue', {});
      
      if (response.data.success) {
        setQueue(response.data.queue);
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Queue');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadQueue();
  }, []);

  if (!queue) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            Submission Queue
          </div>
          <Button size="sm" variant="ghost" onClick={loadQueue} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-blue-50 rounded">
            <div className="text-xs text-slate-600">Validierung bereit</div>
            <div className="text-lg font-bold">{queue.ready_for_validation.length}</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="text-xs text-slate-600">Übermittlung bereit</div>
            <div className="text-lg font-bold">{queue.ready_for_submission.length}</div>
          </div>
          <div className="p-2 bg-orange-50 rounded">
            <div className="text-xs text-slate-600">Priorität</div>
            <div className="text-lg font-bold">{queue.priority_items.length}</div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="text-xs text-slate-600">Blockiert</div>
            <div className="text-lg font-bold">{queue.stalled_items.length}</div>
          </div>
        </div>

        {queue.priority_items.length > 0 && (
          <div className="pt-2 border-t">
            <div className="text-xs font-medium mb-2">Prioritäts-Items</div>
            {queue.priority_items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs p-2 bg-orange-50 rounded mb-1">
                <Badge variant="destructive" className="text-xs">
                  {item.days_until_deadline} Tage bis Deadline
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}