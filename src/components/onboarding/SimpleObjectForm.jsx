import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';

export default function SimpleObjectForm({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    street_address: '',
    zip_code: '',
    city: '',
    construction_year: '',
    object_type: 'vermietet'
  });

  const handleZipCodeChange = (value) => {
    setFormData({ ...formData, zip_code: value });
    
    // TODO: PLZ-Autocomplete Integration
    if (value.length === 5) {
      // Simulate city autocomplete
      setTimeout(() => {
        const cityMap = {
          '10115': 'Berlin',
          '80331': 'München',
          '20095': 'Hamburg',
          '50667': 'Köln'
        };
        if (cityMap[value]) {
          setFormData(prev => ({ ...prev, city: cityMap[value] }));
        }
      }, 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const building = await base44.entities.Building.create({
        name: formData.name,
        address: `${formData.street_address}, ${formData.zip_code} ${formData.city}`,
        construction_year: parseInt(formData.construction_year) || undefined,
        building_type: formData.object_type
      });

      toast.success('Objekt erfolgreich angelegt! 🎉');
      onComplete(building);
    } catch (error) {
      console.error('Error creating building:', error);
      toast.error('Fehler beim Anlegen des Objekts');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Ihr erstes Objekt anlegen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Objektname *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Mehrfamilienhaus Hauptstraße"
              required
            />
          </div>

          <div>
            <Label htmlFor="street">Straße und Hausnummer *</Label>
            <Input
              id="street"
              value={formData.street_address}
              onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
              placeholder="z.B. Hauptstraße 123"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="zip">PLZ *</Label>
              <Input
                id="zip"
                value={formData.zip_code}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                placeholder="z.B. 10115"
                maxLength={5}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">Stadt *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="z.B. Berlin"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Baujahr</Label>
              <Input
                id="year"
                type="number"
                value={formData.construction_year}
                onChange={(e) => setFormData({ ...formData, construction_year: e.target.value })}
                placeholder="z.B. 2010"
                min="1800"
                max="2024"
              />
            </div>
            <div>
              <Label htmlFor="type">Objekttyp *</Label>
              <Select value={formData.object_type} onValueChange={(val) => setFormData({ ...formData, object_type: val })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eigengenutzt">Eigengenutzt</SelectItem>
                  <SelectItem value="vermietet">Vermietet</SelectItem>
                  <SelectItem value="teilvermietet">Teilvermietet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
            Objekt anlegen
          </Button>
        </form>
      </CardContent>
    </Card>
    </motion.div>
  );
}