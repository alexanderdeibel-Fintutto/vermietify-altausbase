import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TenantInquiry({ tenantId, tenantEmail }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    category: 'general',
    message: ''
  });

  const queryClient = useQueryClient();

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ['tenantInquiries', tenantId],
    queryFn: async () => {
      const messages = await base44.entities.TenantMessage.filter({
        tenant_id: tenantId
      });
      return messages.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const createInquiryMutation = useMutation({
    mutationFn: async (data) => {
      const inquiry = await base44.entities.TenantMessage.create({
        tenant_id: tenantId,
        subject: data.subject,
        category: data.category,
        message: data.message,
        status: 'open',
        created_by: tenantEmail
      });

      // Versende Benachrichtigung an Admin
      try {
        await base44.integrations.Core.SendEmail({
          to: 'admin@finx.de',
          subject: `Neue Anfrage von Mieter: ${data.subject}`,
          body: `Ein Mieter hat eine neue Anfrage eingereicht:\n\nKategorie: ${data.category}\nBetreff: ${data.subject}\n\nNachricht:\n${data.message}\n\nBitte im Mieterportal beantworten.`
        });
      } catch (error) {
        console.error('Email-Fehler:', error);
      }

      return inquiry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantInquiries'] });
      setFormData({ subject: '', category: 'general', message: '' });
      toast.success('Anfrage versendet');
    },
    onError: () => {
      toast.error('Fehler beim Versenden der Anfrage');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.subject || !formData.message) {
      toast.error('Bitte füllen Sie alle Felder aus');
      return;
    }

    createInquiryMutation.mutate(formData);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      repair: 'Reparatur/Wartung',
      billing: 'Abrechnung/Zahlung',
      general: 'Allgemein',
      other: 'Sonstiges'
    };
    return labels[category] || category;
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-slate-100 text-slate-800'
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      {/* Neue Anfrage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Neue Anfrage stellen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700">Kategorie</label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="repair">Reparatur/Wartung</SelectItem>
                <SelectItem value="billing">Abrechnung/Zahlung</SelectItem>
                <SelectItem value="general">Allgemein</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Betreff</label>
            <Input
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Kurzbeschreibung Ihrer Anfrage"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">Nachricht</label>
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Beschreiben Sie Ihre Anfrage detailliert..."
              className="mt-1 min-h-32"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={createInquiryMutation.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Anfrage senden
          </Button>
        </CardContent>
      </Card>

      {/* Anfragenhistorie */}
      {isLoading ? (
        <div className="text-center py-8">Lädt...</div>
      ) : inquiries && inquiries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Anfragenhistorie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">{inquiry.subject}</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(inquiry.created_date), 'dd. MMMM yyyy HH:mm', { locale: de })}
                    </p>
                  </div>
                  <Badge className={getStatusColor(inquiry.status)}>
                    {inquiry.status === 'open' && 'Offen'}
                    {inquiry.status === 'in_progress' && 'In Bearbeitung'}
                    {inquiry.status === 'resolved' && 'Gelöst'}
                    {inquiry.status === 'closed' && 'Geschlossen'}
                  </Badge>
                </div>

                <p className="text-sm text-slate-700 mb-3">{inquiry.message}</p>

                <div className="text-xs text-slate-500">
                  Kategorie: {getCategoryLabel(inquiry.category)}
                </div>

                {inquiry.response && (
                  <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Antwort der Verwaltung:</p>
                    <p className="text-sm text-blue-800">{inquiry.response}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-slate-500">
            Keine Anfragen vorhanden
          </CardContent>
        </Card>
      )}
    </div>
  );
}