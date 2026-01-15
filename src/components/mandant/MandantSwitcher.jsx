import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MandantSwitcher() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  });

  const { data: userAccess = [] } = useQuery({
    queryKey: ['userMandantAccess', user?.email],
    queryFn: () => base44.entities.UserMandantAccess.filter({ 
      user_email: user.email,
      ist_aktiv: true 
    }),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  });

  const { data: mandanten = [] } = useQuery({
    queryKey: ['mandanten'],
    queryFn: async () => {
      const allMandanten = await base44.entities.Mandant.filter({ ist_aktiv: true });
      
      if (user?.role === 'admin') return allMandanten;
      
      // Filter to only mandanten the user has access to
      const accessibleMandantIds = userAccess.map(a => a.mandant_id);
      return allMandanten.filter(m => accessibleMandantIds.includes(m.id));
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  });

  const { data: currentMandant } = useQuery({
    queryKey: ['selectedMandant'],
    queryFn: async () => {
      const stored = localStorage.getItem('selectedMandantId');
      if (stored && mandanten.find(m => m.id === stored)) {
        return mandanten.find(m => m.id === stored);
      }
      return mandanten[0] || null;
    },
    enabled: mandanten.length > 0,
    staleTime: 10 * 60 * 1000,
    cacheTime: 15 * 60 * 1000
  });

  const switchMutation = useMutation({
    mutationFn: async (mandantId) => {
      localStorage.setItem('selectedMandantId', mandantId);
      return mandanten.find(m => m.id === mandantId);
    },
    onSuccess: (mandant) => {
      queryClient.invalidateQueries(['selectedMandant']);
      queryClient.invalidateQueries(); // Refresh all data for new mandant
      toast.success(`Gewechselt zu: ${mandant.name}`);
      window.location.reload(); // Force reload to apply new context
    }
  });

  if (!user || mandanten.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
      <Building2 className="w-4 h-4 text-slate-600" />
      <Select
        value={currentMandant?.id}
        onValueChange={(value) => switchMutation.mutate(value)}
      >
        <SelectTrigger className="w-48 border-0 shadow-none">
          <SelectValue placeholder="Mandant wählen..." />
        </SelectTrigger>
        <SelectContent>
          {mandanten.map(mandant => (
            <SelectItem key={mandant.id} value={mandant.id}>
              <div className="flex items-center gap-2">
                {mandant.id === currentMandant?.id && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                <span>{mandant.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}