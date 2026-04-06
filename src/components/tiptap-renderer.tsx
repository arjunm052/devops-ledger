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
        'prose-p:font-[family-name:var(--font-newsreader)] prose-p:leading-[1.8]',
        'prose-li:font-[family-name:var(--font-newsreader)] prose-li:text-[var(--color-body)]',
        // Task lists
        '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0',
        '[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start',
        '[&_ul[data-type=taskList]_li_label]:mt-1 [&_ul[data-type=taskList]_li_input]:pointer-events-none',
        // Highlight
        '[&_mark]:bg-[rgba(255,184,108,0.3)] [&_mark]:rounded-sm [&_mark]:px-0.5',
      ].join(' ')}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
