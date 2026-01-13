import React from 'react';

export default function EmptyState({ 
  icon: Icon,
  title = 'Keine Daten vorhanden',
  description = ''
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {Icon && (
        <Icon className="w-12 h-12 text-slate-300 mb-3" />
      )}
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="text-sm text-slate-600 mt-1 max-w-sm">{description}</p>
      )}
    </div>
  );
}