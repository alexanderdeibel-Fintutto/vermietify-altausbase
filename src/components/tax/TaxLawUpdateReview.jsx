import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxLawUpdateReview({ update, open, onOpenChange, onApplied }) {
  const [approvedConfigs, setApprovedConfigs] = useState(new Set());
  const [approvedRules, setApprovedRules] = useState(new Set());
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleConfig = (index) => {
    const newSet = new Set(approvedConfigs);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setApprovedConfigs(newSet);
  };

  const toggleRule = (index) => {
    const newSet = new Set(approvedRules);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setApprovedRules(newSet);
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      
      await base44.functions.invoke('applyTaxLawSuggestions', {
        tax_law_update_id: update.id,
        approved_config_indices: Array.from(approvedConfigs),
        approved_rule_indices: Array.from(approvedRules),
        review_notes: reviewNotes
      });

      toast.success('Änderungen angewendet');
      onOpenChange(false);
      onApplied?.();
    } catch (err) {
      toast.error('Fehler beim Anwenden der Änderungen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectAll = async () => {
    try {
      setLoading(true);
      
      await base44.entities.TaxLawUpdate.update(update.id, {
        status: 'REJECTED',
        reviewed_by: (await base44.auth.me()).email,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes
      });

      toast.success('Update abgelehnt');
      onOpenChange(false);
      onApplied?.();
    } catch (err) {
      toast.error('Fehler beim Ablehnen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!update) return null;

  const configSuggestions = update.suggested_config_changes || [];
  const ruleSuggestions = update.suggested_rule_changes || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{update.title}</span>
            <Badge variant={update.relevance_score > 70 ? 'destructive' : 'secondary'}>
              Relevanz: {update.relevance_score}%
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Zusammenfassung</TabsTrigger>
            <TabsTrigger value="configs">Config-Vorschläge ({configSuggestions.length})</TabsTrigger>
            <TabsTrigger value="rules">Regel-Vorschläge ({ruleSuggestions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-xs text-slate-500">Zusammenfassung</Label>
                  <p className="text-sm text-slate-900">{update.ai_analysis?.analysis_summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-500">Betroffene Steuerarten</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {update.affected_tax_types?.map(type => (
                        <Badge key={type} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Inkrafttreten</Label>
                    <p className="text-sm mt-2">
                      {update.effective_date ? new Date(update.effective_date).toLocaleDateString('de-DE') : 'Unbekannt'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Betroffene Paragraphen</Label>
                  <div className="text-sm mt-2">
                    {update.affected_paragraphs?.join(', ') || '-'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configs" className="space-y-3">
            {configSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Config-Vorschläge</p>
            ) : (
              configSuggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardContent className="flex justify-between items-start pt-6">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{suggestion.config_key}</div>
                      <p className="text-xs text-slate-600 mt-1">{suggestion.display_name}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        <strong>Wert:</strong> {suggestion.suggested_value} ({suggestion.value_type})
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{suggestion.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Checkbox 
                        checked={approvedConfigs.has(index)}
                        onCheckedChange={() => toggleConfig(index)}
                      />
                      <Label className="text-xs cursor-pointer">Genehmigen</Label>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="rules" className="space-y-3">
            {ruleSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500">Keine Regel-Vorschläge</p>
            ) : (
              ruleSuggestions.map((suggestion, index) => (
                <Card key={index}>
                  <CardContent className="flex justify-between items-start pt-6">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{suggestion.rule_code}</div>
                      <p className="text-xs text-slate-600 mt-1">{suggestion.display_name}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{suggestion.rule_type}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{suggestion.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Checkbox 
                        checked={approvedRules.has(index)}
                        onCheckedChange={() => toggleRule(index)}
                      />
                      <Label className="text-xs cursor-pointer">Genehmigen</Label>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div>
          <Label>Notizen</Label>
          <Textarea 
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Optionale Notizen zur Überprüfung..."
            className="text-sm h-20"
          />
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRejectAll} disabled={loading}>
              Alle ablehnen
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Abbrechen
            </Button>
          </div>
          <Button 
            onClick={handleApply} 
            disabled={loading || (approvedConfigs.size === 0 && approvedRules.size === 0)}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Anwenden...
              </>
            ) : (
              'Ausgewählte anwenden'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}