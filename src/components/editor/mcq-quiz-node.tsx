'use client'

import { useState, useCallback } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import type { McqQuestion } from '@/lib/tiptap/mcq-quiz-extension'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function McqQuizNodeView({ node, editor }: NodeViewProps) {
  const title = (node.attrs.title as string) || ''
  const badges: string[] = (() => {
    try {
      const v = node.attrs.badges
      return typeof v === 'string' ? JSON.parse(v) : v
    } catch {
      return []
    }
  })()
  const questions: McqQuestion[] = (() => {
    try {
      const v = node.attrs.questions
      return typeof v === 'string' ? JSON.parse(v) : v
    } catch {
      return []
    }
  })()

  const editable = editor.isEditable

  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [score, setScore] = useState({ answered: 0, correct: 0 })

  const handleAnswer = useCallback(
    (qId: string, chosenIdx: number, correctIdx: number) => {
      if (answers[qId] !== undefined) return
      setAnswers((prev) => ({ ...prev, [qId]: chosenIdx }))
      setScore((prev) => ({
        answered: prev.answered + 1,
        correct: prev.correct + (chosenIdx === correctIdx ? 1 : 0),
      }))
    },
    [answers]
  )

  const handleReset = useCallback(() => {
    setAnswers({})
    setScore({ answered: 0, correct: 0 })
  }, [])

  return (
    <NodeViewWrapper className="my-6" contentEditable={false}>
      {/* Section header */}
      <div className="mcq-section-header">
        <span className="mcq-section-num">Q</span>
        <h2>{title}</h2>
      </div>

      {/* Meta bar */}
      <div className="mcq-meta">
        {badges.map((b, i) => (
          <span key={i} className="mcq-badge">
            {b}
          </span>
        ))}
        <span className="mcq-score-box">
          Score: {score.correct} / {score.answered}
        </span>
        {!editable && (
          <button className="mcq-reset-btn" onClick={handleReset}>
            &#8635; Reset Quiz
          </button>
        )}
      </div>

      {/* Questions */}
      <div>
        {questions.map((q, qi) => {
          const chosen = answers[q.id]
          const isAnswered = chosen !== undefined
          const isCorrect = chosen === q.correct

          return (
            <div key={q.id}>
              {/* Level header */}
              {q.levelLabel && (
                <div
                  className={`mcq-level-header ${
                    q.level === 'intermediate'
                      ? 'mcq-level-intermediate'
                      : 'mcq-level-beginner'
                  }`}
                >
                  {q.levelLabel}
                </div>
              )}

              {/* Question card */}
              <div
                className={`mcq-card${
                  isAnswered
                    ? isCorrect
                      ? ' answered-correct'
                      : ' answered-wrong'
                    : ''
                }`}
              >
                <div className="mcq-q-header">
                  <span className="mcq-q-num">Q{qi + 1}</span>
                  <div className="mcq-q-text">{q.text}</div>
                </div>

                <div className="mcq-options">
                  {q.options.map((opt, oi) => {
                    let optClass = 'mcq-option'
                    if (isAnswered) {
                      optClass += ' disabled'
                      if (oi === chosen && oi === q.correct)
                        optClass += ' correct'
                      else if (oi === chosen && oi !== q.correct)
                        optClass += ' wrong'
                      else if (oi === q.correct)
                        optClass += ' reveal-correct'
                    }

                    return (
                      <div
                        key={oi}
                        className={optClass}
                        onClick={
                          editable || isAnswered
                            ? undefined
                            : () => handleAnswer(q.id, oi, q.correct)
                        }
                      >
                        <span className="opt-letter">
                          {LETTERS[oi] || String(oi + 1)}
                        </span>
                        {opt}
                      </div>
                    )
                  })}
                </div>

                {isAnswered && (
                  <div
                    className="mcq-explanation show"
                    dangerouslySetInnerHTML={{
                      __html: `<div class="mcq-exp-label">Explanation</div>${q.explanation}`,
                    }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </NodeViewWrapper>
  )
}
