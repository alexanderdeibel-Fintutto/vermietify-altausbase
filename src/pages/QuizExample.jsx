import React, { useState } from 'react';
import { VfQuiz } from '@/components/workflows/VfQuiz';
import { Button } from '@/components/ui/button';

export default function QuizExample() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
    {
      text: "Wie viele Immobilien verwalten Sie?",
      type: "single",
      options: [
        { label: "1-5 Objekte", value: "small" },
        { label: "6-20 Objekte", value: "medium" },
        { label: "21-50 Objekte", value: "large" },
        { label: "50+ Objekte", value: "enterprise" }
      ]
    },
    {
      text: "Wie zufrieden sind Sie mit Ihrer aktuellen Verwaltung?",
      type: "scale",
      min: 1,
      max: 5
    },
    {
      text: "Welche Features sind Ihnen am wichtigsten?",
      type: "single",
      options: [
        { label: "Buchhaltung & Finanzen", value: "finance" },
        { label: "Mieterverwaltung", value: "tenants" },
        { label: "Dokumentenmanagement", value: "documents" },
        { label: "Steueroptimierung", value: "tax" }
      ]
    }
  ];

  const handleComplete = () => {
    const portfolio = answers[0];
    const satisfaction = answers[1];
    const priority = answers[2];

    let recommendation = "Professional";
    if (portfolio === "enterprise" || priority === "tax") {
      recommendation = "Enterprise";
    } else if (portfolio === "small") {
      recommendation = "Starter";
    }

    setResult({
      recommendation,
      score: ((satisfaction / 5) * 100).toFixed(0)
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <VfQuiz
        questions={questions}
        currentQuestion={currentQuestion}
        answers={answers}
        onAnswer={(index, value) => setAnswers({ ...answers, [index]: value })}
        onNext={() => setCurrentQuestion(currentQuestion + 1)}
        onPrev={() => setCurrentQuestion(currentQuestion - 1)}
        onComplete={handleComplete}
        result={result && (
          <div className="vf-quiz-result">
            <div className="vf-quiz-result-score">{result.score}%</div>
            <div className="vf-quiz-result-label">
              Empfohlenes Paket: {result.recommendation}
            </div>
            <div className="vf-quiz-result-description">
              Basierend auf Ihren Antworten empfehlen wir Ihnen unser {result.recommendation}-Paket
            </div>
            <Button variant="gradient" size="lg" className="mt-8">
              Paket ansehen
            </Button>
          </div>
        )}
      />
    </div>
  );
}