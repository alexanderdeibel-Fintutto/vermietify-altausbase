import React from 'react';

export default function GradientText({ children, from = 'blue', to = 'purple' }) {
  const gradients = {
    'blue-purple': 'bg-gradient-to-r from-blue-600 to-purple-600',
    'blue-cyan': 'bg-gradient-to-r from-blue-600 to-cyan-600',
    'green-emerald': 'bg-gradient-to-r from-green-600 to-emerald-600',
    'pink-rose': 'bg-gradient-to-r from-pink-600 to-rose-600'
  };

  const key = `${from}-${to}`;
  const gradientClass = gradients[key] || gradients['blue-purple'];

  return (
    <span className={`${gradientClass} bg-clip-text text-transparent font-bold`}>
      {children}
    </span>
  );
}