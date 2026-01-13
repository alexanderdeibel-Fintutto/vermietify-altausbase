import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function FinancingForm({ open, onOpenChange, financing, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(financing || {
    building_id: '',
    lender: '',
    loan_amount: '',
    interest_rate: '',
    term_years: '',
    start_date: null,
    loan_type: 'mortgage',
    status: 'active'
  });

  const [startDate, setStartDate] = useState(financing?.start_date ? parseISO(financing.start_date) : null);

  const mutation = useMutation({
    mutationFn: (data) => financing 
      ? base44.entities.Financing.update(financing.id, data)
      : base44.entities.Financing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financing'] });
      toast.success(financing ? 'Kreditvertrag aktualisiert' : 'Kreditvertrag erstellt');
      onOpenChange(false);
      onSuccess?.();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      loan_amount: parseFloat(formData.loan_amount),
      interest_rate: parseFloat(formData.interest_rate),
      term_years: parseInt(formData.term_years)
    };
    mutation.mutate(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{financing ? 'Kreditvertrag bearbeiten' : 'Neuer Kreditvertrag'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Kreditgeber *</Label>
            <Input 
              value={formData.lender}
              onChange={(e) => setFormData({...formData, lender: e.target.value})}
              placeholder="z.B. Deutsche Bank"
            />
          </div>

          <div>
            <Label>Kredittype</Label>
            <Select value={formData.loan_type} onValueChange={(val) => setFormData({...formData, loan_type: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mortgage">Hypothek</SelectItem>
                <SelectItem value="building_loan">Bauspardarlehen</SelectItem>
                <SelectItem value="line_of_credit">Kreditlinie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Kreditbetrag (€) *</Label>
              <Input 
                type="number" 
                step="1000"
                value={formData.loan_amount}
                onChange={(e) => setFormData({...formData, loan_amount: e.target.value})}
              />
            </div>
            <div>
              <Label>Zinssatz (%) *</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.interest_rate}
                onChange={(e) => setFormData({...formData, interest_rate: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Laufzeit (Jahre)</Label>
              <Input 
                type="number"
                value={formData.term_years}
                onChange={(e) => setFormData({...formData, term_years: e.target.value})}
              />
            </div>
            <div>
              <Label>Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd.MM.yyyy', { locale: de }) : 'Datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="completed">Abgelöst</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="bg-blue-600">
              {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}