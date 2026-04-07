'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import type { TaskDifficulty } from '@/lib/tiptap/task-box-extension'

const DIFF_OPTIONS: { value: TaskDifficulty; label: string }[] = [
  { value: '1', label: 'Easy' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Hard' },
]

export function TaskBoxNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const badge = (node.attrs.badge as string) || 'Practice'
  const taskTitle = (node.attrs.taskTitle as string) || ''
  const difficulty = (node.attrs.difficulty as TaskDifficulty) || '1'
  const timeEstimate = (node.attrs.timeEstimate as string) || ''
  const editable = editor.isEditable

  const diffClass =
    difficulty === '2' ? 'diff-2' : difficulty === '3' ? 'diff-3' : 'diff-1'
  const diffLabel =
    difficulty === '2' ? 'Medium' : difficulty === '3' ? 'Hard' : 'Easy'

  return (
    <NodeViewWrapper className="task-box my-6">
      <div className="task-header" contentEditable={false}>
        {editable ? (
          <>
            <input
              type="text"
              value={badge}
              onChange={(e) => updateAttributes({ badge: e.target.value })}
              className="task-badge max-w-[160px] rounded border-0 bg-[#a78bfa] px-2 py-1 font-[family-name:var(--font-jetbrains-mono)] text-[9px] font-bold uppercase tracking-[0.1em] text-white outline-none"
            />
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => updateAttributes({ taskTitle: e.target.value })}
              className="task-title min-w-0 flex-1 bg-transparent font-[family-name:var(--font-plus-jakarta-sans)] text-[14px] font-bold text-[#a78bfa] outline-none"
            />
            <select
              value={difficulty}
              onChange={(e) =>
                updateAttributes({ difficulty: e.target.value as TaskDifficulty })
              }
              className={`task-diff cursor-pointer rounded border-0 font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-semibold outline-none ${diffClass}`}
            >
              {DIFF_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={timeEstimate}
              onChange={(e) => updateAttributes({ timeEstimate: e.target.value })}
              placeholder="Time"
              className="task-time ml-auto w-24 bg-transparent text-right font-[family-name:var(--font-jetbrains-mono)] text-[11px] font-semibold text-[#fbbf24] outline-none placeholder:text-[#7a8499]"
            />
          </>
        ) : (
          <>
            <span className="task-badge">{badge}</span>
            <span className="task-title">{taskTitle}</span>
            <span className={`task-diff ${diffClass}`}>{diffLabel}</span>
            {timeEstimate ? (
              <span className="task-time">{timeEstimate}</span>
            ) : null}
          </>
        )}
      </div>
      <div className="task-body">
        <NodeViewContent className="max-w-none" />
      </div>
    </NodeViewWrapper>
  )
}
