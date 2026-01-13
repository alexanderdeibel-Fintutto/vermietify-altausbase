import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, FileDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const REPORT_TYPES = [
  { id: 'financial', label: 'Finanzbericht', icon: '💰' },
  { id: 'occupancy', label: 'Belegung', icon: '🏢' },
  { id: 'performance', label: 'Leistung', icon: '📈' },
  { id: 'compliance', label: 'Compliance', icon: '✅' }
];

export default function ReportBuilder() {
  const [name, setName] = useState('');
  const [type, setType] = useState('financial');
  const [format, setFormat] = useState('PDF');
  const [scheduled, setScheduled] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [recipients, setRecipients] = useState('');
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Report?.create?.({
        name: name,
        type: type,
        format: format,
        is_scheduled: scheduled,
        schedule: scheduled ? frequency : null,
        recipients: JSON.stringify(recipients.split(',').map(e => e.trim())),
        content: `Report: ${name}`,
        generated_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('✅ Report erstellt');
      queryClient.invalidateQueries(['reports']);
      setName('');
      setRecipients('');
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {REPORT_TYPES.map(rt => (
          <button
            key={rt.id}
            onClick={() => setType(rt.id)}
            className={`p-3 rounded-lg border-2 transition ${
              type === rt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="text-lg">{rt.icon}</div>
            <p className="text-xs font-medium mt-1">{rt.label}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Report Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="Excel">Excel</SelectItem>
              <SelectItem value="CSV">CSV</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Empfänger (Email, getrennt mit Komma)"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={scheduled}
              onCheckedChange={setScheduled}
            />
            <span className="text-sm">Wiederkehrend planen</span>
          </label>

          {scheduled && (
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={!name || generateMutation.isPending}
            className="w-full gap-2"
          >
            <FileDown className="w-4 h-4" />
            Erstellen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}