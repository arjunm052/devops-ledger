'use client'

import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'

export function RawHtmlNodeView({ node }: NodeViewProps) {
  return (
    <NodeViewWrapper>
      <div dangerouslySetInnerHTML={{ __html: (node.attrs.html as string) ?? '' }} />
    </NodeViewWrapper>
  )
}
