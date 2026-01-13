import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

export default function UsageMeter({ limitCode, title, icon: Icon, current, limit }) {
  if (limit === -1) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-slate-500" />}
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Unbegrenzt
            </Badge>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4 text-slate-500" />}
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
          </div>
          {(isWarning || isCritical) && (
            <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-red-500' : 'text-yellow-500'}`} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className={
              isCritical ? '[&>div]:bg-red-500' :
              isWarning ? '[&>div]:bg-yellow-500' :
              '[&>div]:bg-green-500'
            }
          />
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>{current} von {limit} genutzt</span>
            <span>{percentage.toFixed(0)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}