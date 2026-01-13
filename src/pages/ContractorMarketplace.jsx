import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Mail } from 'lucide-react';

export default function ContractorMarketplace() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-rating', 100)
  });

  const filtered = contractors.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && c.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Handwerker-Marktplatz</h1>
        <p className="text-slate-600 mt-1">Finden Sie verifizierte Fachleute für Ihre Immobilien</p>
      </div>

      <div className="flex gap-3">
        <Input 
          placeholder="Nach Name suchen..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Alle Kategorien</option>
          <option value="plumbing">Klempner</option>
          <option value="electrical">Elektriker</option>
          <option value="hvac">Heizung/Klima</option>
          <option value="roofing">Dachdeckerei</option>
          <option value="cleaning">Reinigung</option>
          <option value="painting">Malerei</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(contractor => (
          <Card key={contractor.id} className="hover:shadow-lg transition">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{contractor.name}</h3>
                  <p className="text-xs text-slate-500">{contractor.category}</p>
                </div>
                {contractor.verified && (
                  <Badge className="bg-green-100 text-green-800">✓ Verifiziert</Badge>
                )}
              </div>

              <div className="flex items-center gap-1 mb-3">
                <Star className="w-4 h-4 fill-yellow-400" />
                <span className="font-medium">{contractor.rating || 0}</span>
                <span className="text-xs text-slate-500">({contractor.review_count} Bewertungen)</span>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  {contractor.region}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  {contractor.email}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4" />
                  {contractor.phone}
                </div>
              </div>

              <div className="text-lg font-bold text-blue-600 mb-3">
                €{contractor.hourly_rate}/h
              </div>

              <Button className="w-full">Kontaktieren</Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Keine Handwerker gefunden
        </div>
      )}
    </div>
  );
}