'use client'

import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'

/**
 * SVG is author-controlled (import script / trusted editor). Same trust model as RawHtmlNodeView.
 */
export function DiagramNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const title = (node.attrs.title as string) || ''
  const svgHtml = (node.attrs.svgHtml as string) || ''
  const editable = editor.isEditable

  return (
    <NodeViewWrapper className="diagram-wrap my-6">
      <div className="diagram-title" contentEditable={false}>
        {editable ? (
          <input
            type="text"
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            className="w-full bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-[11px] font-bold uppercase tracking-[0.06em] text-[#60a5fa] outline-none"
          />
        ) : (
          title
        )}
      </div>
      {editable ? (
        <textarea
          className="min-h-[120px] w-full resize-y border-0 bg-[#111827] p-3 font-[family-name:var(--font-jetbrains-mono)] text-[11px] text-[#94a3b8] outline-none"
          value={svgHtml}
          onChange={(e) => updateAttributes({ svgHtml: e.target.value })}
          spellCheck={false}
          aria-label="SVG source"
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: svgHtml }} />
      )}
    </NodeViewWrapper>
  )
}
