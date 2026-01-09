import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Camera, Send, CheckCircle } from 'lucide-react';
import MobilePhotoUpload from './MobilePhotoUpload';
import { toast } from 'sonner';

export default function MobileMaintenanceRequest({ tenantId }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium',
    attachments: []
  });
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ['maintenanceRequests', tenantId],
    queryFn: () => base44.entities.MaintenanceTask.filter({ tenant_id: tenantId }, '-created_date', 20),
    enabled: !!tenantId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.functions.invoke('createMaintenanceRequest', {
        tenant_id: tenantId,
        ...data
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests'] });
      toast.success('Wartungsanfrage gesendet');
      setFormData({ title: '', description: '', category: 'general', priority: 'medium', attachments: [] });
      setShowForm(false);
    }
  });

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800'
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={() => setShowForm(!showForm)} 
        className="w-full bg-orange-600 hover:bg-orange-700 h-12 text-base"
      >
        <Wrench className="w-5 h-5 mr-2" />
        Neue Wartungsanfrage
      </Button>

      {showForm && (
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg">Wartungsanfrage erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Kategorie</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">🚰 Sanitär</SelectItem>
                  <SelectItem value="electrical">⚡ Elektrik</SelectItem>
                  <SelectItem value="heating">🔥 Heizung</SelectItem>
                  <SelectItem value="cleaning">🧹 Reinigung</SelectItem>
                  <SelectItem value="general">🔧 Allgemein</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Priorität</label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig - innerhalb 2 Wochen</SelectItem>
                  <SelectItem value="medium">Mittel - innerhalb 1 Woche</SelectItem>
                  <SelectItem value="high">Hoch - innerhalb 2 Tagen</SelectItem>
                  <SelectItem value="urgent">Dringend - sofort</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Kurzbeschreibung</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="z.B. Tropfender Wasserhahn"
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Details</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreiben Sie das Problem detailliert..."
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Fotos anhängen
              </label>
              <MobilePhotoUpload
                onUploadComplete={(urls) => setFormData({ ...formData, attachments: urls })}
                maxFiles={5}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => createMutation.mutate(formData)}
                disabled={createMutation.isPending || !formData.title}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Absenden
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List of Requests */}
      <div className="space-y-3">
        {requests.map(request => (
          <Card key={request.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{request.title}</h4>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{request.description}</p>
                </div>
                <Badge className={statusColors[request.status]}>
                  {request.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mt-3 text-xs">
                <Badge variant="outline">{request.category}</Badge>
                <Badge className={priorityColors[request.priority]}>
                  {request.priority}
                </Badge>
                <span className="text-slate-500 ml-auto">
                  {new Date(request.created_date).toLocaleDateString('de-DE')}
                </span>
              </div>

              {request.status === 'completed' && (
                <div className="mt-3 p-2 bg-green-50 rounded flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  Erledigt am {new Date(request.completed_date).toLocaleDateString('de-DE')}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}