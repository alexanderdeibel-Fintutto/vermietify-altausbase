import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const VfQuiz = React.forwardRef(({ 
  questions = [],
  currentQuestion = 0,
  answers = {},
  onAnswer,
  onNext,
  onPrev,
  onComplete,
  result,
  className,
  ...props 
}, ref) => {
  const question = questions[currentQuestion];
  const currentAnswer = answers[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const canContinue = currentAnswer !== undefined;

  if (result) {
    return (
      <div ref={ref} className={cn("vf-wizard-content", className)} {...props}>
        {result}
      </div>
    );
  }

  return (
    <div ref={ref} className={cn("vf-wizard-content", className)} {...props}>
      <div className="vf-quiz-question">
        <div className="vf-quiz-question-text">{question?.text}</div>
        <div className="vf-quiz-question-number">
          Frage {currentQuestion + 1} von {questions.length}
        </div>
      </div>

      {question?.type === "single" && (
        <div className="vf-quiz-options">
          {question.options?.map((option, index) => (
            <div
              key={index}
              onClick={() => onAnswer?.(currentQuestion, option.value)}
              className={cn(
                "vf-quiz-option",
                currentAnswer === option.value && "vf-quiz-option-selected"
              )}
            >
              <div className="vf-quiz-option-radio" />
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}

      {question?.type === "scale" && (
        <div className="vf-quiz-scale">
          {Array.from({ length: question.max - question.min + 1 }, (_, i) => {
            const value = question.min + i;
            return (
              <div
                key={value}
                onClick={() => onAnswer?.(currentQuestion, value)}
                className={cn(
                  "vf-quiz-scale-option",
                  currentAnswer === value && "vf-quiz-scale-option-selected"
                )}
              >
                {value}
              </div>
            );
          })}
        </div>
      )}

      <div className="vf-wizard-actions">
        <Button
          variant="outline"
          onClick={onPrev}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
        {isLastQuestion ? (
          <Button
            variant="gradient"
            onClick={onComplete}
            disabled={!canContinue}
          >
            Ergebnis anzeigen
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!canContinue}
          >
            Weiter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
})
VfQuiz.displayName = "VfQuiz"

export { VfQuiz }