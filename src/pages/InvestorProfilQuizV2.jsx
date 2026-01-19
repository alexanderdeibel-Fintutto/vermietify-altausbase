import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '@/components/notifications/ToastNotification';
import VfLeadCapturePage from '@/components/lead-capture/VfLeadCapturePage';

const questions = [
    {
        id: 'risk_tolerance',
        text: 'Wie gehen Sie mit Risiko um?',
        options: [
            { value: 2, label: 'Sehr vorsichtig - Sicherheit ist mir wichtig' },
            { value: 5, label: 'Ausgewogen - Mix aus Sicherheit und Rendite' },
            { value: 8, label: 'Risikofreudig - Höhere Rendite ist das Ziel' },
            { value: 10, label: 'Sehr risikofreudig - Ich setze auf Wertsteigerung' }
        ]
    },
    {
        id: 'investment_goal',
        text: 'Was ist Ihr Hauptziel?',
        options: [
            { value: 2, label: 'Stabile monatliche Einnahmen' },
            { value: 5, label: 'Langfristiger Vermögensaufbau' },
            { value: 8, label: 'Wertsteigerung durch Sanierung' },
            { value: 10, label: 'Maximale Rendite in kurzer Zeit' }
        ]
    },
    {
        id: 'experience',
        text: 'Wie viel Erfahrung haben Sie mit Immobilien?',
        options: [
            { value: 2, label: 'Keine - Ich bin Einsteiger' },
            { value: 5, label: 'Etwas - Ich habe recherchiert' },
            { value: 8, label: 'Fortgeschritten - Ich besitze bereits Immobilien' },
            { value: 10, label: 'Experte - Ich bin professioneller Investor' }
        ]
    },
    {
        id: 'time_commitment',
        text: 'Wie viel Zeit können Sie investieren?',
        options: [
            { value: 2, label: 'Minimal - Ich möchte passive Investments' },
            { value: 5, label: 'Gelegentlich - Ein paar Stunden pro Monat' },
            { value: 8, label: 'Regelmäßig - Mehrere Stunden pro Woche' },
            { value: 10, label: 'Viel - Das ist mein Hauptgeschäft' }
        ]
    }
];

export default function InvestorProfilQuizV2() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [showLeadGate, setShowLeadGate] = useState(false);
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
                quiz_type: 'investor_profil',
                answers
            });

            setResult(data.result);
            setShowLeadGate(true);
        } catch (error) {
            showError('Fehler beim Verarbeiten');
        } finally {
            setLoading(false);
        }
    };

    if (showLeadGate && result) {
        return (
            <VfLeadCapturePage
                toolName="Investor-Profil Quiz"
                toolIcon={CheckCircle}
                headline={result.result_title}
                subheadline={result.result_description}
                onLeadCaptured={() => {
                    setShowLeadGate(false);
                    showSuccess('Ergebnis gespeichert!');
                }}
                onSkip={() => setShowLeadGate(false)}
            />
        );
    }

    if (result && !showLeadGate) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <div className="vf-quiz-result">
                    <div className="vf-quiz-result-score">{result.percentage}%</div>
                    <div className="vf-quiz-result-label">{result.result_title}</div>
                    <div className="vf-quiz-result-description">{result.result_description}</div>
                    
                    {result.recommendations && result.recommendations.length > 0 && (
                        <div className="mt-8 text-left max-w-md mx-auto">
                            <h3 className="font-semibold mb-4">Empfehlungen für Sie:</h3>
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

                    <Button onClick={() => window.location.reload()} className="mt-8">
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
                <div className="vf-wizard-progress mb-8">
                    {questions.map((q, idx) => (
                        <div 
                            key={q.id} 
                            className={`vf-wizard-progress-step ${idx === currentQuestion ? 'vf-wizard-progress-step-active' : ''} ${idx < currentQuestion ? 'vf-wizard-progress-step-completed' : ''}`}
                        >
                            <div className="vf-wizard-progress-icon">{idx + 1}</div>
                            <div className="vf-wizard-progress-label">Frage {idx + 1}</div>
                        </div>
                    ))}
                </div>

                <div className="vf-quiz-question">
                    <div className="vf-quiz-question-number">Frage {currentQuestion + 1} von {questions.length}</div>
                    <div className="vf-quiz-question-text">{question.text}</div>
                </div>

                <div className="vf-quiz-options">
                    {question.options.map((option) => (
                        <div
                            key={option.value}
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