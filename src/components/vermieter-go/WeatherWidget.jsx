import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

export default function WeatherWidget() {
  const { data: weather } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      // Get user location
      if (!navigator.geolocation) return null;
      
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Use free weather API
            const response = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            const data = await response.json();
            resolve(data.current_weather);
          },
          () => resolve(null)
        );
      });
    }
  });

  if (!weather) {
    return (
      <Card className="bg-gradient-to-r from-blue-400 to-blue-500 text-white">
        <CardContent className="py-3">
          <p className="text-sm">Wetter wird geladen...</p>
        </CardContent>
      </Card>
    );
  }

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="w-6 h-6" />;
    if (code <= 3) return <Cloud className="w-6 h-6" />;
    if (code <= 67) return <CloudRain className="w-6 h-6" />;
    return <Wind className="w-6 h-6" />;
  };

  const getWeatherDescription = (code) => {
    if (code === 0) return 'Sonnig';
    if (code <= 3) return 'Bewölkt';
    if (code <= 67) return 'Regen';
    return 'Stürmisch';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-400 to-blue-500 text-white border-0">
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getWeatherIcon(weather.weathercode)}
            <div>
              <p className="text-2xl font-bold">{Math.round(weather.temperature)}°C</p>
              <p className="text-sm opacity-90">{getWeatherDescription(weather.weathercode)}</p>
            </div>
          </div>
          <div className="text-right text-sm opacity-90">
            <p>Wind: {Math.round(weather.windspeed)} km/h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}