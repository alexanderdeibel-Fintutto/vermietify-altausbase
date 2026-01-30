import React from 'react';

export default function Separator({ vertical = false, spacing = 'my-4' }) {
  return vertical ? (
    <div className={`w-px h-full bg-gray-200 dark:bg-gray-700`} />
  ) : (
    <div className={`w-full h-px bg-gray-200 dark:bg-gray-700 ${spacing}`} />
  );
}