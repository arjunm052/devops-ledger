'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import type { CalloutType } from '@/lib/tiptap/callout-extension'

const CALLOUT_CONFIG: Record<CalloutType, { icon: string; label: string; borderColor: string; bgColor: string }> = {
  info: { icon: 'ℹ️', label: 'INFO', borderColor: 'border-l-blue-500', bgColor: 'bg-blue-500/[0.06]' },
  warning: { icon: '⚠️', label: 'WARNING', borderColor: 'border-l-amber-500', bgColor: 'bg-amber-500/[0.06]' },
  tip: { icon: '💡', label: 'TIP', borderColor: 'border-l-green-500', bgColor: 'bg-green-500/[0.06]' },
  danger: { icon: '🚫', label: 'DANGER', borderColor: 'border-l-red-500', bgColor: 'bg-red-500/[0.06]' },
}

const TYPE_ORDER: CalloutType[] = ['info', 'warning', 'tip', 'danger']

export function CalloutNodeView({ node, updateAttributes }: NodeViewProps) {
  const calloutType = (node.attrs.type || 'info') as CalloutType
  const config = CALLOUT_CONFIG[calloutType]

  const cycleType = () => {
    const idx = TYPE_ORDER.indexOf(calloutType)
    const next = TYPE_ORDER[(idx + 1) % TYPE_ORDER.length]
    updateAttributes({ type: next })
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className={`rounded-lg border-l-[3px] ${config.borderColor} ${config.bgColor} p-4`}>
        <button
          type="button"
          onClick={cycleType}
          className="mb-2 flex items-center gap-1.5 font-[family-name:var(--font-inter)] text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] hover:opacity-80"
          contentEditable={false}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </button>
        <NodeViewContent className="callout-content prose prose-sm max-w-none text-[var(--color-body)]" />
      </div>
    </NodeViewWrapper>
  )
}
