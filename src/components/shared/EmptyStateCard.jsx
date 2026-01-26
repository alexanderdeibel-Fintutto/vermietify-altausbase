import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EmptyStateCard({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <Card className="p-16 text-center">
      {Icon && <Icon className="w-20 h-20 text-gray-300 mx-auto mb-6" />}
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button size="lg" onClick={onAction} className="bg-blue-900">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}