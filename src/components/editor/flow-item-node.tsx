'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'

export function FlowItemNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const step = (node.attrs.step as number) || 1
  const editable = editor.isEditable

  return (
    <NodeViewWrapper className="flow-step" data-flow-step={step}>
      <div
        className="flow-num flex items-center justify-center"
        contentEditable={false}
      >
        {editable ? (
          <input
            type="number"
            min={1}
            value={step}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10)
              if (Number.isFinite(v) && v >= 1) updateAttributes({ step: v })
            }}
            className="size-7 rounded-full border-0 bg-[#60a5fa] text-center font-[family-name:var(--font-plus-jakarta-sans)] text-[12px] font-extrabold text-[#0b0e14] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
        ) : (
          step
        )}
      </div>
      <div className="flow-content">
        <NodeViewContent className="max-w-none" />
      </div>
    </NodeViewWrapper>
  )
}
