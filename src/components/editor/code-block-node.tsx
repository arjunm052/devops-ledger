'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react'
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

  useEffect(() => {
    if (!isEditable) return
    if (detectionTimer.current) clearTimeout(detectionTimer.current)
    detectionTimer.current = setTimeout(() => {
      const text = node.textContent
      const lines = text.split('\n').filter(Boolean).length
      if (!text || text.length < 30 || lines < 2) {
        return
      }
      try {
        const result = lowlight.highlightAuto(text, { subset: Object.keys(LANGUAGE_NAMES) })
        const data = result.data as { language?: string; relevance?: number } | undefined
        const lang = data?.language
        const relevance = data?.relevance ?? 0
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
    void navigator.clipboard.writeText(node.textContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [node.textContent])

  const handleFilenameSubmit = useCallback(() => {
    setEditingFilename(false)
  }, [])

  const language = node.attrs.language as string | null
  const langDisplay = language ? LANGUAGE_NAMES[language] ?? language.toUpperCase() : null

  return (
    <NodeViewWrapper className="code-block-wrapper my-5">
      <div className="code-block overflow-hidden rounded-[10px] border border-[#2a3044]">
        <div className="code-header flex items-center justify-between bg-[#0d1117] px-[14px] py-[7px]">
          <div className="flex min-w-0 flex-1 items-center gap-2" contentEditable={false}>
            {langDisplay ? (
              <span className="code-lang shrink-0 font-[family-name:var(--font-jetbrains-mono)] text-[10px] font-medium uppercase tracking-[0.06em] text-[#60a5fa] bg-[rgba(96,165,250,0.12)] px-[7px] py-[2px] rounded-[3px]">
                {langDisplay}
              </span>
            ) : null}
            {isEditable ? (
              editingFilename ? (
                <input
                  ref={filenameRef}
                  type="text"
                  defaultValue={filename}
                  placeholder="filename.ext"
                  className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-[#e2e8f0] outline-none placeholder:text-[#636d83]"
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
                  className="truncate font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-[#4b5a78] hover:text-[#60a5fa]"
                  contentEditable={false}
                >
                  {filename || (langDisplay ? '' : 'Add filename…')}
                </button>
              )
            ) : null}
          </div>
          <button
            type="button"
            onClick={copyCode}
            className="code-copy shrink-0 rounded-[3px] border border-[#2a3044] px-2 py-[2px] font-[family-name:var(--font-jetbrains-mono)] text-[10px] text-[#4b5a78] transition-colors hover:border-[#60a5fa] hover:text-[#60a5fa]"
            contentEditable={false}
          >
            {copied ? 'copied!' : 'copy'}
          </button>
        </div>
        <pre className="hljs m-0 overflow-x-auto bg-[#0d1117] px-[1.4rem] py-5 font-[family-name:var(--font-jetbrains-mono)] text-[13px] leading-[1.85] text-[#e2e8f0]">
          <NodeViewContent<'code'>
            as="code"
            className="block min-h-[1.25em] w-max min-w-full bg-transparent p-0 font-[family-name:var(--font-jetbrains-mono)] text-[13px] leading-[1.85] text-inherit outline-none"
          />
        </pre>
      </div>
    </NodeViewWrapper>
  )
}
