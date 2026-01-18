import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function InvestorProfilQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
    {
      id: 'experience',
      question: 'Wie viel Erfahrung haben Sie mit Immobilieninvestitionen?',
      options: [
        { value: 'none', label: 'Keine Erfahrung', score: 2 },
        { value: 'some', label: 'Etwas Erfahrung (1-3 Jahre)', score: 5 },
        { value: 'experienced', label: 'Erfahren (4-10 Jahre)', score: 8 },
        { value: 'expert', label: 'Experte (10+ Jahre)', score: 10 }
      ]
    },
    {
      id: 'properties',
      question: 'Wie viele Objekte besitzen Sie aktuell?',
      options: [
        { value: '0', label: 'Keine', score: 0 },
        { value: '1-2', label: '1-2 Objekte', score: 5 },
        { value: '3-5', label: '3-5 Objekte', score: 8 },
        { value: '6+', label: '6+ Objekte', score: 10 }
      ]
    },
    {
      id: 'strategy',
      question: 'Was ist Ihre Hauptstrategie?',
      options: [
        { value: 'cashflow', label: 'Cashflow & regelmäßige Einnahmen', score: 8 },
        { value: 'appreciation', label: 'Wertsteigerung', score: 7 },
        { value: 'tax', label: 'Steueroptimierung', score: 9 },
        { value: 'diversification', label: 'Diversifikation', score: 6 }
      ]
    }
  ];

  const currentQuestion = questions[step];

  const handleAnswer = (option) => {
    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const response = await base44.functions.invoke('processQuizResult', {
        quiz_type: 'investor_profil',
        answers: finalAnswers,
        duration_seconds: 60
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6 flex items-center justify-center">
        <div className="vf-quiz-result">
          <div className="vf-quiz-result-score">{result.score}/{result.max_score}</div>
          <div className="vf-quiz-result-label">{result.category}</div>
          <p className="vf-quiz-result-description">
            Basierend auf Ihren Antworten empfehlen wir Ihnen unseren Professional Plan.
          </p>
          <Button variant="gradient" size="lg" className="mt-8">
            Jetzt starten
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="vf-quiz-question">
          <div className="vf-quiz-question-text">{currentQuestion.question}</div>
          <div className="vf-quiz-question-number">Frage {step + 1} von {questions.length}</div>
        </div>

        <div className="vf-quiz-options">
          {currentQuestion.options.map((option) => (
            <div
              key={option.value}
              className={`vf-quiz-option ${answers[currentQuestion.id]?.value === option.value ? 'vf-quiz-option-selected' : ''}`}
              onClick={() => handleAnswer(option)}
            >
              <div className="vf-quiz-option-radio" />
              <span>{option.label}</span>
            </div>
          ))}
        </div>

        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)} className="mt-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        )}
      </div>
    </div>
  );
}