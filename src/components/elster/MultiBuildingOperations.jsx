import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Building, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function MultiBuildingOperations() {
  const [selectedBuildings, setSelectedBuildings] = useState([]);
  const [operation, setOperation] = useState('');
  const [formType, setFormType] = useState('ANLAGE_V');
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [processing, setProcessing] = useState(false);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const toggleBuilding = (buildingId) => {
    setSelectedBuildings(prev => 
      prev.includes(buildingId) 
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const selectAll = () => {
    setSelectedBuildings(buildings.map(b => b.id));
  };

  const handleProcess = async () => {
    if (selectedBuildings.length === 0) {
      toast.error('Keine Gebäude ausgewählt');
      return;
    }

    setProcessing(true);
    try {
      const response = await base44.functions.invoke('multiBuildingBatchProcess', {
        building_ids: selectedBuildings,
        operation,
        params: { form_type: formType, tax_year: year }
      });

      if (response.data.success) {
        const { results } = response.data;
        toast.success(`${results.success.length} erfolgreich, ${results.failed.length} fehlgeschlagen`);
      }
    } catch (error) {
      toast.error('Batch-Operation fehlgeschlagen');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Multi-Gebäude Operationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger>
              <SelectValue placeholder="Operation wählen..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generate">Formulare generieren</SelectItem>
              <SelectItem value="validate">Validieren</SelectItem>
              <SelectItem value="export">Exportieren</SelectItem>
            </SelectContent>
          </Select>

          {operation === 'generate' && (
            <>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANLAGE_V">Anlage V</SelectItem>
                  <SelectItem value="EUER">EÜR</SelectItem>
                </SelectContent>
              </Select>

              <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2023, 2022].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
          <Button variant="outline" size="sm" onClick={selectAll} className="w-full">
            Alle auswählen ({buildings.length})
          </Button>
          {buildings.map(building => (
            <div key={building.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded">
              <Checkbox
                checked={selectedBuildings.includes(building.id)}
                onCheckedChange={() => toggleBuilding(building.id)}
              />
              <span className="text-sm">{building.address || building.name}</span>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleProcess} 
          disabled={processing || !operation || selectedBuildings.length === 0}
          className="w-full"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verarbeite...
            </>
          ) : (
            `${selectedBuildings.length} Gebäude verarbeiten`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}