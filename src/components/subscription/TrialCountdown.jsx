import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TrialCountdown({ trialEndDate }) {
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const calculateDaysLeft = () => {
      const now = new Date();
      const end = new Date(trialEndDate);
      const diff = end - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, days));
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60 * 60);
    return () => clearInterval(interval);
  }, [trialEndDate]);

  if (daysLeft === 0) return null;

  return (
    <Card className="border-[var(--vf-warning-500)] bg-[var(--vf-warning-50)]">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[var(--vf-warning-500)] flex items-center justify-center text-white flex-shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[var(--vf-warning-700)]">
              Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} Testphase
            </div>
            <div className="text-sm text-[var(--theme-text-secondary)]">
              Upgraden Sie jetzt und sparen Sie 20% bei jährlicher Zahlung
            </div>
          </div>
          <Link to={createPageUrl('Pricing')}>
            <Button variant="gradient" size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Jetzt upgraden
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}