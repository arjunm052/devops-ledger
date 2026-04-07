'use client'

import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import type { CalloutType } from '@/lib/tiptap/callout-extension'

/** Template classes: callout-warn, callout-success (green), etc. */
const CALLOUT_CLASS: Record<CalloutType, string> = {
  info: 'callout-info',
  warning: 'callout-warn',
  tip: 'callout-success',
  danger: 'callout-danger',
}

const CALLOUT_LABEL: Record<CalloutType, string> = {
  info: 'Info',
  warning: 'Warning',
  tip: 'Tip',
  danger: 'Danger',
}

const TYPE_ORDER: CalloutType[] = ['info', 'warning', 'tip', 'danger']

export function CalloutNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const calloutType = (node.attrs.type || 'info') as CalloutType
  const customLabel = node.attrs.label as string | null
  const variantClass = CALLOUT_CLASS[calloutType]
  const editable = editor.isEditable

  const cycleType = () => {
    const idx = TYPE_ORDER.indexOf(calloutType)
    const next = TYPE_ORDER[(idx + 1) % TYPE_ORDER.length]
    updateAttributes({ type: next })
  }

  const displayLabel = customLabel || CALLOUT_LABEL[calloutType]

  return (
    <NodeViewWrapper className="my-6">
      <div
        className={`callout ${variantClass}`}
        data-callout-type={calloutType}
      >
        <div
          className="callout-label flex w-full items-center gap-1.5 text-left"
          contentEditable={false}
        >
          {editable ? (
            <>
              <button
                type="button"
                onClick={cycleType}
                className="cursor-pointer hover:opacity-90"
              >
                <span>{displayLabel}</span>
              </button>
            </>
          ) : (
            <span>{displayLabel}</span>
          )}
        </div>
        <NodeViewContent className="callout-content max-w-none [&_p]:text-inherit [&_li]:text-inherit" />
      </div>
    </NodeViewWrapper>
  )
}
