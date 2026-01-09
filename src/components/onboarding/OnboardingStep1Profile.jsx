import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { User, Briefcase, TrendingUp, Building } from 'lucide-react';

export default function OnboardingStep1Profile({ formData, setFormData }) {
  const profileTypes = [
    {
      value: 'simple',
      title: 'Einfach',
      description: 'Angestellter/in mit einfacher Steuersituation',
      icon: User
    },
    {
      value: 'intermediate',
      title: 'Mittel',
      description: 'Freelancer oder Unternehmer mit mehreren Einkommensquellen',
      icon: Briefcase
    },
    {
      value: 'complex',
      title: 'Komplex',
      description: 'Internationale Geschäftstätigkeit, Investitionen, mehrere Länder',
      icon: TrendingUp
    },
    {
      value: 'enterprise',
      title: 'Unternehmens',
      description: 'Unternehmensstruktur mit hoher Komplexität',
      icon: Building
    }
  ];

  return (
    <div className="space-y-4">
      <p className="text-slate-600 mb-6">
        Wählen Sie die Komplexität Ihrer Steuersituation. Dies hilft uns, maßgeschneiderte Lösungen bereitzustellen.
      </p>
      <RadioGroup value={formData.profile_type} onValueChange={(value) => setFormData({ ...formData, profile_type: value })}>
        <div className="grid grid-cols-2 gap-4">
          {profileTypes.map(type => {
            const Icon = type.icon;
            return (
              <Card
                key={type.value}
                className={`p-4 cursor-pointer transition-all ${
                  formData.profile_type === type.value
                    ? 'border-2 border-blue-600 bg-blue-50'
                    : 'border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5 text-slate-600" />
                      <span className="font-semibold">{type.title}</span>
                    </div>
                    <p className="text-sm text-slate-600">{type.description}</p>
                  </Label>
                </div>
              </Card>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}