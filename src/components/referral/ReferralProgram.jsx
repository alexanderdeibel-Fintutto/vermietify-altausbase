import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Gift, Copy, Mail, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';

export default function ReferralProgram() {
  const [referralEmail, setReferralEmail] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const referralCode = user?.id ? `REF-${user.id.substring(0, 8).toUpperCase()}` : '';
  const referralLink = `https://vermitify.de/signup?ref=${referralCode}`;

  const sendReferralMutation = useMutation({
    mutationFn: async (email) => {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `${user.full_name} empfiehlt vermitify`,
        body: `Hallo,\n\n${user.full_name} nutzt vermitify für die Immobilienverwaltung und empfiehlt es weiter.\n\nMit diesem Link erhalten Sie 1 Monat kostenlos:\n${referralLink}\n\nBeste Grüße\nIhr vermitify Team`,
        from_name: 'vermitify Empfehlungen'
      });
    },
    onSuccess: () => setReferralEmail('')
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Empfehlungsprogramm
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-[var(--vf-primary-50)] rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold mb-2">1 Monat geschenkt!</h3>
          <p className="text-[var(--theme-text-secondary)] mb-4">
            Empfehlen Sie vermitify und erhalten Sie 1 Monat kostenlos für jeden neuen Kunden
          </p>
        </div>

        <div>
          <label className="vf-label">Ihr Empfehlungslink</label>
          <div className="flex gap-2">
            <VfInput
              value={referralLink}
              readOnly
            />
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>
          <label className="vf-label">Freund per E-Mail einladen</label>
          <div className="flex gap-2">
            <VfInput
              type="email"
              placeholder="freund@example.com"
              value={referralEmail}
              onChange={(e) => setReferralEmail(e.target.value)}
            />
            <Button 
              variant="gradient"
              onClick={() => sendReferralMutation.mutate(referralEmail)}
              disabled={!referralEmail || sendReferralMutation.isPending}
            >
              <Mail className="h-4 w-4 mr-2" />
              Senden
            </Button>
          </div>
        </div>

        {sendReferralMutation.isSuccess && (
          <div className="flex items-center gap-2 text-[var(--vf-success-600)] text-sm">
            <CheckCircle className="h-4 w-4" />
            Einladung versendet!
          </div>
        )}
      </CardContent>
    </Card>
  );
}