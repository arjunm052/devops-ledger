'use client'

import { useEditor, EditorContent, type Content } from '@tiptap/react'
import { createEditorExtensions } from '@/lib/tiptap/editor-extensions'

interface TiptapRendererProps {
  // Tiptap JSON document — typed as unknown to accept Supabase's Json type
  content: unknown
}

export default function TiptapRenderer({ content }: TiptapRendererProps) {
  const editor = useEditor({
    extensions: createEditorExtensions({ linkOpenOnClick: true }),
    content: content as Content,
    editable: false,
    immediatelyRender: false,
  })

  return (
    <div
      className={[
        'prose prose-lg max-w-none',
        'prose-headings:font-[family-name:var(--font-space-grotesk)]',
        'prose-p:font-[family-name:var(--font-newsreader)]',
        'prose-pre:bg-slate-900 prose-pre:text-slate-100',
      ].join(' ')}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
