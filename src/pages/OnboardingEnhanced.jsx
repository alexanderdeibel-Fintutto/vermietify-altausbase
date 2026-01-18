import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { base44 } from '@/api/base44Client';
import { Home, Building, Users, TrendingUp, ArrowRight, CheckCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function OnboardingEnhanced() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState('');
  const [buildingData, setBuildingData] = useState({
    adresse: '',
    plz: '',
    ort: '',
    baujahr: '',
    anzahl_einheiten: ''
  });

  const userTypes = [
    { id: 'private', label: 'Privater Vermieter', description: '1-5 Objekte, Selbstverwaltung', icon: Home },
    { id: 'professional', label: 'Professioneller Vermieter', description: '6+ Objekte, strukturiert', icon: Building },
    { id: 'manager', label: 'Hausverwaltung', description: 'Verwaltung für Dritte', icon: Users },
    { id: 'investor', label: 'Investor', description: 'Fokus auf Rendite & Analyse', icon: TrendingUp }
  ];

  return (
    <div className="vf-onboarding">
      <div className="vf-onboarding__card">
        {step === 0 && (
          <>
            <div className="vf-onboarding__logo mb-8">🏠</div>
            <h1 className="vf-onboarding__title">Willkommen bei Vermitify!</h1>
            <p className="vf-onboarding__description">
              Ihre Immobilien verwalten sich von selbst. Die Steuern auch.
              <br /><br />
              In nur 5 Minuten richten wir gemeinsam Ihr erstes Objekt ein.
            </p>
            <Button variant="gradient" size="lg" onClick={() => setStep(1)} className="vf-onboarding__cta">
              Los geht's
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <div className="vf-onboarding__progress">
              <div className="vf-onboarding__progress-dot vf-onboarding__progress-dot--active" />
              <div className="vf-onboarding__progress-line" />
              <div className="vf-onboarding__progress-dot" />
              <div className="vf-onboarding__progress-line" />
              <div className="vf-onboarding__progress-dot" />
              <div className="vf-onboarding__progress-line" />
              <div className="vf-onboarding__progress-dot" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="vf-onboarding__title">Wer sind Sie?</h1>
            <p className="vf-onboarding__description mb-8">
              Damit wir Vermitify optimal für Sie konfigurieren können
            </p>
            <div className="vf-onboarding__options">
              {userTypes.map((type) => (
                <div 
                  key={type.id} 
                  className={`vf-onboarding__option ${selectedType === type.id ? 'vf-onboarding__option--selected' : ''}`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div className="vf-onboarding__option-icon">
                    <type.icon className="h-5 w-5" />
                  </div>
                  <div className="vf-onboarding__option-title">{type.label}</div>
                  <div className="vf-onboarding__option-desc">{type.description}</div>
                </div>
              ))}
            </div>
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={() => setStep(2)} 
              className="mt-8 w-full"
              disabled={!selectedType}
            >
              Weiter
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <div className="vf-onboarding__logo mb-6">
              <MapPin className="h-16 w-16 text-[var(--theme-primary)]" />
            </div>
            <h1 className="vf-onboarding__title">Ihr erstes Objekt</h1>
            <p className="vf-onboarding__description mb-6">
              Geben Sie die Adresse Ihres ersten Objekts ein
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto">
              <VfInput
                label="Straße & Hausnummer"
                value={buildingData.adresse}
                onChange={(e) => setBuildingData({ ...buildingData, adresse: e.target.value })}
                placeholder="Musterstraße 123"
              />
              <div className="grid grid-cols-2 gap-4">
                <VfInput
                  label="PLZ"
                  value={buildingData.plz}
                  onChange={(e) => setBuildingData({ ...buildingData, plz: e.target.value })}
                  placeholder="12345"
                />
                <VfInput
                  label="Ort"
                  value={buildingData.ort}
                  onChange={(e) => setBuildingData({ ...buildingData, ort: e.target.value })}
                  placeholder="Berlin"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <VfInput
                  label="Baujahr"
                  type="number"
                  value={buildingData.baujahr}
                  onChange={(e) => setBuildingData({ ...buildingData, baujahr: e.target.value })}
                  placeholder="1990"
                />
                <VfInput
                  label="Anzahl Einheiten"
                  type="number"
                  value={buildingData.anzahl_einheiten}
                  onChange={(e) => setBuildingData({ ...buildingData, anzahl_einheiten: e.target.value })}
                  placeholder="6"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(1)}>Zurück</Button>
              <Button 
                variant="gradient" 
                onClick={() => setStep(3)}
                disabled={!buildingData.adresse || !buildingData.ort}
              >
                Weiter
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="vf-onboarding__logo mb-6">
              <CheckCircle className="h-16 w-16 text-[var(--vf-success-500)]" />
            </div>
            <h1 className="vf-onboarding__title">Geschafft!</h1>
            <p className="vf-onboarding__description mb-6">
              Ihr Objekt wurde erfolgreich angelegt.<br />
              Jetzt können Sie Einheiten und Mieter hinzufügen.
            </p>
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={async () => {
                try {
                  await base44.entities.Building.create(buildingData);
                  toast.success('Objekt erfolgreich erstellt!');
                  navigate('/buildings');
                } catch (error) {
                  toast.error('Fehler beim Erstellen');
                }
              }}
            >
              Zum Dashboard
            </Button>
          </>
        )}
      </div>
    </div>
  );
}