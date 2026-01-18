import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Share2 } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function ReferralProgram() {
  const referralCode = 'VERMI-ABC123';
  const referralLink = `https://vermitify.de/signup?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    showSuccess('Link kopiert!');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Freunde einladen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-[var(--vf-primary-50)] to-[var(--vf-accent-50)] rounded-lg text-center">
            <div className="text-3xl font-bold text-[var(--theme-primary)] mb-1">€50</div>
            <div className="text-sm text-[var(--theme-text-secondary)]">
              für jeden geworbenen Freund
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ihr Empfehlungslink</label>
            <div className="flex gap-2">
              <VfInput value={referralLink} readOnly className="flex-1" />
              <Button variant="outline" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button variant="gradient" className="w-full">
            <Share2 className="h-4 w-4 mr-2" />
            Link teilen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}