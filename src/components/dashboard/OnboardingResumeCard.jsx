import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function OnboardingResumeCard({ progress }) {
  const navigate = useNavigate();

  if (!progress || progress.is_completed) return null;

  const completedSteps = progress.completed_steps?.length || 0;
  const totalSteps = 5; // Approximate
  const progressPercent = (completedSteps / totalSteps) * 100;

  return (
    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <CardTitle>Setup fortsetzen</CardTitle>
          </div>
          <Badge variant="outline">{completedSteps} von {totalSteps}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          Vervollständigen Sie Ihr Setup und nutzen Sie alle Features optimal.
        </p>
        
        <Progress value={progressPercent} className="h-2" />
        
        <Button 
          onClick={() => navigate(createPageUrl('Onboarding'))}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          Weiter zum Setup
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}