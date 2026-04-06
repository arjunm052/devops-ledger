'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/core'
import { GripVertical } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DragHandleProps {
  editor: Editor | null
}

interface HandleState {
  visible: boolean
  top: number
  dragPos: number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DragHandle({ editor }: DragHandleProps) {
  const [state, setState] = useState<HandleState>({
    visible: false,
    top: 0,
    dragPos: null,
  })
  const draggedNodeRef = useRef<Element | null>(null)
  const rafRef = useRef<number | null>(null)

  const updateHandle = useCallback(
    (clientX: number, clientY: number) => {
      if (!editor) return

      const view = editor.view
      const editorEl = view.dom as HTMLElement
      const rect = editorEl.getBoundingClientRect()

      // Only show when cursor is within -40px to +20px of the editor left edge
      const distFromLeft = clientX - rect.left
      if (distFromLeft < -40 || distFromLeft > 20) {
        setState((s) => ({ ...s, visible: false }))
        return
      }

      // Find nearest pos in the editor
      const pos = view.posAtCoords({ left: rect.left + 4, top: clientY })
      if (!pos) {
        setState((s) => ({ ...s, visible: false }))
        return
      }

      // Walk up to find the top-level block node
      const $pos = view.state.doc.resolve(pos.pos)
      let depth = $pos.depth
      while (depth > 1) depth--

      const nodePos = depth === 0 ? 0 : $pos.before(depth)
      const domNode = view.nodeDOM(nodePos) as HTMLElement | null
      if (!domNode) {
        setState((s) => ({ ...s, visible: false }))
        return
      }

      const nodeRect = domNode.getBoundingClientRect()
      const editorTop = editorEl.getBoundingClientRect().top
      const top = nodeRect.top - editorTop

      setState({ visible: true, top, dragPos: nodePos })
    },
    [editor]
  )

  useEffect(() => {
    if (!editor) return

    const editorEl = editor.view.dom as HTMLElement
    const parent = editorEl.parentElement
    if (!parent) return

    function onMouseMove(e: MouseEvent) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        updateHandle(e.clientX, e.clientY)
      })
    }

    function onMouseLeave() {
      setState((s) => ({ ...s, visible: false }))
    }

    parent.addEventListener('mousemove', onMouseMove)
    parent.addEventListener('mouseleave', onMouseLeave)

    return () => {
      parent.removeEventListener('mousemove', onMouseMove)
      parent.removeEventListener('mouseleave', onMouseLeave)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [editor, updateHandle])

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!editor || state.dragPos === null) return

      const view = editor.view
      const domNode = view.nodeDOM(state.dragPos) as HTMLElement | null
      if (!domNode) return

      draggedNodeRef.current = domNode
      domNode.style.opacity = '0.4'

      // Set drag data so ProseMirror knows what's being dragged
      const slice = view.state.doc.slice(state.dragPos, state.dragPos + 1)
      try {
        const json = JSON.stringify(slice.toJSON())
        e.dataTransfer.setData('application/prosemirror', json)
        e.dataTransfer.effectAllowed = 'move'
      } catch {
        // ignore serialization errors
      }
    },
    [editor, state.dragPos]
  )

  const handleDragEnd = useCallback(() => {
    if (draggedNodeRef.current) {
      ;(draggedNodeRef.current as HTMLElement).style.opacity = ''
      draggedNodeRef.current = null
    }
  }, [])

  if (!editor || !state.visible) return null

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ top: state.top }}
      className="absolute -left-8 z-10 flex size-5 cursor-grab items-center justify-center rounded text-[var(--color-muted-text)] opacity-60 transition-opacity hover:opacity-100 active:cursor-grabbing"
      title="Drag to reorder"
    >
      <GripVertical size={14} />
    </div>
  )
}
