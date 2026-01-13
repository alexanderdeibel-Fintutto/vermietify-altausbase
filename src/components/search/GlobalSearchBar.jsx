import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Search, FileText, CheckCircle2, Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function GlobalSearchBar({ compact = false }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpenSearch = () => setIsOpen(true);
    window.addEventListener('openGlobalSearch', handleOpenSearch);
    return () => window.removeEventListener('openGlobalSearch', handleOpenSearch);
  }, []);

  const searchMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('advancedSearch', {
        query,
        filters,
        entity_types: ['Document', 'DocumentTask', 'DocumentWorkflowRule'],
        limit: 20
      })
  });

  useEffect(() => {
    if (query || Object.keys(filters).length > 0) {
      searchMutation.mutate();
    }
  }, [query, filters]);

  const results = searchMutation.data?.data?.results || {};

  const getIcon = (type) => {
    switch (type) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'rule':
        return <Settings2 className="w-4 h-4 text-purple-600" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const totalResults = (results.documents?.length || 0) + (results.tasks?.length || 0) + (results.rules?.length || 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={`relative ${compact ? 'w-full max-w-xs' : 'w-full'}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Global suchen..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={() => setIsOpen(true)}
            className={`pl-10 ${compact ? '' : ''}`}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align={compact ? 'end' : 'start'}>
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Dokumente, Aufgaben, Regeln suchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {searchMutation.isPending ? (
            <div className="p-6 text-center">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full"></div>
            </div>
          ) : totalResults === 0 && query ? (
            <div className="p-6 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Keine Ergebnisse gefunden</p>
            </div>
          ) : (
            <>
              {/* Documents */}
              {results.documents?.length > 0 && (
                <div className="p-3 border-b">
                  <p className="text-xs font-medium text-slate-600 mb-2">DOKUMENTE</p>
                  <div className="space-y-1">
                    {results.documents.map(doc => (
                      <div
                        key={doc.id}
                        className="p-2 rounded hover:bg-slate-100 cursor-pointer text-sm flex items-start gap-2"
                      >
                        {getIcon('document')}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.document_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {results.tasks?.length > 0 && (
                <div className="p-3 border-b">
                  <p className="text-xs font-medium text-slate-600 mb-2">AUFGABEN</p>
                  <div className="space-y-1">
                    {results.tasks.map(task => (
                      <div
                        key={task.id}
                        className="p-2 rounded hover:bg-slate-100 cursor-pointer text-sm flex items-start gap-2"
                      >
                        {getIcon('task')}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-medium truncate">{task.title}</p>
                          <p className="text-xs text-slate-500">{task.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules */}
              {results.rules?.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-medium text-slate-600 mb-2">REGELN</p>
                  <div className="space-y-1">
                    {results.rules.map(rule => (
                      <div
                        key={rule.id}
                        className="p-2 rounded hover:bg-slate-100 cursor-pointer text-sm flex items-start gap-2"
                      >
                        {getIcon('rule')}
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-medium truncate">{rule.name}</p>
                          <p className="text-xs text-slate-500">{rule.trigger_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}