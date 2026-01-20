import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Building2, Users, FileText, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { showSuccess } from '@/components/notifications/ToastNotification';

const steps = [
    { id: 1, label: 'Profil', icon: Users },
    { id: 2, label: 'Erstes Gebäude', icon: Building2 },
    { id: 3, label: 'Erste Einheit', icon: FileText },
    { id: 4, label: 'Fertig', icon: CheckCircle }
];

export default function OnboardingEnhanced() {
    const [currentStep, setCurrentStep] = useState(1);
    const [profileData, setProfileData] = useState({
        full_name: '',
        company: '',
        phone: ''
    });
    const [buildingData, setBuildingData] = useState({
        name: '',
        strasse: '',
        plz: '',
        ort: ''
    });
    const [unitData, setUnitData] = useState({
        nummer: '',
        flaeche: '',
        zimmer: ''
    });
    const navigate = useNavigate();

    const handleStep1 = async () => {
        await base44.auth.updateMe(profileData);
        setCurrentStep(2);
    };

    const handleStep2 = async () => {
        const building = await base44.entities.Building.create(buildingData);
        setBuildingData({ ...buildingData, id: building.id });
        setCurrentStep(3);
    };

    const handleStep3 = async () => {
        await base44.entities.Unit.create({
            ...unitData,
            building_id: buildingData.id
        });
        setCurrentStep(4);
    };

    const handleFinish = () => {
        showSuccess('Willkommen bei Vermitify!');
        navigate(createPageUrl('Dashboard'));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                {/* Progress */}
                <div className="vf-wizard__header mb-8">
                    <div className="flex justify-between items-center mb-8">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                                            currentStep >= step.id
                                                ? 'bg-gradient-to-br from-blue-900 to-orange-600 text-white'
                                                : 'bg-gray-200 text-gray-400'
                                        }`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-sm font-medium">{step.label}</span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-2 ${
                                            currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <Card>
                    <CardContent className="p-8">
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold mb-2">Willkommen bei Vermitify!</h2>
                                    <p className="text-gray-600">Lassen Sie uns Ihr Profil einrichten</p>
                                </div>
                                <VfInput
                                    label="Ihr Name"
                                    value={profileData.full_name}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                                    required
                                />
                                <VfInput
                                    label="Firma (optional)"
                                    value={profileData.company}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                                />
                                <VfInput
                                    label="Telefon (optional)"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                />
                                <Button onClick={handleStep1} className="vf-btn-gradient w-full" disabled={!profileData.full_name}>
                                    Weiter
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold mb-2">Ihr erstes Gebäude</h2>
                                    <p className="text-gray-600">Fügen Sie Ihre erste Immobilie hinzu</p>
                                </div>
                                <VfInput
                                    label="Gebäudename"
                                    value={buildingData.name}
                                    onChange={(e) => setBuildingData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="z.B. Musterstraße 10"
                                    required
                                />
                                <VfInput
                                    label="Straße"
                                    value={buildingData.strasse}
                                    onChange={(e) => setBuildingData(prev => ({ ...prev, strasse: e.target.value }))}
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <VfInput
                                        label="PLZ"
                                        value={buildingData.plz}
                                        onChange={(e) => setBuildingData(prev => ({ ...prev, plz: e.target.value }))}
                                        required
                                    />
                                    <VfInput
                                        label="Ort"
                                        value={buildingData.ort}
                                        onChange={(e) => setBuildingData(prev => ({ ...prev, ort: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                                        Zurück
                                    </Button>
                                    <Button onClick={handleStep2} className="vf-btn-gradient flex-1" disabled={!buildingData.name || !buildingData.strasse}>
                                        Weiter
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold mb-2">Ihre erste Wohneinheit</h2>
                                    <p className="text-gray-600">Fügen Sie eine Wohnung hinzu</p>
                                </div>
                                <VfInput
                                    label="Wohnungsnummer"
                                    value={unitData.nummer}
                                    onChange={(e) => setUnitData(prev => ({ ...prev, nummer: e.target.value }))}
                                    placeholder="z.B. Top 1"
                                    required
                                />
                                <VfInput
                                    label="Wohnfläche"
                                    type="number"
                                    value={unitData.flaeche}
                                    onChange={(e) => setUnitData(prev => ({ ...prev, flaeche: e.target.value }))}
                                    rightAddon="m²"
                                    required
                                />
                                <VfInput
                                    label="Anzahl Zimmer"
                                    type="number"
                                    value={unitData.zimmer}
                                    onChange={(e) => setUnitData(prev => ({ ...prev, zimmer: e.target.value }))}
                                />
                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                                        Zurück
                                    </Button>
                                    <Button onClick={handleStep3} className="vf-btn-gradient flex-1" disabled={!unitData.nummer || !unitData.flaeche}>
                                        Weiter
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-6" />
                                <h2 className="text-3xl font-bold mb-4">Geschafft!</h2>
                                <p className="text-xl text-gray-600 mb-8">
                                    Ihre erste Immobilie ist erfasst. Jetzt können Sie loslegen!
                                </p>
                                <Button onClick={handleFinish} className="vf-btn-gradient vf-btn-lg">
                                    Zum Dashboard
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}