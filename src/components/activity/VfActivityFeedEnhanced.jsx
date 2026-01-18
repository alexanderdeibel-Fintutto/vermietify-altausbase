import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import ActivityTimeline from '@/components/shared/ActivityTimeline';

export default function VfActivityFeedEnhanced({ activities = [], title = "Letzte Aktivitäten" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ActivityTimeline activities={activities} />
      </CardContent>
    </Card>
  );
}