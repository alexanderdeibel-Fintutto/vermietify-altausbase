import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function NeighborComplaints({ buildingId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    complainant: '',
    subject: '',
    description: ''
  });
  const queryClient = useQueryClient();

  const { data: complaints = [] } = useQuery({
    queryKey: ['complaints', buildingId],
    queryFn: () => base44.entities.SupportTicket.filter(
      { 
        category: 'complaint',
        ...(buildingId && { building_id: buildingId })
      },
      '-created_date',
      20
    )
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.SupportTicket.create({
        subject: data.subject,
        description: `Beschwerde von: ${data.complainant}\n\n${data.description}`,
        category: 'complaint',
        priority: 'medium',
        status: 'open',
        tenant_email: 'neighbor@complaint.de'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Beschwerde erfasst');
      setFormData({ complainant: '', subject: '', description: '' });
      setShowForm(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Beschwerden
            {complaints.length > 0 && <Badge>{complaints.length}</Badge>}
          </CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="p-3 bg-orange-50 rounded-lg space-y-2">
            <Input
              placeholder="Von wem?"
              value={formData.complainant}
              onChange={(e) => setFormData({ ...formData, complainant: e.target.value })}
            />
            <Input
              placeholder="Betreff"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
            <Textarea
              placeholder="Details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.subject}
              className="w-full"
            >
              Beschwerde erfassen
            </Button>
          </div>
        )}

        {complaints.slice(0, 3).map(complaint => (
          <div key={complaint.id} className="p-2 bg-slate-50 rounded">
            <p className="font-semibold text-sm">{complaint.subject}</p>
            <Badge className="mt-1 text-xs bg-orange-100 text-orange-800">
              {complaint.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}