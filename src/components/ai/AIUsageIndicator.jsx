import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function AIUsageIndicator({ userId }) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (userId) checkRateLimit();
  }, [userId]);

  async function checkRateLimit() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const logs = await base44.entities.AIUsageLog.filter({
        user_email: userId,
        created_date: { $gte: oneHourAgo.toISOString() }
      });
      
      const settingsList = await base44.entities.AISettings.list();
      const settings = settingsList?.[0] || { rate_limit_per_user_hour: 20 };
      
      const count = logs?.length || 0;
      const limit = settings.rate_limit_per_user_hour || 20;
      const remainingCount = Math.max(0, limit - count);
      
      setRemaining({
        count: remainingCount,
        limit,
        percent: Math.round((remainingCount / limit) * 100)
      });
    } catch (e) {
      console.error('Failed to check rate limit:', e);
    }
  }

  if (!remaining) return null;

  const getColor = () => {
    if (remaining.percent > 50) return 'default';
    if (remaining.percent > 20) return 'secondary';
    return 'destructive';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={getColor()} className="cursor-help">
            {remaining.count} Anfragen
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Noch {remaining.count} von {remaining.limit} Anfragen diese Stunde verfügbar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}