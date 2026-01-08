import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Clock, CheckCircle2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function TestAssignmentManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'medium',
    test_type: 'functionality',
    business_criticality: 'standard',
    target_areas: [],
    instructions: '',
    expected_duration: 30
  });

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.asServiceRole.entities.User.list()
  });

  const testers = users.filter(u => u.is_tester);

  const { data: assignments = [] } = useQuery({
    queryKey: ['test-assignments'],
    queryFn: () => base44.entities.TestAssignment.list('-created_date')
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => base44.entities.TestAssignment.create({
      ...data,
      assigned_by: user.id,
      status: 'assigned'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-assignments'] });
      toast.success('Test-Auftrag erstellt! 📋');
      setShowDialog(false);
      setFormData({
        title: '',
        description: '',
        assigned_to: '',
        priority: 'medium',
        test_type: 'functionality',
        business_criticality: 'standard',
        target_areas: [],
        instructions: '',
        expected_duration: 30
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.asServiceRole.entities.TestAssignment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-assignments'] });
      toast.success('Status aktualisiert!');
    }
  });

  const getStatusBadge = (status) => {
    const config = {
      assigned: { label: 'Zugewiesen', color: 'bg-blue-500', icon: ClipboardList },
      in_progress: { label: 'In Progress', color: 'bg-yellow-500', icon: Play },
      testing_complete: { label: 'Testing Complete', color: 'bg-purple-500', icon: CheckCircle2 },
      approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 },
      rejected: { label: 'Rejected', color: 'bg-red-500', icon: Clock }
    };
    const statusConfig = config[status] || config.assigned;
    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color}>
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Test-Aufträge</h2>
          <p className="text-sm text-slate-600">Verwalte und erstelle Test-Assignments</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <ClipboardList className="w-4 h-4" />
          Neuer Auftrag
        </Button>
      </div>

      <div className="grid gap-4">
        {assignments.map((assignment, idx) => {
          const tester = testers.find(t => t.id === assignment.assigned_to);
          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-2 ${getPriorityColor(assignment.priority)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Tester:</span>
                      <div className="font-medium">{tester?.full_name || 'Nicht zugewiesen'}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Priorität:</span>
                      <Badge className={
                        assignment.priority === 'urgent' ? 'bg-red-600' :
                        assignment.priority === 'high' ? 'bg-orange-600' :
                        assignment.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
                      }>
                        {assignment.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-600">Test-Typ:</span>
                      <div className="font-medium">{assignment.test_type}</div>
                    </div>
                    <div>
                      <span className="text-slate-600">Dauer:</span>
                      <div className="font-medium">{assignment.expected_duration}min</div>
                    </div>
                  </div>

                  {assignment.target_areas?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {assignment.target_areas.map(area => (
                        <Badge key={area} variant="outline">{area}</Badge>
                      ))}
                    </div>
                  )}

                  {assignment.instructions && (
                    <div className="mt-4 p-3 bg-white rounded-lg border">
                      <div className="text-xs text-slate-600 mb-1">Anweisungen:</div>
                      <p className="text-sm">{assignment.instructions}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    {assignment.status === 'assigned' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: assignment.id, status: 'in_progress' })}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Starten
                      </Button>
                    )}
                    {assignment.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: assignment.id, status: 'testing_complete' })}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Abschließen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Test-Auftrag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Header-Navigation testen"
              />
            </div>

            <div>
              <Label>Beschreibung *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detaillierte Beschreibung des Test-Auftrags..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tester zuweisen *</Label>
                <Select 
                  value={formData.assigned_to} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, assigned_to: val }))}
                >
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
                <Select 
                  value={formData.priority} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                    <SelectItem value="high">🟠 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Test-Typ</Label>
                <Select 
                  value={formData.test_type} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, test_type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functionality">🔧 Functionality</SelectItem>
                    <SelectItem value="usability">🎨 Usability</SelectItem>
                    <SelectItem value="performance">⚡ Performance</SelectItem>
                    <SelectItem value="regression">🔄 Regression</SelectItem>
                    <SelectItem value="onboarding">🚀 Onboarding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Business-Kritikalität</Label>
                <Select 
                  value={formData.business_criticality} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, business_criticality: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">🔴 Critical</SelectItem>
                    <SelectItem value="important">🟠 Important</SelectItem>
                    <SelectItem value="standard">🟡 Standard</SelectItem>
                    <SelectItem value="nice_to_have">🔵 Nice-to-Have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Erwartete Dauer (Minuten)</Label>
              <Input
                type="number"
                value={formData.expected_duration}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_duration: parseInt(e.target.value) || 30 }))}
              />
            </div>

            <div>
              <Label>Anweisungen (optional)</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Schritt-für-Schritt Anweisungen für den Tester..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={() => createAssignmentMutation.mutate(formData)}
                disabled={!formData.title || !formData.description || !formData.assigned_to || createAssignmentMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Auftrag erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}