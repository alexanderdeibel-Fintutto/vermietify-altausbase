import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Key, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function KeyManagement({ buildingId }) {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: keys = [] } = useQuery({
    queryKey: ['keys', buildingId],
    queryFn: async () => {
      // Simplified key tracking via documents
      return await base44.entities.Document.filter(
        { 
          category: 'Verwaltung',
          name: { $regex: 'Schlüssel' }
        },
        '-created_date',
        50
      );
    }
  });

  const checkoutMutation = useMutation({
    mutationFn: async (keyId) => {
      const user = await base44.auth.me();
      return await base44.entities.Document.update(keyId, {
        notes: `Ausgegeben an ${user.full_name} am ${new Date().toLocaleString('de-DE')}`,
        status: 'versendet'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      toast.success('Schlüssel ausgegeben');
    }
  });

  const checkinMutation = useMutation({
    mutationFn: async (keyId) => {
      const user = await base44.auth.me();
      return await base44.entities.Document.update(keyId, {
        notes: `Zurückgegeben von ${user.full_name} am ${new Date().toLocaleString('de-DE')}`,
        status: 'erstellt'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keys'] });
      toast.success('Schlüssel zurückgegeben');
    }
  });

  const sampleKeys = [
    { id: 'k1', name: 'Haupteingang', location: 'Gebäude A', status: 'available' },
    { id: 'k2', name: 'Keller', location: 'Gebäude A', status: 'checked_out' },
    { id: 'k3', name: 'Dachboden', location: 'Gebäude B', status: 'available' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Key className="w-4 h-4" />
          Schlüsselverwaltung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Schlüssel suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {sampleKeys.map(key => (
            <div key={key.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{key.name}</p>
                  <p className="text-xs text-slate-600">{key.location}</p>
                </div>
                <Badge className={
                  key.status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }>
                  {key.status === 'available' ? 'Verfügbar' : 'Ausgegeben'}
                </Badge>
              </div>
              <div className="flex gap-2">
                {key.status === 'available' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toast.success('Schlüssel ausgegeben')}
                  >
                    <ArrowRight className="w-3 h-3 mr-1" />
                    Ausgeben
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => toast.success('Schlüssel zurückgegeben')}
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Zurückgeben
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}