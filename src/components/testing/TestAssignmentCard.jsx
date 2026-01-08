import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Clock, CheckCircle2, Play, User } from 'lucide-react';

export default function TestAssignmentCard({ assignment, tester, onStatusChange, onView }) {
  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-blue-500 bg-blue-50'
    };
    return colors[priority] || colors.medium;
  };

  const getStatusBadge = (status) => {
    const config = {
      assigned: { label: 'Zugewiesen', color: 'bg-blue-500', icon: ClipboardList },
      in_progress: { label: 'In Progress', color: 'bg-yellow-500', icon: Play },
      testing_complete: { label: 'Testing Complete', color: 'bg-purple-500', icon: CheckCircle2 },
      approved: { label: 'Approved', color: 'bg-green-500', icon: CheckCircle2 }
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

  return (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
          <div>
            <span className="text-slate-600">Tester:</span>
            <div className="font-medium flex items-center gap-1 mt-1">
              <User className="w-3 h-3" />
              {tester?.full_name || 'Nicht zugewiesen'}
            </div>
          </div>
          <div>
            <span className="text-slate-600">Priorität:</span>
            <Badge className={`mt-1 ${
              assignment.priority === 'urgent' ? 'bg-red-600' :
              assignment.priority === 'high' ? 'bg-orange-600' :
              assignment.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
            }`}>
              {assignment.priority}
            </Badge>
          </div>
          <div>
            <span className="text-slate-600">Test-Typ:</span>
            <div className="font-medium mt-1">{assignment.test_type}</div>
          </div>
          <div>
            <span className="text-slate-600">Dauer:</span>
            <div className="font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {assignment.expected_duration}min
            </div>
          </div>
        </div>

        {assignment.target_areas?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {assignment.target_areas.map(area => (
              <Badge key={area} variant="outline">{area}</Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {assignment.status === 'assigned' && onStatusChange && (
            <Button
              size="sm"
              onClick={() => onStatusChange(assignment.id, 'in_progress')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Play className="w-4 h-4 mr-2" />
              Starten
            </Button>
          )}
          {assignment.status === 'in_progress' && onStatusChange && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStatusChange(assignment.id, 'testing_complete')}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Abschließen
            </Button>
          )}
          {onView && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onView(assignment)}
            >
              Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}