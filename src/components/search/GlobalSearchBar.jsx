import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, User, FileText, Wrench, CreditCard, Home, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const entityIcons = {
  Building: Building2,
  Unit: Home,
  Tenant: User,
  LeaseContract: FileText,
  Payment: CreditCard,
  MaintenanceTask: Wrench,
  Document: FileText,
  BuildingTask: Wrench
};

const entityLabels = {
  Building: 'Gebäude',
  Unit: 'Einheit',
  Tenant: 'Mieter',
  LeaseContract: 'Vertrag',
  Payment: 'Zahlung',
  MaintenanceTask: 'Wartung',
  Document: 'Dokument',
  BuildingTask: 'Aufgabe'
};

const entityColors = {
  Building: 'bg-blue-100 text-blue-800',
  Unit: 'bg-purple-100 text-purple-800',
  Tenant: 'bg-green-100 text-green-800',
  LeaseContract: 'bg-orange-100 text-orange-800',
  Payment: 'bg-yellow-100 text-yellow-800',
  MaintenanceTask: 'bg-red-100 text-red-800',
  Document: 'bg-slate-100 text-slate-800',
  BuildingTask: 'bg-indigo-100 text-indigo-800'
};

export default function GlobalSearchBar({ compact = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchEntities = async () => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await base44.functions.invoke('globalSearchEntities', { query, limit: 20 });
        setResults(response.data.results || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchEntities, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (result) => {
    setIsOpen(false);
    setQuery('');
    
    // Navigate based on entity type
    if (result.type === 'Building') {
      navigate(createPageUrl('BuildingDetail') + `?id=${result.id}`);
    } else if (result.type === 'Tenant') {
      navigate(createPageUrl('TenantDetail') + `?id=${result.id}`);
    } else if (result.type === 'LeaseContract') {
      navigate(createPageUrl('ContractDetail') + `?id=${result.id}`);
    } else if (result.type === 'Unit') {
      navigate(createPageUrl('UnitDetail') + `?id=${result.id}`);
    } else {
      // For other types, navigate to their list pages
      const pageMap = {
        Payment: 'Payments',
        MaintenanceTask: 'MaintenanceTasks',
        Document: 'Documents',
        BuildingTask: 'SmartTaskDashboard'
      };
      const page = pageMap[result.type];
      if (page) navigate(createPageUrl(page));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Suche nach Gebäuden, Mietern, Verträgen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`pl-10 ${compact ? '' : 'w-full'}`}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-lg">
          <div className="p-2">
            <div className="text-xs text-slate-600 px-2 py-1 mb-1">
              {results.length} Ergebnis{results.length !== 1 ? 'se' : ''} gefunden
            </div>
            {results.map((result, index) => {
              const Icon = entityIcons[result.type] || FileText;
              return (
                <div
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{result.title}</span>
                      <Badge className={`${entityColors[result.type]} text-xs`} variant="outline">
                        {entityLabels[result.type]}
                      </Badge>
                    </div>
                    {result.subtitle && (
                      <p className="text-xs text-slate-600 truncate">{result.subtitle}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isSearching && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <div className="p-4 text-center text-sm text-slate-600">
            Keine Ergebnisse für "{query}"
          </div>
        </Card>
      )}
    </div>
  );
}