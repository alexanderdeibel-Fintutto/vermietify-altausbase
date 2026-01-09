import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FeatureDiscoveryPanel() {
  const [discovery, setDiscovery] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDiscovery();
  }, []);

  const loadDiscovery = async () => {
    try {
      const response = await base44.functions.invoke('getFeatureDiscovery', {});
      if (response.data.discovery) {
        setDiscovery(response.data.discovery);
      }
    } catch (error) {
      console.error('Error loading feature discovery:', error);
    }
  };

  const handleExplore = () => {
    if (discovery.actionPage) {
      navigate(createPageUrl(discovery.actionPage));
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (!discovery || dismissed) return null;

  return (
    <Card className="border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-6">
      <CardContent className="pt-4 flex items-start gap-3">
        <Sparkles className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 mb-1">✨ {discovery.title}</h4>
          <p className="text-sm text-slate-600 mb-3">{discovery.description}</p>
          <div className="flex items-center gap-2">
            {discovery.actionPage && (
              <Button 
                size="sm" 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleExplore}
              >
                Entdecken
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            )}
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleDismiss}
            >
              Verstanden
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}