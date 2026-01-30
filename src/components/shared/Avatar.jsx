import React from 'react';
import { User } from 'lucide-react';

export default function Avatar({ src, name, size = 'md', fallback }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const initials = fallback || (name?.split(' ').map(n => n[0]).join('').toUpperCase() || '');

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        initials || <User className="w-1/2 h-1/2" />
      )}
    </div>
  );
}