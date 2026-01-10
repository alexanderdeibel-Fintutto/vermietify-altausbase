import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, X, Building2, Users, FileText, File } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function GlobalSearchBar({ compact = false }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState(null);

  const searchMutation = useMutation({
    mutationFn: async (searchQuery) => {
      const response = await base44.functions.invoke('globalSearch', { query: searchQuery });
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data);
      if (!compact) setIsOpen(true);
    }
  });

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        searchMutation.mutate(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults(null);
    }
  }, [query]);

  const entityIcons = {
    Building: Building2,
    Tenant: Users,
    LeaseContract: FileText,
    Document: File
  };

  const entityLabels = {
    Building: 'Gebäude',
    Tenant: 'Mieter',
    LeaseContract: 'Verträge',
    Document: 'Dokumente'
  };

  const entityPages = {
    Building: 'Buildings',
    Tenant: 'Tenants',
    LeaseContract: 'Contracts',
    Document: 'Documents'
  };

  return (
    <>
      <div className="relative w-full max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Suche über alle Bereiche..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => {
                setQuery('');
                setResults(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Inline Results for Compact Mode */}
        {compact && results && query && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto z-50">
            {Object.entries(results).map(([entityType, items]) => {
              if (items.length === 0) return null;
              const Icon = entityIcons[entityType];
              return (
                <div key={entityType} className="p-3 border-b last:border-b-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <p className="font-semibold text-sm">{entityLabels[entityType]}</p>
                    <Badge variant="outline">{items.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((item, idx) => (
                      <Link
                        key={idx}
                        to={`${createPageUrl(entityPages[entityType])}?id=${item.id}`}
                        className="block p-2 hover:bg-slate-50 rounded text-sm"
                        onClick={() => {
                          setQuery('');
                          setResults(null);
                        }}
                      >
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-slate-600">{item.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
            {Object.values(results).every(items => items.length === 0) && (
              <p className="p-4 text-sm text-slate-600 text-center">Keine Ergebnisse gefunden</p>
            )}
          </div>
        )}
      </div>

      {/* Dialog Results for Full Mode */}
      <Dialog open={!compact && isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suchergebnisse für "{query}"</DialogTitle>
          </DialogHeader>

          {results && (
            <div className="space-y-4">
              {Object.entries(results).map(([entityType, items]) => {
                if (items.length === 0) return null;
                const Icon = entityIcons[entityType];
                return (
                  <div key={entityType}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-5 h-5 text-slate-600" />
                      <h3 className="font-semibold">{entityLabels[entityType]}</h3>
                      <Badge>{items.length}</Badge>
                    </div>
                    <div className="grid gap-2">
                      {items.map((item, idx) => (
                        <Link
                          key={idx}
                          to={`${createPageUrl(entityPages[entityType])}?id=${item.id}`}
                          className="p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          <p className="font-semibold">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                          )}
                          {item.metadata && (
                            <div className="flex gap-2 mt-2">
                              {Object.entries(item.metadata).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.values(results).every(items => items.length === 0) && (
                <p className="text-center text-slate-600 py-8">Keine Ergebnisse gefunden</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}