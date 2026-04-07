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
        'prose prose-lg prose-invert max-w-none',
        'prose-headings:font-[family-name:var(--font-space-grotesk)] prose-headings:text-[var(--color-heading)]',
        'prose-p:font-[family-name:var(--font-newsreader)] prose-p:text-[var(--color-body)] prose-p:leading-[1.8]',
        'prose-li:font-[family-name:var(--font-newsreader)] prose-li:text-[var(--color-body)]',
        'prose-strong:text-[var(--color-heading)]',
        'prose-a:text-[var(--color-link)] hover:prose-a:text-[var(--color-link-hover)]',
        'prose-code:text-[#e8b87a] prose-code:bg-[rgba(232,184,122,0.1)] prose-code:border prose-code:border-[rgba(232,184,122,0.15)] prose-code:rounded-md prose-code:px-1.5 prose-code:py-0.5 prose-code:font-[family-name:var(--font-jetbrains-mono)] prose-code:text-[13px] prose-code:font-normal prose-code:before:content-none prose-code:after:content-none',
        'prose-blockquote:border-l-[var(--color-link)] prose-blockquote:text-[var(--color-muted-text)]',
        'prose-pre:bg-transparent prose-pre:p-0',
        '[&_pre_code]:bg-transparent [&_pre_code]:border-0 [&_pre_code]:p-0 [&_pre_code]:text-inherit [&_pre_code]:text-sm [&_pre_code]:rounded-none',
        '[&_.code-block-wrapper_code]:bg-transparent [&_.code-block-wrapper_code]:border-0 [&_.code-block-wrapper_code]:p-0 [&_.code-block-wrapper_code]:text-[#abb2bf] [&_.code-block-wrapper_code]:text-sm [&_.code-block-wrapper_code]:rounded-none',
        '[&_.code-block-wrapper_code]:before:content-none [&_.code-block-wrapper_code]:after:content-none',
        // Task lists
        '[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0',
        '[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:gap-2 [&_ul[data-type=taskList]_li]:items-start',
        '[&_ul[data-type=taskList]_li_label]:mt-1 [&_ul[data-type=taskList]_li_input]:pointer-events-none',
        // Highlight
        '[&_mark]:bg-[rgba(255,184,108,0.3)] [&_mark]:rounded-sm [&_mark]:px-0.5',
        // Images + captions
        '[&_figure]:my-6 [&_figure]:text-center',
        '[&_figure_img]:mx-auto [&_figure_img]:h-auto [&_figure_img]:rounded-md',
        '[&_figure_figcaption]:mt-2 [&_figure_figcaption]:font-[family-name:var(--font-inter)] [&_figure_figcaption]:text-sm [&_figure_figcaption]:italic [&_figure_figcaption]:text-[var(--color-muted-text)]',
      ].join(' ')}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
