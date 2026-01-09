import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function DACHComplianceChecklist() {
  const [checklist, setChecklist] = useState({
    at: {
      kest: false,
      sparerfreibetrag: false,
      anlageKap: false,
      anlageE1c: false,
      deductionsDocs: false
    },
    ch: {
      securities: false,
      realEstate: false,
      wealthTax: false,
      mortgageDeduction: false,
      withholdingTax: false
    },
    de: {
      capitalGains: false,
      interestIncome: false,
      rentalIncome: false,
      savingsPlan: false,
      taxAssessment: false
    }
  });

  const handleCheck = (country, item) => {
    setChecklist(prev => ({
      ...prev,
      [country]: {
        ...prev[country],
        [item]: !prev[country][item]
      }
    }));
  };

  const getProgress = (country) => {
    const items = Object.values(checklist[country]);
    return (items.filter(v => v).length / items.length) * 100;
  };

  const renderSection = (country, title, items) => {
    const progress = getProgress(country);
    const allChecked = progress === 100;

    return (
      <Card className={allChecked ? 'border-green-300 bg-green-50' : 'border-slate-200'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{title}</CardTitle>
            <Badge className={allChecked ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {Math.round(progress)}% ✓
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map(({ key, label, description }) => (
            <div key={key} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded">
              <Checkbox
                checked={checklist[country][key]}
                onChange={() => handleCheck(country, key)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-slate-600">{description}</p>
              </div>
              {checklist[country][key] && <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 DACH Compliance Checkliste</h1>
        <p className="text-slate-500 mt-1">Stellen Sie sicher, dass Sie alle Anforderungen erfüllen</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['at', 'ch', 'de'].map(country => {
          const progress = getProgress(country);
          const countryNames = { at: '🇦🇹 Österreich', ch: '🇨🇭 Schweiz', de: '🇩🇪 Deutschland' };
          return (
            <Card key={country}>
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">{countryNames[country]}</p>
                <p className="text-3xl font-bold mt-2">{Math.round(progress)}%</p>
                <Progress value={progress} className="mt-3" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Austria */}
      {renderSection('at', '🇦🇹 Österreich Checkliste', [
        {
          key: 'kest',
          label: 'KESt-Dokumentation vollständig',
          description: 'Alle Kapitalertragsteuern erfasst und dokumentiert'
        },
        {
          key: 'sparerfreibetrag',
          label: 'Sparerfreibetrag genutzt',
          description: '€730 Sparerfreibetrag pro Person aktiviert'
        },
        {
          key: 'anlageKap',
          label: 'Anlage KAP erstellt',
          description: 'Formulare für Kapitalvermögen vorbereitet'
        },
        {
          key: 'anlageE1c',
          label: 'Anlage E1c vorbereitet',
          description: 'Vermietung & Verpachtung dokumentiert'
        },
        {
          key: 'deductionsDocs',
          label: 'Werbungskosten belegt',
          description: 'Alle abzugsfähigen Ausgaben dokumentiert'
        }
      ])}

      {/* Switzerland */}
      {renderSection('ch', '🇨🇭 Schweiz Checkliste', [
        {
          key: 'securities',
          label: 'Wertschriftenverzeichnis',
          description: 'Alle Aktien, Fonds und Anleihen aufgelistet'
        },
        {
          key: 'realEstate',
          label: 'Liegenschaftenverzeichnis',
          description: 'Alle Immobilien mit aktuellen Werten erfasst'
        },
        {
          key: 'wealthTax',
          label: 'Vermögenssteuer berechnet',
          description: 'Vermögenssteuer für Canton korrekt errechnet'
        },
        {
          key: 'mortgageDeduction',
          label: 'Hypothekarzinsen abziehbar',
          description: 'Alle Hypothekarzinsen dokumentiert und geltend gemacht'
        },
        {
          key: 'withholdingTax',
          label: 'Verrechnungssteuer erfasst',
          description: 'Gezahlte Verrechnungssteuer dokumentiert'
        }
      ])}

      {/* Germany */}
      {renderSection('de', '🇩🇪 Deutschland Checkliste', [
        {
          key: 'capitalGains',
          label: 'Veräußerungsgewinne erfasst',
          description: 'Alle Kursgewinne und -verluste dokumentiert'
        },
        {
          key: 'interestIncome',
          label: 'Zinseinkommen dokumentiert',
          description: 'Alle Bank- und Sparbuchzinsen erfasst'
        },
        {
          key: 'rentalIncome',
          label: 'Mieteinnahmen gemeldet',
          description: 'Vermietungs- und Verpachtungseinkünfte vollständig'
        },
        {
          key: 'savingsPlan',
          label: 'Sparerpauschbetrag (801€) genutzt',
          description: 'Freibetrag für Kapitalerträge maximiert'
        },
        {
          key: 'taxAssessment',
          label: 'Steuererklärung vorbereitet',
          description: 'Alle notwendigen Unterlagen für Finanzamt bereit'
        }
      ])}

      {/* Tips Section */}
      <Card className="bg-blue-50 border-2 border-blue-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Wichtige Hinweise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 bg-white rounded border-l-4 border-blue-500">
            <p className="font-semibold text-sm">Fristen beachten</p>
            <p className="text-xs text-slate-600 mt-1">Unterschiedliche Einreichungsfristen je nach Land. Österreich und Schweiz haben oft längere Fristen als Deutschland.</p>
          </div>
          <div className="p-3 bg-white rounded border-l-4 border-green-500">
            <p className="font-semibold text-sm">Dokumentation</p>
            <p className="text-xs text-slate-600 mt-1">Bewahren Sie alle Belege mindestens 6-7 Jahre auf. Dies ist in allen DACH-Ländern Voraussetzung für die Steuerbefreiung.</p>
          </div>
          <div className="p-3 bg-white rounded border-l-4 border-yellow-500">
            <p className="font-semibold text-sm">Steuerberater konsultieren</p>
            <p className="text-xs text-slate-600 mt-1">Besonders bei grenzüberschreitenden Vermögensstrukturen empfohlen. Sparen Sie Zeit und Fehler durch professionelle Beratung.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}