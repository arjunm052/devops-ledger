import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { McqQuizNodeView } from '@/components/editor/mcq-quiz-node'

export interface McqQuestion {
  id: string
  text: string
  options: string[]
  correct: number
  explanation: string
  level?: string
  levelLabel?: string
}

export const McqQuiz = Node.create({
  name: 'mcqQuiz',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-mcq-title') ?? '',
        renderHTML: (attrs) => ({ 'data-mcq-title': attrs.title }),
      },
      badges: {
        default: '[]',
        parseHTML: (el) => el.getAttribute('data-mcq-badges') ?? '[]',
        renderHTML: (attrs) => ({ 'data-mcq-badges': attrs.badges }),
      },
      questions: {
        default: '[]',
        parseHTML: (el) => el.getAttribute('data-mcq-questions') ?? '[]',
        renderHTML: (attrs) => ({ 'data-mcq-questions': attrs.questions }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mcqQuiz"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'mcqQuiz' }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(McqQuizNodeView)
  },
})
