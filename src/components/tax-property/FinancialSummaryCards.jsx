import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';

export default function FinancialSummaryCards() {
  const { data: financialItems = [] } = useQuery({
    queryKey: ['financialItems'],
    queryFn: () => base44.entities.FinancialItem.list('-date', 500)
  });

  const thisYear = new Date().getFullYear();
  const itemsThisYear = financialItems.filter(item => 
    new Date(item.date).getFullYear() === thisYear
  );

  const income = itemsThisYear
    .filter(i => i.type === 'income')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const expenses = itemsThisYear
    .filter(i => i.type === 'expense')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const taxRelevant = itemsThisYear.filter(i => i.is_tax_relevant).length;

  const cards = [
    {
      title: 'Einnahmen',
      value: income,
      icon: TrendingUp,
      color: 'green',
      suffix: '€'
    },
    {
      title: 'Ausgaben',
      value: expenses,
      icon: TrendingDown,
      color: 'red',
      suffix: '€'
    },
    {
      title: 'Netto',
      value: income - expenses,
      icon: Wallet,
      color: 'blue',
      suffix: '€'
    },
    {
      title: 'Steuerrelevant',
      value: taxRelevant,
      icon: Receipt,
      color: 'purple',
      suffix: ''
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon className={`w-4 h-4 text-${card.color}-600`} />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold text-${card.color}-600`}>
                {card.value.toLocaleString('de-DE')} {card.suffix}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}