import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TestAssignmentManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    test_type: 'functionality',
    instructions: ''
  });

  const queryClient = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ['test-assignments'],
    queryFn: () => base44.asServiceRole.entities.TestAssignment.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const testers = users.filter(u => u.is_tester);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.asServiceRole.entities.TestAssignment.create({
        ...data,
        assigned_by: user.id,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-assignments'] });
      toast.success('Test-Auftrag erstellt!');
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to: '',
      priority: 'medium',
      test_type: 'functionality',
      instructions: ''
    });
    setDialogOpen(false);
  };

  const statusConfig = {
    assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Zugewiesen' },
    in_progress: { color: 'bg-purple-100 text-purple-800', icon: AlertCircle, label: 'In Arbeit' },
    testing_complete: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Abgeschlossen' },
    approved: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Genehmigt' }
  };

  const priorityColors = {
    urgent: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Test-Aufträge</h3>
          <p className="text-sm text-slate-600">Zuweisen und Verfolgen von Test-Aufgaben</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Auftrag erstellen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuer Test-Auftrag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titel *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Header-Navigation testen"
                />
              </div>
              <div>
                <Label>Beschreibung *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Was soll getestet werden?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tester zuweisen *</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tester wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {testers.map(tester => (
                        <SelectItem key={tester.id} value={tester.id}>
                          {tester.full_name || tester.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priorität</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Dringend</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="low">Niedrig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Test-Typ</Label>
                <Select value={formData.test_type} onValueChange={(value) => setFormData({ ...formData, test_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functionality">Funktionalität</SelectItem>
                    <SelectItem value="usability">Usability</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="regression">Regression</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Anweisungen</Label>
                <Textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Schritt-für-Schritt Anweisungen..."
                  rows={4}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.title || !formData.description || !formData.assigned_to}
                className="w-full"
              >
                Auftrag erstellen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {assignments.map(assignment => {
          const tester = users.find(u => u.id === assignment.assigned_to);
          const assignedBy = users.find(u => u.id === assignment.assigned_by);
          const status = statusConfig[assignment.status] || statusConfig.assigned;
          const StatusIcon = status.icon;

          return (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mt-1">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold">{assignment.title}</div>
                        <Badge className={priorityColors[assignment.priority]}>
                          {assignment.priority}
                        </Badge>
                        <Badge variant="outline">{assignment.test_type}</Badge>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div>Zugewiesen an: <span className="font-medium">{tester?.full_name || tester?.email}</span></div>
                        <div>Von: <span className="font-medium">{assignedBy?.full_name || assignedBy?.email}</span></div>
                        <div>Erstellt: {format(new Date(assignment.created_date), 'dd.MM.yyyy', { locale: de })}</div>
                      </div>
                      {assignment.started_at && (
                        <div className="text-sm text-green-600 mt-1">
                          Gestartet am {format(new Date(assignment.started_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      )}
                      {assignment.completed_at && (
                        <div className="text-sm text-emerald-600 mt-1">
                          Abgeschlossen am {format(new Date(assignment.completed_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}