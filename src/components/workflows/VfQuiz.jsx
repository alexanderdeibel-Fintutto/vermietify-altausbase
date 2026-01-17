import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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
  const question = questions[currentQuestion]
  const isLastQuestion = currentQuestion === questions.length - 1

  return (
    <div ref={ref} className={cn("vf-wizard", className)} {...props}>
      {!result ? (
        <div className="vf-wizard-content">
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
                  className={cn(
                    "vf-quiz-option",
                    answers[currentQuestion] === option.value && "vf-quiz-option-selected"
                  )}
                  onClick={() => onAnswer?.(currentQuestion, option.value)}
                >
                  <div className="vf-quiz-option-radio" />
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
          )}

          {question?.type === "scale" && (
            <div className="vf-quiz-scale">
              {Array.from({ length: question.max - question.min + 1 }, (_, i) => i + question.min).map((num) => (
                <div
                  key={num}
                  className={cn(
                    "vf-quiz-scale-option",
                    answers[currentQuestion] === num && "vf-quiz-scale-option-selected"
                  )}
                  onClick={() => onAnswer?.(currentQuestion, num)}
                >
                  {num}
                </div>
              ))}
            </div>
          )}

          <div className="vf-wizard-actions">
            <Button
              variant="outline"
              onClick={onPrev}
              disabled={currentQuestion === 0}
            >
              Zurück
            </Button>
            <Button
              onClick={isLastQuestion ? onComplete : onNext}
              disabled={answers[currentQuestion] === undefined}
            >
              {isLastQuestion ? "Ergebnis anzeigen" : "Weiter"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="vf-wizard-content">
          <div className="vf-quiz-result">
            {result}
          </div>
        </div>
      )}
    </div>
  );
})
VfQuiz.displayName = "VfQuiz"

export { VfQuiz }