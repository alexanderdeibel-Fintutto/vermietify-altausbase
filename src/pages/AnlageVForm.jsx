import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AnlageVForm from '@/components/tax-property/AnlageVForm';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

export default function AnlageVFormPage() {
  const [searchParams] = useSearchParams();
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadBuildings = async () => {
      const data = await base44.entities.Building.list();
      setBuildings(data);
      if (data.length) setSelectedBuilding(data[0].id);
    };
    loadBuildings();
  }, []);

  const handleGenerated = (data) => {
    console.log('AnlageV generated:', data);
  };

  return (
    <div className="space-y-6">
      <Link to={createPageUrl('AnlageVDashboard')}>
        <Button variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">Anlage V erstellen/bearbeiten</h1>

      {/* Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Einstellungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Gebäude</label>
              <select
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Steuerjahr</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {selectedBuilding && (
        <AnlageVForm
          buildingId={selectedBuilding}
          taxYear={selectedYear}
          onGenerated={handleGenerated}
        />
      )}
    </div>
  );
}