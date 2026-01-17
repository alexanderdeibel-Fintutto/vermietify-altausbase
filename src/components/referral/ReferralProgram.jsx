import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Users } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function ReferralProgram() {
  const referralCode = 'VERMITIFY-XYZ123';
  const referralUrl = `https://vermitify.com/signup?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    showSuccess('Link kopiert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Freunde werben
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-[var(--vf-gradient-primary)] text-white rounded-lg text-center">
            <div className="text-3xl font-bold mb-1">€50</div>
            <div className="text-sm opacity-90">für jeden geworbenen Freund</div>
          </div>

          <div className="flex gap-2">
            <VfInput
              value={referralUrl}
              readOnly
            />
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
            <Users className="h-4 w-4" />
            <span>3 Freunde geworben - €150 verdient</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}