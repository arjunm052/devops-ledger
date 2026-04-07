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

  const language = node.attrs.language as string | null
  const langDisplay = language ? LANGUAGE_NAMES[language] ?? language.toUpperCase() : null

  return (
    <NodeViewWrapper className="code-block-wrapper my-4">
      <div className="overflow-hidden rounded-lg border border-[#2a3044] bg-[#0d1117]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a3044] bg-[#0d1117] px-3 py-1.5">
          <div className="flex items-center gap-2" contentEditable={false}>
            {/* Language badge — always visible when language is known */}
            {langDisplay && (
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-medium uppercase tracking-[0.06em] rounded-[3px] bg-[rgba(96,165,250,0.12)] px-[7px] py-[2px] text-[#60a5fa]">
                {langDisplay}
              </span>
            )}
            {/* Filename (editor only) */}
            {isEditable && (
              editingFilename ? (
                <input
                  ref={filenameRef}
                  type="text"
                  defaultValue={filename}
                  placeholder="filename.ext"
                  className="bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#e2e8f0] outline-none placeholder:text-[#636d83]"
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
                  className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#4b5a78] hover:text-[#60a5fa]"
                  contentEditable={false}
                >
                  {filename || 'Add filename\u2026'}
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-3" contentEditable={false}>
            <button
              type="button"
              onClick={copyCode}
              className="rounded-[3px] border border-[#2a3044] px-2 py-[2px] font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-[#4b5a78] transition-colors hover:border-[#60a5fa] hover:text-[#60a5fa]"
            >
              {copied ? 'Copied!' : 'Copy'}
              {copied ? <Check className="ml-1 inline size-3" /> : <Copy className="ml-1 inline size-3" />}
            </button>
          </div>
        </div>
        {/* Code area with line numbers */}
        <div className="flex overflow-x-auto p-4">
          <div
            className="select-none pr-4 text-right font-[family-name:var(--font-jetbrains-mono)] text-xs leading-[1.85] text-[#636d83]"
            contentEditable={false}
            aria-hidden
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <NodeViewContent<'code'>
            as="code"
            className="flex-1 font-[family-name:var(--font-jetbrains-mono)] text-sm leading-[1.85] text-[#e2e8f0] outline-none"
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
