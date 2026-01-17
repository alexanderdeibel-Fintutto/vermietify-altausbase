import React from 'react';
import FavoritesManager from '@/components/dashboard/FavoritesManager';

export default function FavoriteButton({ entityType, entityId, isFavorite }) {
  return (
    <FavoritesManager 
      entityType={entityType} 
      entityId={entityId} 
      isFavorite={isFavorite} 
    />
  );
}