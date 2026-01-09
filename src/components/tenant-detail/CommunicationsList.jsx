import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SortAsc, Filter, Search } from 'lucide-react';

export default function CommunicationsList({ communications }) {
  const [sortBy, setSortBy] = useState('recent');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredComms = useMemo(() => {
    let filtered = communications.filter(c => {
      const typeMatch = typeFilter === 'all' || (c.communication_type || 'message') === typeFilter;
      const searchMatch = !searchTerm || 
        (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.message || '').toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && searchMatch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'oldest':
          return new Date(a.created_date) - new Date(b.created_date);
        default:
          return 0;
      }
    });

    return filtered;
  }, [communications, sortBy, typeFilter, searchTerm]);

  const getTypeColor = (type) => {
    const colors = {
      message: 'bg-blue-100 text-blue-800',
      email: 'bg-purple-100 text-purple-800',
      notification: 'bg-amber-100 text-amber-800',
      request: 'bg-green-100 text-green-800',
    };
    return colors[type] || colors.message;
  };

  const getTypeLabel = (type) => {
    const labels = {
      message: 'Nachricht',
      email: 'Email',
      notification: 'Benachrichtigung',
      request: 'Anfrage',
    };
    return labels[type] || 'Nachricht';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Nach Betreff oder Text suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Typ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTypeFilter('all')}>
              Alle
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('message')}>
              Nachrichten
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('email')}>
              Emails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('notification')}>
              Benachrichtigungen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('request')}>
              Anfragen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SortAsc className="w-4 h-4" />
              Sortieren
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSortBy('recent')}>
              Neueste zuerst
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('oldest')}>
              Älteste zuerst
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      {filteredComms.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 text-sm">Keine Kommunikation gefunden</p>
          </CardContent>
        </Card>
      ) : (
        filteredComms.map(comm => (
          <Card key={comm.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 flex-1">
                    {comm.subject || 'Keine Betreffzeile'}
                  </h3>
                  <Badge className={getTypeColor(comm.communication_type || 'message')}>
                    {getTypeLabel(comm.communication_type || 'message')}
                  </Badge>
                </div>
                
                {comm.message && (
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {comm.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">
                    {new Date(comm.created_date).toLocaleDateString('de-DE')} 
                    {' '}
                    {new Date(comm.created_date).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {comm.sender && (
                    <span className="text-xs text-slate-500">
                      Von: {comm.sender}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}