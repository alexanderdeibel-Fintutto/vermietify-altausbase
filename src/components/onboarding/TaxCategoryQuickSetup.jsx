import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

const CATEGORY_SETS = {
  eigenheimbesitzer: [
    { name: 'Handwerker-Rechnungen', description: 'Absetzbar bei haushaltsnahen Dienstleistungen' },
    { name: 'Modernisierung/Sanierung', description: 'Herstellungskosten' },
    { name: 'Grundsteuer', description: 'Laufende Kosten' },
    { name: 'Versicherungen', description: 'Gebäudeversicherung, Haftpflicht' }
  ],
  vermieter: [
    { name: 'Handwerker-Rechnungen', description: 'Absetzbar' },
    { name: 'Betriebskosten', description: 'Umlagefähige Kosten' },
    { name: 'Instandhaltung/Reparaturen', description: 'Werbungskosten' },
    { name: 'Verwaltungskosten', description: 'Hausverwaltung, Software' },
    { name: 'Mietausfälle', description: 'Verlorene Einnahmen' },
    { name: 'Grundsteuer', description: 'Laufende Kosten' },
    { name: 'Versicherungen', description: 'Alle Gebäudeversicherungen' }
  ],
  verwalter: [
    { name: 'Betriebskosten', description: 'Alle umlagefähigen Kosten' },
    { name: 'Instandhaltung/Reparaturen', description: 'Werbungskosten' },
    { name: 'Verwaltungskosten', description: 'Hausverwaltung, Software, Personal' },
    { name: 'Marketing', description: 'Wohnungsanzeigen, Website' },
    { name: 'Grundsteuer', description: 'Laufende Kosten' },
    { name: 'Versicherungen', description: 'Alle Versicherungen' }
  ]
};

export default function TaxCategoryQuickSetup({ userType = 'vermieter', onComplete }) {
  const categories = CATEGORY_SETS[userType] || CATEGORY_SETS.vermieter;
  const [selectedCategories, setSelectedCategories] = useState(
    categories.map((_, idx) => idx) // Alle vorselektiert
  );

  const toggleCategory = (idx) => {
    setSelectedCategories(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleSubmit = async () => {
    try {
      // Erstelle ausgewählte Kategorien
      const promises = selectedCategories.map(idx => {
        const category = categories[idx];
        return base44.entities.CostCategory.create({
          name: category.name,
          description: category.description,
          is_active: true
        });
      });

      await Promise.all(promises);

      toast.success('Steuer-Kategorien erfolgreich eingerichtet! 🎉');
      onComplete({ categories: selectedCategories.length });
    } catch (error) {
      console.error('Error creating categories:', error);
      toast.error('Fehler beim Einrichten der Kategorien');
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Steuer-Kategorien einrichten</CardTitle>
        <p className="text-sm text-slate-600">
          Wählen Sie die wichtigsten Kategorien für Ihre Steuererklärung (Anlage V)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-lg border hover:border-emerald-300 transition-colors cursor-pointer"
              onClick={() => toggleCategory(idx)}
            >
              <Checkbox
                checked={selectedCategories.includes(idx)}
                onCheckedChange={() => toggleCategory(idx)}
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">{category.name}</Label>
                <p className="text-sm text-slate-600">{category.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Badge variant="outline">
            {selectedCategories.length} von {categories.length} ausgewählt
          </Badge>
          <Button
            onClick={handleSubmit}
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={selectedCategories.length === 0}
          >
            Kategorien erstellen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}