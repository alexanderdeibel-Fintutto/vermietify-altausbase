import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Star, Search, Send, Check, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TenantFeedbackManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: allFeedback = [], isLoading } = useQuery({
    queryKey: ['adminFeedback'],
    queryFn: () => base44.entities.TenantFeedback.list('-created_at', 200),
    refetchInterval: 30000
  });

  const respondMutation = useMutation({
    mutationFn: async ({ feedbackId, response }) => {
      return await base44.functions.invoke('respondToTenantFeedback', {
        feedback_id: feedbackId,
        response
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      toast.success('Antwort gesendet');
      setSelectedFeedback(null);
    }
  });

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ feedbackId, updates }) => {
      return await base44.entities.TenantFeedback.update(feedbackId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFeedback'] });
      toast.success('Feedback aktualisiert');
    }
  });

  const filteredFeedback = allFeedback.filter(f => {
    const matchesSearch = f.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    const matchesType = typeFilter === 'all' || f.feedback_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status) => {
    const variants = {
      new: 'bg-blue-100 text-blue-800',
      under_review: 'bg-amber-100 text-amber-800',
      responded: 'bg-green-100 text-green-800',
      resolved: 'bg-slate-100 text-slate-800',
      archived: 'bg-gray-100 text-gray-800'
    };
    return variants[status] || variants.new;
  };

  const getSentimentBadge = (sentiment) => {
    const variants = {
      positive: 'bg-green-100 text-green-800',
      neutral: 'bg-slate-100 text-slate-800',
      negative: 'bg-red-100 text-red-800'
    };
    return variants[sentiment] || '';
  };

  const groupedByStatus = allFeedback.reduce((acc, f) => {
    if (!acc[f.status]) acc[f.status] = 0;
    acc[f.status]++;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900 mb-2">Neu</p>
            <p className="text-3xl font-bold text-blue-700">{groupedByStatus.new || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-sm text-amber-900 mb-2">In Prüfung</p>
            <p className="text-3xl font-bold text-amber-700">{groupedByStatus.under_review || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <p className="text-sm text-green-900 mb-2">Beantwortet</p>
            <p className="text-3xl font-bold text-green-700">{groupedByStatus.responded || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-900 mb-2">Gelöst</p>
            <p className="text-3xl font-bold text-slate-700">{groupedByStatus.resolved || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mieter-Feedback
            </CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="new">Neu</SelectItem>
                  <SelectItem value="under_review">In Prüfung</SelectItem>
                  <SelectItem value="responded">Beantwortet</SelectItem>
                  <SelectItem value="resolved">Gelöst</SelectItem>
                  <SelectItem value="archived">Archiviert</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="portal_usability">Portal</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="communication">Kommunikation</SelectItem>
                  <SelectItem value="maintenance">Wartung</SelectItem>
                  <SelectItem value="general">Allgemein</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredFeedback.map(feedback => (
            <div
              key={feedback.id}
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              onClick={() => setSelectedFeedback(feedback)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-900">{feedback.subject || 'Kein Betreff'}</p>
                    <Badge className={getStatusBadge(feedback.status)}>{feedback.status}</Badge>
                    {feedback.sentiment && (
                      <Badge className={getSentimentBadge(feedback.sentiment)}>{feedback.sentiment}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{feedback.message}</p>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{feedback.tenant_name}</span>
                <span>•</span>
                <span>{feedback.feedback_type}</span>
                <span>•</span>
                <span>{new Date(feedback.created_at).toLocaleDateString('de-DE')}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedFeedback && (
        <FeedbackDetailDialog
          feedback={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
          onRespond={respondMutation.mutate}
          onUpdate={updateFeedbackMutation.mutate}
        />
      )}
    </div>
  );
}

function FeedbackDetailDialog({ feedback, onClose, onRespond, onUpdate }) {
  const [response, setResponse] = useState('');
  const [category, setCategory] = useState(feedback.category || 'uncategorized');
  const [priority, setPriority] = useState(feedback.priority || 'medium');
  const [internalNotes, setInternalNotes] = useState(feedback.internal_notes || '');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback-Details</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="respond">Antworten</TabsTrigger>
            <TabsTrigger value="manage">Verwalten</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600">Mieter</p>
                <p className="font-semibold">{feedback.tenant_name}</p>
                <p className="text-sm text-slate-600">{feedback.tenant_email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Typ</p>
                <Badge>{feedback.feedback_type}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-600">Bewertung</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600">Nachricht</p>
                <p className="text-sm bg-slate-50 p-3 rounded">{feedback.message}</p>
              </div>
              {feedback.admin_response && (
                <div>
                  <p className="text-xs text-slate-600">Admin-Antwort</p>
                  <p className="text-sm bg-green-50 p-3 rounded border border-green-200">{feedback.admin_response}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    von {feedback.responded_by} • {new Date(feedback.responded_at).toLocaleString('de-DE')}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="respond" className="space-y-4">
            <Textarea
              placeholder="Ihre Antwort an den Mieter..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-32"
            />
            <Button
              onClick={() => onRespond({ feedbackId: feedback.id, response })}
              disabled={!response.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Antwort senden
            </Button>
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Kategorie</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug_report">Fehlerbericht</SelectItem>
                  <SelectItem value="feature_request">Feature-Anfrage</SelectItem>
                  <SelectItem value="complaint">Beschwerde</SelectItem>
                  <SelectItem value="compliment">Lob</SelectItem>
                  <SelectItem value="suggestion">Vorschlag</SelectItem>
                  <SelectItem value="question">Frage</SelectItem>
                  <SelectItem value="uncategorized">Unkategorisiert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Priorität</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="urgent">Dringend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Interne Notizen</label>
              <Textarea
                placeholder="Notizen (nicht für Mieter sichtbar)..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => onUpdate({
                  feedbackId: feedback.id,
                  updates: { category, priority, internal_notes: internalNotes }
                })}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              <Button
                onClick={() => onUpdate({
                  feedbackId: feedback.id,
                  updates: { status: 'resolved', resolved_at: new Date().toISOString() }
                })}
                variant="outline"
              >
                Als gelöst markieren
              </Button>
              <Button
                onClick={() => onUpdate({
                  feedbackId: feedback.id,
                  updates: { status: 'archived' }
                })}
                variant="outline"
              >
                <Archive className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}