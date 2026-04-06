'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { Copy, Check } from 'lucide-react'
import { lowlight } from '@/lib/tiptap/editor-extensions'

export const LANGUAGE_NAMES: Record<string, string> = {
  typescript: 'TypeScript', javascript: 'JavaScript', python: 'Python',
  go: 'Go', rust: 'Rust', java: 'Java', bash: 'Bash', shell: 'Shell',
  yaml: 'YAML', dockerfile: 'Dockerfile', nginx: 'Nginx',
  json: 'JSON', toml: 'TOML', ini: 'INI',
  powershell: 'PowerShell', css: 'CSS', html: 'HTML', sql: 'SQL',
  xml: 'XML', ruby: 'Ruby', php: 'PHP', c: 'C', cpp: 'C++',
}

export function CodeBlockNodeView({ node, updateAttributes, editor }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [editingFilename, setEditingFilename] = useState(false)
  const filenameRef = useRef<HTMLInputElement>(null)
  const detectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filename = node.attrs.filename || ''
  const isEditable = editor.isEditable

  // Auto-detect language on content change (for syntax highlighting only; never shown in UI)
  useEffect(() => {
    if (!isEditable) return
    if (detectionTimer.current) clearTimeout(detectionTimer.current)
    detectionTimer.current = setTimeout(() => {
      const text = node.textContent
      // Only auto-detect for multi-line content with enough text
      // Short one-liners produce unreliable results
      const lines = text.split('\n').filter(Boolean).length
      if (!text || text.length < 30 || lines < 2) {
        return
      }
      try {
        const result = lowlight.highlightAuto(text, { subset: Object.keys(LANGUAGE_NAMES) })
        const data = result.data as { language?: string; relevance?: number } | undefined
        const lang = data?.language
        const relevance = data?.relevance ?? 0
        // Only accept detection with a meaningful relevance score
        if (lang && relevance >= 3) {
          updateAttributes({ language: lang })
        }
      } catch {
        // Ignore detection errors
      }
    }, 800)
    return () => {
      if (detectionTimer.current) clearTimeout(detectionTimer.current)
    }
  }, [node.textContent, updateAttributes, isEditable])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [node.textContent])

  const handleFilenameSubmit = useCallback(() => {
    setEditingFilename(false)
  }, [])

  const lineCount = node.textContent.split('\n').length

  return (
    <NodeViewWrapper className="code-block-wrapper my-4">
      <div className="overflow-hidden rounded-lg border border-[#3e4451] bg-[#282c34]">
        {/* Header: filename only while editing; read-only shows copy only (no language/filename chrome) */}
        <div
          className={`flex items-center border-b border-[#3e4451] bg-[#21252b] px-3 py-1.5 ${isEditable ? 'justify-between' : 'justify-end'}`}
        >
          {isEditable ? (
            <div className="flex items-center gap-2">
              {editingFilename ? (
                <input
                  ref={filenameRef}
                  type="text"
                  defaultValue={filename}
                  placeholder="filename.ext"
                  className="bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#abb2bf] outline-none placeholder:text-[#636d83]"
                  autoFocus
                  onBlur={(e) => {
                    updateAttributes({ filename: e.target.value || null })
                    handleFilenameSubmit()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateAttributes({ filename: (e.target as HTMLInputElement).value || null })
                      handleFilenameSubmit()
                    }
                    if (e.key === 'Escape') handleFilenameSubmit()
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingFilename(true)}
                  className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#abb2bf] hover:text-[#61afef]"
                  contentEditable={false}
                >
                  {filename || 'Add filename\u2026'}
                </button>
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-3" contentEditable={false}>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1 text-[11px] text-[#61afef] transition-colors hover:text-[#528bff]"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        {/* Code area with line numbers */}
        <div className="flex overflow-x-auto p-4">
          <div
            className="select-none pr-4 text-right font-[family-name:var(--font-jetbrains-mono)] text-xs leading-[1.7] text-[#636d83]"
            contentEditable={false}
            aria-hidden
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <NodeViewContent<'code'>
            as="code"
            className="flex-1 font-[family-name:var(--font-jetbrains-mono)] text-sm leading-[1.7] text-[#abb2bf] outline-none"
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
