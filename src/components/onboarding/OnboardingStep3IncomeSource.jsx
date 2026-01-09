import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Briefcase, Coins, Home, TrendingUp, Code, ShoppingCart } from 'lucide-react';

export default function OnboardingStep3IncomeSource({ formData, setFormData }) {
  const incomeSources = [
    { type: 'employment', name: 'Angestellteneinkommen', icon: Briefcase },
    { type: 'self_employed', name: 'Selbstständigkeit', icon: Code },
    { type: 'business', name: 'Geschäftstätigkeit', icon: ShoppingCart },
    { type: 'rental', name: 'Mieteinnahmen', icon: Home },
    { type: 'capital_gains', name: 'Kapitalerträge', icon: TrendingUp },
    { type: 'crypto', name: 'Kryptowährungen', icon: Coins }
  ];

  const toggleSource = (type) => {
    const sources = formData.income_sources || [];
    const updated = sources.some(s => s.type === type)
      ? sources.filter(s => s.type !== type)
      : [...sources, { type, description: '' }];
    setFormData({ ...formData, income_sources: updated });
  };

  return (
    <div className="space-y-4">
      <p className="text-slate-600 mb-6">
        Wählen Sie alle Einkommensquellen, die auf Sie zutreffen.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {incomeSources.map(source => {
          const Icon = source.icon;
          const isSelected = (formData.income_sources || []).some(s => s.type === source.type);
          return (
            <Card
              key={source.type}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-blue-600 bg-blue-50'
                  : 'border border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => toggleSource(source.type)}
            >
              <div className="flex items-start gap-3">
                <Checkbox checked={isSelected} onCheckedChange={() => toggleSource(source.type)} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-slate-600" />
                    <Label className="cursor-pointer font-medium">{source.name}</Label>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}