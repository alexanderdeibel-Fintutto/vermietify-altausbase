import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';

const questions = [
    {
        id: 'anlage_v',
        text: 'Wofür wird die Anlage V verwendet?',
        options: [
            { value: 'correct', label: 'Für Einkünfte aus Vermietung und Verpachtung' },
            { value: false, label: 'Für gewerbliche Einkünfte' },
            { value: false, label: 'Für Kapitaleinkünfte' },
            { value: false, label: 'Für selbstständige Arbeit' }
        ]
    },
    {
        id: 'afa',
        text: 'Was bedeutet AfA?',
        options: [
            { value: false, label: 'Allgemeine Finanzaufsicht' },
            { value: 'correct', label: 'Absetzung für Abnutzung' },
            { value: false, label: 'Anschaffungskosten für Ausstattung' },
            { value: false, label: 'Automatische Finanzanalyse' }
        ]
    },
    {
        id: 'werbungskosten',
        text: 'Welche Kosten zählen zu den Werbungskosten?',
        options: [
            { value: false, label: 'Nur die Grundsteuer' },
            { value: 'correct', label: 'Alle Ausgaben zur Erzielung der Mieteinnahmen' },
            { value: false, label: 'Nur Reparaturkosten' },
            { value: false, label: 'Private Lebenshaltungskosten' }
        ]
    },
    {
        id: 'betriebskosten',
        text: 'Was sind umlagefähige Betriebskosten?',
        options: [
            { value: false, label: 'Alle Kosten des Vermieters' },
            { value: 'correct', label: 'Kosten, die auf den Mieter umgelegt werden können' },
            { value: false, label: 'Nur Heizkosten' },
            { value: false, label: 'Verwaltungskosten' }
        ]
    }
];

export default function SteuerGuideQuiz() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnswer = (value) => {
        setAnswers(prev => ({ ...prev, [questions[currentQuestion].id]: value }));
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        setCurrentQuestion(prev => prev - 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data } = await base44.functions.invoke('processQuizResult', {
                quiz_type: 'steuer_guide',
                answers
            });

            setResult(data.result);
        } catch (error) {
            showError('Fehler beim Auswerten');
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="vf-quiz-result">
                    <BookOpen className="w-20 h-20 mx-auto mb-6 text-blue-600" />
                    <div className="vf-quiz-result-score">{result.percentage}%</div>
                    <div className="vf-quiz-result-label">{result.result_title}</div>
                    <div className="vf-quiz-result-description">{result.result_description}</div>
                    
                    {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-8 text-left max-w-md mx-auto">
                            <h3 className="font-semibold mb-4">Empfehlungen:</h3>
                            <ul className="space-y-2">
                                {result.recommendations.map((rec, idx) => (
                                    <li key={idx} className="flex gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Button onClick={() => window.location.reload()} className="mt-8 vf-btn-gradient">
                        Quiz wiederholen
                    </Button>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];
    const hasAnswer = answers[question.id] !== undefined;

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="vf-wizard-content">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <BookOpen className="w-10 h-10 text-blue-600" />
                        <h1 className="text-2xl font-bold">Steuer-Guide Quiz</h1>
                    </div>
                    <div className="vf-wizard-progress">
                        {questions.map((q, idx) => (
                            <div 
                                key={q.id} 
                                className={`vf-wizard-progress-step ${idx === currentQuestion ? 'vf-wizard-progress-step-active' : ''} ${idx < currentQuestion ? 'vf-wizard-progress-step-completed' : ''}`}
                            >
                                <div className="vf-wizard-progress-icon">{idx + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="vf-quiz-question">
                    <div className="vf-quiz-question-number">Frage {currentQuestion + 1} von {questions.length}</div>
                    <div className="vf-quiz-question-text">{question.text}</div>
                </div>

                <div className="vf-quiz-options">
                    {question.options.map((option, idx) => (
                        <div
                            key={idx}
                            className={`vf-quiz-option ${answers[question.id] === option.value ? 'vf-quiz-option-selected' : ''}`}
                            onClick={() => handleAnswer(option.value)}
                        >
                            <div className="vf-quiz-option-radio"></div>
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>

                <div className="vf-wizard-actions mt-8">
                    <Button 
                        onClick={handleBack} 
                        disabled={currentQuestion === 0}
                        variant="outline"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Zurück
                    </Button>
                    <Button 
                        onClick={handleNext} 
                        disabled={!hasAnswer || loading}
                        className="vf-btn-gradient"
                    >
                        {currentQuestion === questions.length - 1 ? 'Auswerten' : 'Weiter'}
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}