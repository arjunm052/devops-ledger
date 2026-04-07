'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import type { CalloutType } from '@/lib/tiptap/callout-extension'

const CALLOUT_CONFIG: Record<
  CalloutType,
  { icon: string; label: string; borderClass: string; bgClass: string; labelColor: string; textColor: string }
> = {
  info:    { icon: 'ℹ️', label: 'INFO',    borderClass: 'border-[rgba(96,165,250,0.3)]',  bgClass: 'bg-[rgba(96,165,250,0.1)]',  labelColor: '#60a5fa', textColor: '#bfdbfe' },
  warning: { icon: '⚠️', label: 'WARNING', borderClass: 'border-[rgba(251,191,36,0.3)]',  bgClass: 'bg-[rgba(251,191,36,0.1)]',  labelColor: '#fbbf24', textColor: '#fde68a' },
  tip:     { icon: '💡', label: 'TIP',     borderClass: 'border-[rgba(74,222,128,0.3)]',  bgClass: 'bg-[rgba(74,222,128,0.1)]',  labelColor: '#4ade80', textColor: '#bbf7d0' },
  danger:  { icon: '🚫', label: 'DANGER',  borderClass: 'border-[rgba(248,113,113,0.3)]', bgClass: 'bg-[rgba(248,113,113,0.1)]', labelColor: '#f87171', textColor: '#fecaca' },
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
    <NodeViewWrapper className="my-6">
      <div className={`rounded-[10px] border ${config.borderClass} ${config.bgClass} p-4`}>
        <button
          type="button"
          onClick={cycleType}
          className="mb-2 flex items-center gap-1.5 font-[family-name:var(--font-inter)] text-[12px] font-bold uppercase tracking-[0.08em] hover:opacity-80"
          style={{ color: config.labelColor }}
          contentEditable={false}
        >
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </button>
        <NodeViewContent
          className="callout-content prose prose-sm max-w-none"
          style={{ color: config.textColor }}
        />
      </div>
    </NodeViewWrapper>
  )
}
