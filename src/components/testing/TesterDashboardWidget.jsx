import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TesterDashboardWidget() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['myAssignments'],
    queryFn: async () => {
      const all = await base44.entities.TestAssignment.filter({ assigned_to: user?.id });
      return all.slice(0, 3);
    },
    enabled: !!user
  });

  const { data: problems = [] } = useQuery({
    queryKey: ['myProblems'],
    queryFn: async () => {
      const all = await base44.entities.UserProblem.filter({ tester_id: user?.id });
      return all.slice(0, 5);
    },
    enabled: !!user
  });

  if (!user) return null;

  const activeAssignments = assignments.filter(a => a.status === 'in_progress' || a.status === 'assigned');
  const totalProblemsReported = problems.length;

  return (
    <Card className="border border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-purple-600" />
          Tester Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-900">{activeAssignments.length}</p>
            <p className="text-xs text-slate-600">Aktive Tests</p>
          </div>
          <div className="text-center">
            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-900">{totalProblemsReported}</p>
            <p className="text-xs text-slate-600">Bugs gemeldet</p>
          </div>
          <div className="text-center">
            <TestTube className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <p className="text-xl font-bold text-slate-900">{assignments.length}</p>
            <p className="text-xs text-slate-600">Total Tests</p>
          </div>
        </div>

        {activeAssignments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">Aktuelle Aufgaben:</h4>
            <div className="space-y-2">
              {activeAssignments.map(a => (
                <div key={a.id} className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">{a.title}</span>
                    <Badge className="bg-purple-600 text-xs">{a.priority}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to={createPageUrl('TestingDashboard')}>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Zum Test-Dashboard
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}