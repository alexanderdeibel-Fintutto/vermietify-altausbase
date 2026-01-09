import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BudgetRequestForm({ onSuccess }) {
  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approvers, setApprovers] = useState([]);
  const [approverInput, setApproverInput] = useState('');
  const [formData, setFormData] = useState({
    request_title: '',
    category: 'marketing',
    requested_amount: '',
    justification: '',
    start_date: '',
    end_date: ''
  });

  const handleAddApprover = () => {
    if (!approverInput.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Ungültige Email-Adresse');
      return;
    }
    if (approvers.includes(approverInput)) {
      toast.error('Dieser Genehmiger wurde bereits hinzugefügt');
      return;
    }
    setApprovers([...approvers, approverInput]);
    setApproverInput('');
  };

  const handleSubmit = async () => {
    try {
      if (!formData.request_title || !formData.requested_amount || !approvers.length) {
        toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
        return;
      }

      setSubmitting(true);

      const response = await base44.functions.invoke('createBudgetRequestWithWorkflow', {
        request_title: formData.request_title,
        category: formData.category,
        requested_amount: parseFloat(formData.requested_amount),
        justification: formData.justification,
        start_date: formData.start_date,
        end_date: formData.end_date,
        approver_emails: approvers
      });

      toast.success('Budgetanfrage eingereicht');
      setShowDialog(false);
      setFormData({
        request_title: '',
        category: 'marketing',
        requested_amount: '',
        justification: '',
        start_date: '',
        end_date: ''
      });
      setApprovers([]);
      onSuccess?.();
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
        <Plus className="w-4 h-4" />
        Neue Budgetanfrage
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Budgetanfrage einreichen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label className="text-sm">Titel *</Label>
              <Input
                value={formData.request_title}
                onChange={(e) => setFormData({ ...formData, request_title: e.target.value })}
                placeholder="z.B. Q1 Marketing Budget"
                className="mt-1"
              />
            </div>

            {/* Category & Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Kategorie *</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded px-3 py-2 text-sm"
                >
                  <option value="marketing">Marketing</option>
                  <option value="it">IT</option>
                  <option value="hr">HR</option>
                  <option value="operations">Betrieb</option>
                  <option value="other">Sonstiges</option>
                </select>
              </div>
              <div>
                <Label className="text-sm">Betrag (€) *</Label>
                <Input
                  type="number"
                  value={formData.requested_amount}
                  onChange={(e) => setFormData({ ...formData, requested_amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Startdatum</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Enddatum</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Justification */}
            <div>
              <Label className="text-sm">Begründung</Label>
              <Textarea
                value={formData.justification}
                onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                placeholder="Warum wird dieses Budget benötigt?"
                className="mt-1 min-h-20"
              />
            </div>

            {/* Approvers */}
            <div>
              <Label className="text-sm">Genehmiger *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="email"
                  value={approverInput}
                  onChange={(e) => setApproverInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddApprover()}
                  placeholder="Email des Genehmigers"
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleAddApprover}
                  variant="outline"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {approvers.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {approvers.map((email, idx) => (
                    <Badge key={idx} className="bg-blue-100 text-blue-800 flex items-center gap-2">
                      {email}
                      <button
                        onClick={() => setApprovers(approvers.filter((_, i) => i !== idx))}
                        className="ml-1 hover:opacity-70"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  'Einreichen'
                )}
              </Button>
              <Button
                onClick={() => setShowDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}