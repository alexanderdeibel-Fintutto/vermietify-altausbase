import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Building2, Users, TrendingUp, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAIN_CATEGORIES = [
  {
    id: 'private',
    label: 'Privat',
    icon: Home,
    description: 'Persönliche Vermögensverwaltung & Planung'
  },
  {
    id: 'real_estate',
    label: 'Immobilien',
    icon: Building2,
    description: 'Immobilienportfolio & Verwaltung'
  },
  {
    id: 'tenants',
    label: 'Mieter',
    icon: Users,
    description: 'Mieterverwaltung & Kommunikation'
  },
  {
    id: 'wealth',
    label: 'Mein Vermögen',
    icon: TrendingUp,
    description: 'Vermögensanalyse & Optimierung'
  },
  {
    id: 'business',
    label: 'Meine Firma',
    icon: Briefcase,
    description: 'Geschäftsverwaltung & Finanzen'
  }
];

export default function MainCategoryTabs({ activeCategory, onCategoryChange }) {
  return (
    <div className="bg-white border-b border-slate-200">
      <Tabs 
        value={activeCategory} 
        onValueChange={onCategoryChange}
        className="w-full"
      >
        <TabsList className="w-full h-auto bg-transparent border-b-0 rounded-none p-0 flex justify-start gap-0">
          {MAIN_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-none border-b-2 border-transparent',
                  'hover:bg-slate-50 transition-colors',
                  'data-[state=active]:border-slate-900 data-[state=active]:bg-slate-50'
                )}
                title={category.description}
              >
                <Icon className="w-4 h-4" />
                <span className="font-light text-sm">{category.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
}