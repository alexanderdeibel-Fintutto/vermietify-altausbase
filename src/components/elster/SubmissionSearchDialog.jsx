import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, FileText, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SubmissionSearchDialog({ open, onOpenChange, onSelect }) {
  const [formType, setFormType] = useState('all');
  const [status, setStatus] = useState('all');
  const [year, setYear] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-submissions-search'],
    queryFn: () => base44.entities.ElsterSubmission.list('-created_date'),
    enabled: open
  });

  const filtered = submissions.filter(sub => {
    if (formType !== 'all' && sub.tax_form_type !== formType) return false;
    if (status !== 'all' && sub.status !== status) return false;
    if (year !== 'all' && sub.tax_year !== parseInt(year)) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        sub.tax_form_type?.toLowerCase().includes(search) ||
        sub.transfer_ticket?.toLowerCase().includes(search) ||
        sub.building_id?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleSelect = (submission) => {
    onSelect(submission);
    onOpenChange(false);
  };

  const years = [...new Set(submissions.map(s => s.tax_year))].sort((a, b) => b - a);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Submissions durchsuchen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Formular-Typ</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  <SelectItem value="ANLAGE_V">Anlage V</SelectItem>
                  <SelectItem value="EUER">EÜR</SelectItem>
                  <SelectItem value="EST1B">EST 1B</SelectItem>
                  <SelectItem value="GEWERBESTEUER">Gewerbesteuer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="DRAFT">Entwurf</SelectItem>
                  <SelectItem value="VALIDATED">Validiert</SelectItem>
                  <SelectItem value="SUBMITTED">Übermittelt</SelectItem>
                  <SelectItem value="ACCEPTED">Akzeptiert</SelectItem>
                  <SelectItem value="REJECTED">Abgelehnt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Jahr</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jahre</SelectItem>
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Suche</Label>
              <Input
                placeholder="ID, Ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{filtered.length} Ergebnisse</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFormType('all');
                setStatus('all');
                setYear('all');
                setSearchTerm('');
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-2">
              {filtered.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => handleSelect(sub)}
                  className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{sub.tax_form_type}</span>
                        <Badge variant="outline" className="text-xs">
                          {sub.tax_year}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600">
                        {sub.legal_form} • Erstellt: {new Date(sub.created_date).toLocaleDateString('de-DE')}
                      </div>
                      {sub.transfer_ticket && (
                        <div className="text-xs text-slate-500 mt-1">
                          Ticket: {sub.transfer_ticket}
                        </div>
                      )}
                    </div>
                    <Badge variant={sub.status === 'ACCEPTED' ? 'default' : 'secondary'}>
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}