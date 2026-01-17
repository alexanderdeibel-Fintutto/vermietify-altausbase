import React from 'react';
import QuickActionCard from '@/components/dashboards/QuickActionCard';

export default function QuickActionCards() {
  const actions = [
    { 
      icon: require('lucide-react').Building2, 
      title: 'Neues Objekt', 
      description: 'Immobilie hinzufügen',
      href: 'Buildings',
      color: 'primary'
    },
    { 
      icon: require('lucide-react').Users, 
      title: 'Neuer Mieter', 
      description: 'Mieterdaten erfassen',
      href: 'Tenants',
      color: 'accent'
    },
    { 
      icon: require('lucide-react').FileText, 
      title: 'Neuer Vertrag', 
      description: 'Mietvertrag anlegen',
      href: 'Contracts',
      color: 'success'
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {actions.map((action) => (
        <QuickActionCard key={action.title} {...action} />
      ))}
    </div>
  );
}