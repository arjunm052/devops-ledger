'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'

export function AnalogyNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const label = (node.attrs.label as string) || 'Analogy'
  const editable = editor.isEditable

  return (
    <NodeViewWrapper className="analogy my-6">
      <div
        className="analogy-label"
        contentEditable={false}
      >
        {editable ? (
          <input
            type="text"
            value={label}
            onChange={(e) => updateAttributes({ label: e.target.value })}
            className="w-full bg-transparent font-[family-name:var(--font-plus-jakarta-sans)] text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#5eead4] outline-none"
          />
        ) : (
          label
        )}
      </div>
      <NodeViewContent className="max-w-none [&_p]:text-[#b2f5ea] [&_p]:text-[14px]" />
    </NodeViewWrapper>
  )
}
