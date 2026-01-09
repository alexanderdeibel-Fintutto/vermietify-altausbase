import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Globe, CheckCircle2, ChevronRight } from 'lucide-react';

const COUNTRIES = {
  DE: { name: 'Deutschland', flag: '🇩🇪', description: 'Einkommensteuer, Abgeltungssteuer' },
  AT: { name: 'Österreich', flag: '🇦🇹', description: 'Einkommensteuer, KESt' },
  CH: { name: 'Schweiz', flag: '🇨🇭', description: 'Eidgenössisch, Kantonal, Kommunal', requiresCanton: true }
};

const SWISS_CANTONS = {
  ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', AG: 'Aargau', SG: 'Sankt Gallen',
  BS: 'Basel-Stadt', BL: 'Basel-Landschaft', VD: 'Waadt', GE: 'Genf', VS: 'Wallis',
  NE: 'Neuenburg', JU: 'Jura', SO: 'Solothurn', SH: 'Schaffhausen', TG: 'Thurgau',
  TI: 'Tessin', GR: 'Graubünden', AR: 'Appenzell Ausserrhoden', AI: 'Appenzell Innerrhoden',
  GL: 'Glarus', OW: 'Obwalden', NW: 'Nidwalden', UR: 'Uri', ZG: 'Zug'
};

export default function CountrySetup({ onComplete }) {
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [primaryCountry, setPrimaryCountry] = useState('');
  const [selectedCanton, setSelectedCanton] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCountryToggle = (country) => {
    setSelectedCountries(prev => 
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
    
    if (!primaryCountry && selectedCountries.length === 0) {
      setPrimaryCountry(country);
    }
  };

  const handleSave = async () => {
    if (selectedCountries.length === 0) {
      toast.error('Bitte wählen Sie mindestens ein Land');
      return;
    }

    if (!primaryCountry) {
      toast.error('Bitte wählen Sie ein Hauptland');
      return;
    }

    if (selectedCountries.includes('CH') && !selectedCanton) {
      toast.error('Bitte wählen Sie einen Schweizer Kanton');
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        preferred_countries: selectedCountries,
        primary_country: primaryCountry,
        tax_setup_completed: true
      };

      if (selectedCountries.includes('CH')) {
        updateData.swiss_canton = selectedCanton;
      }

      await base44.auth.updateMe(updateData);
      toast.success('Steuerkonfiguration gespeichert');
      onComplete && onComplete();
    } catch (error) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Globe className="w-6 h-6" /> Steuererklärung Konfiguration
        </h2>
        <p className="text-slate-600">Wählen Sie die Länder, für die Sie Steuererklärungen verwalten möchten.</p>
      </div>

      {/* Country Selection */}
      <div className="space-y-3">
        <h3 className="font-bold">Länder auswählen</h3>
        <div className="grid gap-4">
          {Object.entries(COUNTRIES).map(([code, country]) => (
            <Card 
              key={code}
              className={`cursor-pointer transition-all ${selectedCountries.includes(code) ? 'border-blue-500 bg-blue-50' : ''}`}
              onClick={() => handleCountryToggle(code)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox checked={selectedCountries.includes(code)} />
                    <div>
                      <p className="font-bold">{country.flag} {country.name}</p>
                      <p className="text-sm text-slate-600">{country.description}</p>
                    </div>
                  </div>
                  {selectedCountries.includes(code) && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>

                {/* Canton Selector for Switzerland */}
                {code === 'CH' && selectedCountries.includes('CH') && (
                  <div className="mt-4 pt-4 border-t">
                    <label className="text-sm font-semibold mb-2 block">Kanton auswählen</label>
                    <Select value={selectedCanton} onValueChange={setSelectedCanton}>
                      <SelectTrigger>
                        <SelectValue placeholder="Wählen Sie Ihren Kanton..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(SWISS_CANTONS).map(([code, name]) => (
                          <SelectItem key={code} value={code}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Primary Country Selection */}
      {selectedCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hauptland auswählen</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={primaryCountry} onValueChange={setPrimaryCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie Hauptland..." />
              </SelectTrigger>
              <SelectContent>
                {selectedCountries.map(country => (
                  <SelectItem key={country} value={country}>
                    {COUNTRIES[country].flag} {COUNTRIES[country].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-600 mt-2">Das Hauptland wird auf Ihrem Dashboard zuerst angezeigt.</p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedCountries.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <p className="font-semibold mb-2">✅ Ihre Auswahl:</p>
            <div className="flex flex-wrap gap-2">
              {selectedCountries.map(country => (
                <Badge key={country} className="bg-green-200 text-green-800">
                  {COUNTRIES[country].flag} {COUNTRIES[country].name}
                </Badge>
              ))}
            </div>
            {primaryCountry && (
              <p className="text-sm text-slate-600 mt-3">
                Hauptland: <span className="font-bold">{COUNTRIES[primaryCountry].flag} {COUNTRIES[primaryCountry].name}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!primaryCountry || isLoading}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Konfiguration speichern
        </Button>
      </div>
    </div>
  );
}