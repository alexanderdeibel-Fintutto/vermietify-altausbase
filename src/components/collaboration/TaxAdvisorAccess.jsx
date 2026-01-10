import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Mail, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxAdvisorAccess() {
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: advisors = [] } = useQuery({
    queryKey: ['advisors'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSharedAdvisors', {});
      return response.data.advisors;
    }
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('shareWithAdvisor', { advisor_email: email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advisors'] });
      toast.success('Zugriff gewährt');
      setEmail('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Steuerberater-Zugang
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            placeholder="steuerberater@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={() => shareMutation.mutate()} disabled={!email}>
            <Mail className="w-4 h-4 mr-2" />
            Einladen
          </Button>
        </div>

        {advisors.map(advisor => (
          <div key={advisor.email} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold">{advisor.email}</span>
            </div>
            <Badge>Lesezugriff</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}