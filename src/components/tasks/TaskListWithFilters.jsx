import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AdvancedSearchFilters from '@/components/search/AdvancedSearchFilters';
import { Search, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function TaskListWithFilters({ companyId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', companyId],
    queryFn: async () => {
      const all = await base44.entities.DocumentTask.filter({ company_id: companyId });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const all = await base44.entities.User.list();
      return all.map(u => u.email);
    }
  });

  const statuses = ['open', 'in_progress', 'completed', 'cancelled'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!task.title?.toLowerCase().includes(query) &&
            !task.description?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Apply filters
      if (filters.from_date && new Date(task.created_date) < new Date(filters.from_date)) {
        return false;
      }
      if (filters.to_date && new Date(task.created_date) > new Date(filters.to_date)) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.assigned_to && task.assigned_to !== filters.assigned_to) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filters]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Aufgaben durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        statuses={statuses}
        users={users}
      />

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Aufgaben ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Keine Aufgaben gefunden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-slate-900">{task.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{task.status}</Badge>
                        <Badge className={`text-xs ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {task.priority}
                        </Badge>
                      </div>
                      {task.due_date && (
                        <p className="text-xs text-slate-500 mt-2">
                          Fällig: {format(new Date(task.due_date), 'dd. MMM yyyy', { locale: de })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}