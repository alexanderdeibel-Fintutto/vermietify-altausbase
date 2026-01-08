import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Building2, FileText, Users, DollarSign, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function AdvancedSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const entityTypes = [
    { value: 'all', label: 'Alle Entities', icon: Search },
    { value: 'Building', label: 'Objekte', icon: Building2 },
    { value: 'LeaseContract', label: 'Verträge', icon: FileText },
    { value: 'Tenant', label: 'Mieter', icon: Users },
    { value: 'FinancialItem', label: 'Finanzen', icon: DollarSign },
    { value: 'Document', label: 'Dokumente', icon: FileText },
    { value: 'Task', label: 'Aufgaben', icon: Calendar }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const searchResults = {};
      
      const entitiesToSearch = entityFilter === 'all' 
        ? entityTypes.filter(e => e.value !== 'all').map(e => e.value)
        : [entityFilter];

      for (const entityType of entitiesToSearch) {
        try {
          const items = await base44.entities[entityType].list();
          const filtered = items.filter(item => 
            JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (filtered.length > 0) {
            searchResults[entityType] = filtered;
          }
        } catch (error) {
          console.error(`Error searching ${entityType}:`, error);
        }
      }

      setResults(searchResults);
    } finally {
      setSearching(false);
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return Object.values(results).reduce((sum, items) => sum + items.length, 0);
  };

  const handleItemClick = (entityType, item) => {
    switch (entityType) {
      case 'Building':
        navigate(createPageUrl('BuildingDetail') + `?id=${item.id}`);
        break;
      case 'LeaseContract':
        navigate(createPageUrl('ContractDetail') + `?id=${item.id}`);
        break;
      case 'Document':
        navigate(createPageUrl('Documents'));
        break;
      default:
        break;
    }
  };

  const renderResultItem = (entityType, item) => {
    const entityConfig = entityTypes.find(e => e.value === entityType);
    const Icon = entityConfig?.icon || FileText;

    return (
      <div 
        key={item.id}
        className="p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={() => handleItemClick(entityType, item)}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-slate-400 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-slate-900">
                {item.name || item.title || item.address || item.file_name || `Item ${item.id.slice(0, 8)}`}
              </h3>
              <Badge variant="outline" className="text-xs">
                {entityConfig?.label}
              </Badge>
            </div>
            {item.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
            )}
            <div className="flex gap-2 mt-2 text-xs text-slate-500">
              {item.created_date && (
                <span>Erstellt: {new Date(item.created_date).toLocaleDateString('de-DE')}</span>
              )}
              {item.status && (
                <Badge variant="secondary" className="text-xs">{item.status}</Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Erweiterte Suche</h1>
        <p className="text-slate-600">Durchsuchen Sie alle Daten Ihrer Immobilienverwaltung</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suchkriterien</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Suche nach Objekten, Mietern, Dokumenten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleSearch} 
              disabled={searching || !searchQuery.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Search className="w-4 h-4 mr-2" />
              Suchen
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Suchergebnisse</CardTitle>
              <Badge>{getTotalResults()} Treffer</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {getTotalResults() === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <Search className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p>Keine Ergebnisse für "{searchQuery}" gefunden</p>
              </div>
            ) : (
              <Tabs defaultValue={Object.keys(results)[0]} className="w-full">
                <TabsList className="grid grid-cols-7 w-full">
                  {Object.keys(results).map(entityType => {
                    const config = entityTypes.find(e => e.value === entityType);
                    return (
                      <TabsTrigger key={entityType} value={entityType}>
                        {config?.label} ({results[entityType].length})
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                {Object.entries(results).map(([entityType, items]) => (
                  <TabsContent key={entityType} value={entityType}>
                    <div className="space-y-3 mt-4">
                      {items.map(item => renderResultItem(entityType, item))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}