import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import TenantChatBot from '@/components/ai/TenantChatBot';
import { Sparkles } from 'lucide-react';

export default function TenantChatbotPage() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: leases = [] } = useQuery({
    queryKey: ['myLeases', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.LeaseContract.filter({ tenant_email: user.email });
    },
    enabled: !!user?.email
  });

  const activeLease = leases.find(l => {
    const end = new Date(l.end_date || new Date(9999, 0, 1));
    return end > new Date();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Sparkles className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-purple-900">KI-Mietersupport</h1>
        </div>

        <p className="text-gray-700 mb-8">
          Stelle Fragen zu deinem Mietvertrag, Betriebskosten, Reparaturen und mehr.
          Unser KI-Assistent hilft dir 24/7 weiter.
        </p>

        {activeLease ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[600px]">
            {/* Chat */}
            <TenantChatBot leaseId={activeLease.id} />

            {/* Info Panel */}
            <div className="space-y-4">
              <div className="bg-white border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold mb-4 text-purple-900">Deine Mietdaten</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-600">Einheit</dt>
                    <dd className="font-medium">{activeLease.unit_id}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Monatliche Miete</dt>
                    <dd className="font-medium">€{activeLease.monthly_rent.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Vertragsstart</dt>
                    <dd className="font-medium">{new Date(activeLease.start_date).toLocaleDateString('de-DE')}</dd>
                  </div>
                  {activeLease.end_date && (
                    <div>
                      <dt className="text-gray-600">Vertragsende</dt>
                      <dd className="font-medium">{new Date(activeLease.end_date).toLocaleDateString('de-DE')}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-white border border-purple-200 rounded-lg p-6">
                <h3 className="font-bold mb-4 text-purple-900">Häufige Fragen</h3>
                <ul className="space-y-2 text-sm">
                  <li className="cursor-pointer hover:text-purple-600">• Wie zahle ich meine Miete?</li>
                  <li className="cursor-pointer hover:text-purple-600">• Was sind Betriebskosten?</li>
                  <li className="cursor-pointer hover:text-purple-600">• Wie melde ich einen Schaden?</li>
                  <li className="cursor-pointer hover:text-purple-600">• Wann erhalte ich die Kaution zurück?</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-purple-200 rounded-lg p-8 text-center">
            <p className="text-gray-600">Kein aktiver Mietvertrag gefunden. Bitte kontaktiere die Verwaltung.</p>
          </div>
        )}
      </div>
    </div>
  );
}