import React, { useState } from 'react';
import { VfQuiz } from '@/components/workflows/VfQuiz';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Target } from 'lucide-react';

export default function InvestorProfilQuiz() {
  const [result, setResult] = useState(null);

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('processQuizResult', data),
    onSuccess: (response) => {
      setResult(response.data);
    }
  });

  const questions = [
    {
      id: 'q1',
      question: 'Wie viele Immobilien besitzen Sie aktuell?',
      type: 'single',
      options: [
        { id: 'a1', label: 'Keine', score: 0 },
        { id: 'a2', label: '1-2', score: 5 },
        { id: 'a3', label: '3-5', score: 8 },
        { id: 'a4', label: '6+', score: 10 }
      ]
    },
    {
      id: 'q2',
      question: 'Wie verwalten Sie Ihre Immobilien aktuell?',
      type: 'single',
      options: [
        { id: 'a1', label: 'Excel/Papier', score: 3 },
        { id: 'a2', label: 'Einfache Software', score: 6 },
        { id: 'a3', label: 'Professionelle Software', score: 10 },
        { id: 'a4', label: 'Hausverwaltung', score: 5 }
      ]
    },
    {
      id: 'q3',
      question: 'Wie wichtig ist Ihnen die Steueroptimierung?',
      type: 'scale',
      min: 1,
      max: 10,
      labels: { min: 'Unwichtig', max: 'Sehr wichtig' }
    }
  ];

  const handleComplete = (answers) => {
    submitMutation.mutate({
      quiz_type: 'investor_profil',
      answers,
      duration_seconds: 60
    });
  };

  if (result) {
    return (
      <VfLeadCapturePage
        header={
          <VfToolHeader
            icon={<Target className="h-10 w-10" />}
            badge="ERGEBNIS"
            title="Ihr Investor-Profil"
            description="Basierend auf Ihren Antworten"
          />
        }
      >
        <div className="vf-quiz-result">
          <div className="vf-quiz-result-score">
            {result.score}/{result.max_score}
          </div>
          <div className="vf-quiz-result-label">{result.category}</div>
          <div className="vf-quiz-result-description">
            {result.recommendations.join(' • ')}
          </div>
        </div>
      </VfLeadCapturePage>
    );
  }

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<Target className="h-10 w-10" />}
          badge="QUIZ"
          title="Investor-Profil Quiz"
          description="Finden Sie heraus, welcher Investoren-Typ Sie sind"
        />
      }
    >
      <VfQuiz
        questions={questions}
        onComplete={handleComplete}
      />
    </VfLeadCapturePage>
  );
}