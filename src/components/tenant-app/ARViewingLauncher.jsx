import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Eye, Star } from 'lucide-react';

export default function ARViewingLauncher({ companyId }) {
  const [unitId, setUnitId] = useState('');
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: viewings = [] } = useQuery({
    queryKey: ['ar-viewings', companyId],
    queryFn: () => base44.asServiceRole.entities.ARViewing.filter({ company_id: companyId }, '-created_date', 10)
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('createARViewingSession', { unit_id: unitId, applicant_email: email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ar-viewings'] });
      setUnitId('');
      setEmail('');
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            AR-Wohnungsbesichtigung erstellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Einheits-ID"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Bewerber E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!unitId || !email || createMutation.isPending}
            className="w-full"
          >
            AR-Besichtigung versenden
          </Button>
          <p className="text-xs text-slate-600">
            Der Bewerber erhält einen Link zur virtuellen 3D-Besichtigung per AR
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {viewings.map(viewing => (
          <Card key={viewing.id}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{viewing.applicant_email}</span>
                </div>
                {viewing.interest_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs">{viewing.interest_rating}/5</span>
                  </div>
                )}
              </div>
              <div className="text-xs space-y-1">
                <p>Einheit: {viewing.unit_id}</p>
                {viewing.session_duration_minutes > 0 && (
                  <p>Dauer: {viewing.session_duration_minutes} Min</p>
                )}
                <p className="text-slate-600">
                  {viewing.interaction_points?.length || 0} Interaktionen
                </p>
                {viewing.scheduled_physical_viewing && (
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    Besichtigung gebucht
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}