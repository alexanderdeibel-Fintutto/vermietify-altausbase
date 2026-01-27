import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/components/services/supabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

const APP_ID = 'nk-abrechnung';

export default function CrossSellBanner() {
  const { data: apps = [] } = useQuery({
    queryKey: ['fintutto-ecosystem'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_fintutto_ecosystem')
        .select('*')
        .neq('app_id', APP_ID)
        .eq('is_active', true)
        .order('sort_order')
        .limit(3);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  if (apps.length === 0) return null;

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-blue-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">Entdecken Sie die FinTuttO Suite</h3>
            <p className="text-gray-600 mb-4">
              Optimieren Sie Ihre komplette Immobilienverwaltung mit unseren weiteren Apps:
            </p>
            
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {apps.map(app => (
                <div key={app.app_id} className="bg-white rounded-lg p-4 border">
                  <h4 className="font-semibold mb-1">{app.app_name}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {app.description}
                  </p>
                  <a href={app.app_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="w-full">
                      Mehr erfahren
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}