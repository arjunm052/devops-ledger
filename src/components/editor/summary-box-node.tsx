'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'

export function SummaryBoxNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const title = (node.attrs.title as string) || '// Section summary'
  const editable = editor.isEditable

  return (
    <NodeViewWrapper className="summary-box my-10">
      <div className="summary-title" contentEditable={false}>
        {editable ? (
          <input
            type="text"
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            className="w-full bg-transparent font-[family-name:var(--font-plus-jakarta-sans)] text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#60a5fa] outline-none"
          />
        ) : (
          title
        )}
      </div>
      <NodeViewContent className="max-w-none" />
    </NodeViewWrapper>
  )
}
