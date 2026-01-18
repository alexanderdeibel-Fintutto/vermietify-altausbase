import React, { useState } from 'react';
import { VfQuiz } from '@/components/workflows/VfQuiz';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { FileText } from 'lucide-react';

export default function SteuerGuideQuiz() {
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
      question: 'Erstellen Sie aktuell eine Anlage V für Ihre Immobilie(n)?',
      type: 'single',
      options: [
        { id: 'a1', label: 'Ja, selbst', score: 8 },
        { id: 'a2', label: 'Ja, mit Steuerberater', score: 10 },
        { id: 'a3', label: 'Nein, noch nie', score: 3 },
        { id: 'a4', label: 'Was ist Anlage V?', score: 0 }
      ]
    },
    {
      id: 'q2',
      question: 'Wie erfassen Sie Ihre Mieteinnahmen und Ausgaben?',
      type: 'single',
      options: [
        { id: 'a1', label: 'Professionelle Software', score: 10 },
        { id: 'a2', label: 'Excel', score: 6 },
        { id: 'a3', label: 'Papier/Ordner', score: 3 },
        { id: 'a4', label: 'Gar nicht strukturiert', score: 0 }
      ]
    },
    {
      id: 'q3',
      question: 'Kennen Sie Ihren AfA-Satz?',
      type: 'single',
      options: [
        { id: 'a1', label: 'Ja, nutze ich aktiv', score: 10 },
        { id: 'a2', label: 'Kenne ich, nutze ich nicht', score: 5 },
        { id: 'a3', label: 'Nein, was ist das?', score: 0 }
      ]
    }
  ];

  const handleComplete = (answers) => {
    submitMutation.mutate({
      quiz_type: 'steuer_check',
      answers,
      duration_seconds: 60
    });
  };

  if (result) {
    return (
      <VfLeadCapturePage
        header={
          <VfToolHeader
            icon={<FileText className="h-10 w-10" />}
            badge="ERGEBNIS"
            title="Ihr Steuer-Wissen"
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
          icon={<FileText className="h-10 w-10" />}
          badge="QUIZ"
          title="Steuer-Check"
          description="Wie gut kennen Sie sich mit Immobilien-Steuern aus?"
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