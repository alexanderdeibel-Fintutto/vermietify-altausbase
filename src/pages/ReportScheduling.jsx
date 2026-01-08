import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Mail, FileText, Plus, Play, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ReportScheduling() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    report_type: 'financial',
    frequency: 'monthly',
    recipients: '',
    format: 'pdf',
    is_active: true
  });
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => base44.entities.ReportSchedule.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ReportSchedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Report-Schedule erstellt');
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReportSchedule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Report-Schedule aktualisiert');
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ReportSchedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-schedules'] });
      toast.success('Report-Schedule gelöscht');
    }
  });

  const runNowMutation = useMutation({
    mutationFn: async (scheduleId) => {
      const response = await base44.functions.invoke('generateScheduledReport', { scheduleId });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Report wird generiert und versendet');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      report_type: 'financial',
      frequency: 'monthly',
      recipients: '',
      format: 'pdf',
      is_active: true
    });
    setEditingSchedule(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const recipients = formData.recipients.split(',').map(r => r.trim()).filter(r => r);
    
    const data = {
      ...formData,
      recipients,
      created_by: 'current_user' // Will be set by backend
    };

    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      report_type: schedule.report_type,
      frequency: schedule.frequency,
      recipients: schedule.recipients?.join(', ') || '',
      format: schedule.format,
      is_active: schedule.is_active
    });
    setDialogOpen(true);
  };

  const reportTypeLabels = {
    financial: 'Finanzbericht',
    occupancy: 'Auslastungsbericht',
    contracts: 'Vertragsbericht',
    performance: 'Performance-Bericht',
    user_activity: 'Nutzeraktivität',
    custom: 'Benutzerdefiniert'
  };

  const frequencyLabels = {
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich',
    quarterly: 'Vierteljährlich'
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Automatische Reports</h1>
          <p className="text-slate-600">Scheduled Report Generation & Email-Versand</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Report-Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchedule ? 'Report-Schedule bearbeiten' : 'Neuer Report-Schedule'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Report-Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="z.B. Monatlicher Finanzbericht"
                    required
                  />
                </div>
                <div>
                  <Label>Report-Typ</Label>
                  <Select value={formData.report_type} onValueChange={(val) => setFormData({...formData, report_type: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(reportTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Häufigkeit</Label>
                  <Select value={formData.frequency} onValueChange={(val) => setFormData({...formData, frequency: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(frequencyLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Format</Label>
                  <Select value={formData.format} onValueChange={(val) => setFormData({...formData, format: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="both">Beide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Empfänger (Email-Adressen, kommagetrennt)</Label>
                <Input
                  value={formData.recipients}
                  onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                  placeholder="user1@example.com, user2@example.com"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label>Aktiv</Label>
                  <p className="text-sm text-slate-600">Report-Schedule aktivieren</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingSchedule ? 'Aktualisieren' : 'Erstellen'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { value: schedules.length, label: "Gesamt Schedules", color: "slate" },
          { value: schedules.filter(s => s.is_active).length, label: "Aktiv", color: "green" },
          { value: schedules.filter(s => s.last_run).length, label: "Ausgeführt", color: "blue" },
          { value: schedules.reduce((sum, s) => sum + (s.recipients?.length || 0), 0), label: "Empfänger", color: "purple" }
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
        <Card>
          <CardContent className="p-6">
            <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
            <div className="text-sm text-slate-600">{stat.label}</div>
          </CardContent>
        </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
      <Card>
        <CardHeader>
          <CardTitle>Report-Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schedules.map((schedule, idx) => (
              <motion.div 
                key={schedule.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="p-4 border rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-slate-900">{schedule.name}</h3>
                      <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                        {schedule.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Badge variant="outline">{reportTypeLabels[schedule.report_type]}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        {frequencyLabels[schedule.frequency]}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <FileText className="w-4 h-4" />
                        {schedule.format.toUpperCase()}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4" />
                        {schedule.recipients?.length || 0} Empfänger
                      </div>
                      {schedule.last_run && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(schedule.last_run), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runNowMutation.mutate(schedule.id)}
                      disabled={runNowMutation.isPending}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(schedule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  );
}