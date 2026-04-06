'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
import { Copy, Check } from 'lucide-react'
import { lowlight } from '@/lib/tiptap/editor-extensions'

const LANGUAGE_NAMES: Record<string, string> = {
  typescript: 'TypeScript', javascript: 'JavaScript', python: 'Python',
  go: 'Go', rust: 'Rust', java: 'Java', bash: 'Bash', shell: 'Shell',
  yaml: 'YAML', dockerfile: 'Dockerfile', nginx: 'Nginx',
  json: 'JSON', toml: 'TOML', ini: 'INI',
  powershell: 'PowerShell', css: 'CSS', html: 'HTML', sql: 'SQL',
  xml: 'XML', ruby: 'Ruby', php: 'PHP', c: 'C', cpp: 'C++',
}

export function CodeBlockNodeView({ node, updateAttributes, extension }: NodeViewProps) {
  const [copied, setCopied] = useState(false)
  const [editingFilename, setEditingFilename] = useState(false)
  const filenameRef = useRef<HTMLInputElement>(null)
  const detectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const language = node.attrs.language || extension.options.defaultLanguage || ''
  const filename = node.attrs.filename || ''
  const displayLang = LANGUAGE_NAMES[language] || language || 'Plain Text'

  // Auto-detect language on content change
  useEffect(() => {
    if (node.attrs.language) return
    if (detectionTimer.current) clearTimeout(detectionTimer.current)
    detectionTimer.current = setTimeout(() => {
      const text = node.textContent
      if (!text || text.length < 10) return
      try {
        const result = lowlight.highlightAuto(text)
        if (result.data && typeof result.data === 'object' && 'language' in result.data) {
          const detected = (result.data as { language: string }).language
          if (detected && detected !== language) {
            updateAttributes({ language: detected })
          }
        }
      } catch {
        // Ignore detection errors
      }
    }, 500)
    return () => {
      if (detectionTimer.current) clearTimeout(detectionTimer.current)
    }
  }, [node.textContent, node.attrs.language, language, updateAttributes])

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
      <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0d1117]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5">
          <div className="flex items-center gap-2">
            {editingFilename ? (
              <input
                ref={filenameRef}
                type="text"
                defaultValue={filename}
                placeholder="filename.ext"
                className="bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#c9d1d9] outline-none placeholder:text-[#484f58]"
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
                className="font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#c9d1d9] hover:text-[#58a6ff]"
                contentEditable={false}
              >
                {filename || 'Add filename\u2026'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3" contentEditable={false}>
            <span className="rounded-md bg-[rgba(255,255,255,0.06)] px-2 py-0.5 font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-[#8b949e]">
              {displayLang}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1 text-[11px] text-[#58a6ff] transition-colors hover:text-[#79c0ff]"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        {/* Code area with line numbers */}
        <div className="flex overflow-x-auto p-4">
          <div
            className="select-none pr-4 text-right font-[family-name:var(--font-jetbrains-mono)] text-xs leading-[1.7] text-[#484f58]"
            contentEditable={false}
            aria-hidden
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <NodeViewContent<'code'>
            as="code"
            className="flex-1 font-[family-name:var(--font-jetbrains-mono)] text-sm leading-[1.7] text-[#c9d1d9] outline-none"
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}
