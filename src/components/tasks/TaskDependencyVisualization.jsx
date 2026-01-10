import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Link } from 'lucide-react';

export default function TaskDependencyVisualization({ task, buildingId }) {
  const { data: allTasks = [] } = useQuery({
    queryKey: ['building-tasks-deps', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      return await base44.entities.BuildingTask.filter({ building_id: buildingId });
    },
    enabled: !!buildingId
  });

  const getDependencyChain = () => {
    const chain = [];
    let current = task;
    let visited = new Set([task.id]);

    // Walk up the dependency chain
    while (current?.depends_on?.length > 0) {
      const depTasks = allTasks.filter(t => current.depends_on.includes(t.id));
      if (depTasks.length === 0) break;

      depTasks.forEach(dep => {
        if (!visited.has(dep.id)) {
          chain.push(dep);
          visited.add(dep.id);
          current = dep;
        }
      });
      
      if (depTasks.length === 0) break;
    }

    return chain;
  };

  const getDownstreamTasks = () => {
    return allTasks.filter(t => t.blocked_by?.includes(task.id));
  };

  const dependencyChain = getDependencyChain();
  const downstreamTasks = getDownstreamTasks();

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  if (!dependencyChain.length && !downstreamTasks.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Link className="w-5 h-5" />
          Task-Abhängigkeiten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upstream Dependencies */}
        {dependencyChain.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Muss zuerst erledigt werden
            </h4>
            <div className="space-y-2">
              {dependencyChain.map((dep, idx) => (
                <div key={dep.id} className="flex items-center gap-3">
                  <div className={`px-3 py-2 rounded-lg border-2 flex-1 ${getStatusColor(dep.status)}`}>
                    <p className="font-medium text-sm">{dep.task_title}</p>
                    <p className="text-xs mt-1">{dep.status}</p>
                  </div>
                  {idx < dependencyChain.length - 1 && (
                    <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </div>
              ))}
              <div className="flex items-center gap-3">
                {dependencyChain.length > 0 && (
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                )}
                <div className={`px-3 py-2 rounded-lg border-2 flex-1 ${getStatusColor(task.status)}`}>
                  <p className="font-medium text-sm">{task.task_title}</p>
                  <p className="text-xs mt-1">{task.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Downstream Tasks */}
        {downstreamTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              Wird freigegeben, wenn diese erledigt ist
            </h4>
            <div className="space-y-2">
              <div className={`px-3 py-2 rounded-lg border-2 ${getStatusColor(task.status)}`}>
                <p className="font-medium text-sm">{task.task_title}</p>
              </div>
              {downstreamTasks.map((downstream, idx) => (
                <div key={downstream.id} className="flex items-center gap-3">
                  {idx === 0 && <ArrowRight className="w-5 h-5 text-slate-400" />}
                  <div className={`px-3 py-2 rounded-lg border-2 flex-1 ${getStatusColor(downstream.status)}`}>
                    <p className="font-medium text-sm">{downstream.task_title}</p>
                    <p className="text-xs mt-1">{downstream.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}