// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { convertHtmlToTiptap } from './html-to-tiptap.mjs'

// ─── Shared fixture ───────────────────────────────────────────────────────────

const minimalHtml = `<!DOCTYPE html><html><body>
<div class="banner-wrap"><div class="banner">
  <h1><span>Terraform</span> State Management</h1>
  <p class="banner-sub">Understanding how Terraform tracks infrastructure</p>
  <div class="banner-tags">
    <span class="tag tag-blue">terraform</span>
    <span class="tag tag-green">devops</span>
  </div>
</div></div>
<div class="layout"><main class="main">
  <section class="section" id="s1">
    <div class="section-header"><span class="section-num">01</span><h2>State Basics</h2></div>
    <p>Terraform state is a <strong>JSON file</strong>.</p>
  </section>
</main></div>
</body></html>`

// ─── Metadata extraction ──────────────────────────────────────────────────────

describe('metadata extraction', () => {
  it('extracts title from banner h1, joining span and text', () => {
    const { title } = convertHtmlToTiptap(minimalHtml)
    expect(title).toBe('Terraform State Management')
  })

  it('inserts a space between span and adjacent text node in h1', () => {
    const html = `<html><body><div class="banner"><h1><span>AWS Intro &amp; IAM</span>Identity and Access Management</h1></div><main class="main"></main></body></html>`
    const { title } = convertHtmlToTiptap(html)
    expect(title).toBe('AWS Intro & IAM Identity and Access Management')
  })

  it('extracts excerpt from .banner-sub', () => {
    const { excerpt } = convertHtmlToTiptap(minimalHtml)
    expect(excerpt).toBe('Understanding how Terraform tracks infrastructure')
  })

  it('extracts tag names from .banner-tags .tag', () => {
    const { tagNames } = convertHtmlToTiptap(minimalHtml)
    expect(tagNames).toEqual(['terraform', 'devops'])
  })

  it('falls back to empty string when banner has no h1', () => {
    const html = `<html><body><main class="main"></main></body></html>`
    const { title } = convertHtmlToTiptap(html)
    expect(title).toBe('')
  })
})

// ─── Basic block conversions ──────────────────────────────────────────────────

describe('heading conversion', () => {
  it('converts section h2 inside section-header to heading level 2', () => {
    const { content } = convertHtmlToTiptap(minimalHtml)
    const node = content.content.find(n => n.type === 'heading' && n.attrs.level === 2)
    expect(node).toMatchObject({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'State Basics' }],
    })
  })

  it('skips the .section-num span', () => {
    const { content } = convertHtmlToTiptap(minimalHtml)
    const hasNum = content.content.some(
      n => n.type === 'paragraph' && n.content?.[0]?.text === '01'
    )
    expect(hasNum).toBe(false)
  })

  it('converts bare h3 to heading level 3', () => {
    const html = `<html><body><main class="main"><h3>Sub section</h3></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({ type: 'heading', attrs: { level: 3 } })
  })
})

describe('paragraph conversion', () => {
  it('converts p to paragraph node with inline text', () => {
    const { content } = convertHtmlToTiptap(minimalHtml)
    const para = content.content.find(n => n.type === 'paragraph')
    expect(para).toBeDefined()
  })

  it('applies bold mark to <strong> content', () => {
    const { content } = convertHtmlToTiptap(minimalHtml)
    const para = content.content.find(n => n.type === 'paragraph')
    const bold = para?.content?.find(n => n.marks?.some(m => m.type === 'bold'))
    expect(bold?.text).toBe('JSON file')
  })

  it('applies italic mark to <em> content', () => {
    const html = `<html><body><main class="main"><p><em>note</em></p></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    const italic = content.content[0]?.content?.find(n => n.marks?.some(m => m.type === 'italic'))
    expect(italic?.text).toBe('note')
  })

  it('applies code mark to inline <code>', () => {
    const html = `<html><body><main class="main"><p>run <code>terraform init</code></p></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    const codeMark = content.content[0]?.content?.find(n => n.marks?.some(m => m.type === 'code'))
    expect(codeMark?.text).toBe('terraform init')
  })

  it('applies link mark to <a>', () => {
    const html = `<html><body><main class="main"><p><a href="https://example.com">docs</a></p></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    const link = content.content[0]?.content?.find(n => n.marks?.some(m => m.type === 'link'))
    expect(link?.marks?.find(m => m.type === 'link')?.attrs?.href).toBe('https://example.com')
  })
})

// ─── Lists ────────────────────────────────────────────────────────────────────

describe('list conversion', () => {
  it('converts ul to bulletList with listItems', () => {
    const html = `<html><body><main class="main"><ul><li>Alpha</li><li>Beta</li></ul></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Alpha' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Beta' }] }] },
      ],
    })
  })

  it('converts ol to orderedList', () => {
    const html = `<html><body><main class="main"><ol><li>First</li></ol></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0].type).toBe('orderedList')
  })
})

// ─── Code block ───────────────────────────────────────────────────────────────

describe('code block conversion', () => {
  it('extracts language (lowercased, before —) and code text', () => {
    const html = `<html><body><main class="main">
      <div class="code-block">
        <div class="code-header"><span class="code-lang">BASH — run the command</span><button>copy</button></div>
        <pre>echo hello</pre>
      </div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({
      type: 'codeBlock',
      attrs: { language: 'bash' },
      content: [{ type: 'text', text: 'echo hello' }],
    })
  })

  it('handles code-lang with no separator', () => {
    const html = `<html><body><main class="main">
      <div class="code-block"><div class="code-header"><span class="code-lang">YAML</span></div><pre>key: value</pre></div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0].attrs.language).toBe('yaml')
  })
})

// ─── Callouts ─────────────────────────────────────────────────────────────────

describe('callout conversion', () => {
  it.each([
    ['callout-info', 'info'],
    ['callout-warn', 'warning'],
    ['callout-danger', 'danger'],
    ['callout-success', 'tip'],
  ])('.%s maps to callout type %s', (cls, expectedType) => {
    const html = `<html><body><main class="main"><div class="callout ${cls}"><div class="callout-label">Label</div><p>Content</p></div></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({ type: 'callout', attrs: { type: expectedType } })
  })

  it('skips the .callout-label inside callout', () => {
    const html = `<html><body><main class="main"><div class="callout callout-info"><div class="callout-label">Note</div><p>Real content</p></div></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    const calloutContent = content.content[0]?.content
    const hasLabel = calloutContent?.some(n => n.content?.[0]?.text === 'Note')
    expect(hasLabel).toBe(false)
  })

  it('converts .analogy to analogy node with label attr', () => {
    const html = `<html><body><main class="main"><div class="analogy"><div class="analogy-label">Analogy</div><p>Like a ledger</p></div></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({ type: 'analogy', attrs: { label: 'Analogy' } })
  })

  it('converts .summary-box to summaryBox node', () => {
    const html = `<html><body><main class="main"><div class="summary-box"><div class="summary-title">// Summary</div><ul><li>Key point</li></ul></div></main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({ type: 'summaryBox', attrs: { title: '// Summary' } })
  })
})

// ─── Flow steps ───────────────────────────────────────────────────────────────

describe('flow conversion', () => {
  it('converts .flow to flowList with flowItem per .flow-step', () => {
    const html = `<html><body><main class="main">
      <div class="flow">
        <div class="flow-step"><div class="flow-num">1</div><div class="flow-content"><strong>Init</strong><p>Run terraform init</p></div></div>
        <div class="flow-step"><div class="flow-num">2</div><div class="flow-content"><strong>Plan</strong><p>Run terraform plan</p></div></div>
      </div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0].type).toBe('flowList')
    expect(content.content[0].content).toHaveLength(2)
    expect(content.content[0].content[0]).toMatchObject({ type: 'flowItem', attrs: { step: 1 } })
    expect(content.content[0].content[1]).toMatchObject({ type: 'flowItem', attrs: { step: 2 } })
  })
})

// ─── Table ────────────────────────────────────────────────────────────────────

describe('table conversion', () => {
  it('converts table to table node with rows and cells', () => {
    const html = `<html><body><main class="main">
      <div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Value</th></tr></thead>
        <tbody><tr><td>foo</td><td>bar</td></tr></tbody>
      </table></div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    const table = content.content[0]
    expect(table.type).toBe('table')
    expect(table.content).toHaveLength(2)
    expect(table.content[0].content[0].type).toBe('tableHeader')
    expect(table.content[1].content[0].type).toBe('tableCell')
  })
})

// ─── Two-col mini cards ───────────────────────────────────────────────────────

describe('two-col mini cards', () => {
  it('converts .two-col to twoCol with miniCard children', () => {
    const html = `<html><body><main class="main">
      <div class="two-col">
        <div class="mini-card"><h5>Card A</h5><p>Content A</p></div>
        <div class="mini-card"><h5>Card B</h5><p>Content B</p></div>
      </div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0].type).toBe('twoCol')
    expect(content.content[0].content).toHaveLength(2)
    expect(content.content[0].content[0].type).toBe('miniCard')
    expect(content.content[0].content[0].content[0]).toMatchObject({
      type: 'heading',
      attrs: { level: 5 },
      content: [{ type: 'text', text: 'Card A' }],
    })
  })
})

// ─── SVG diagram ─────────────────────────────────────────────────────────────

describe('SVG diagram', () => {
  it('converts .diagram-wrap to diagram node with svgHtml', () => {
    const html = `<html><body><main class="main">
      <div class="diagram-wrap">
        <div class="diagram-title">Flow</div>
        <svg viewBox="0 0 100 50"><rect width="100" height="50"/></svg>
      </div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content[0]).toMatchObject({ type: 'diagram', attrs: { title: 'Flow' } })
    expect(content.content[0].attrs.svgHtml).toContain('<svg')
  })
})

// ─── Skipped elements ─────────────────────────────────────────────────────────

describe('task box', () => {
  it('converts .task-box to taskBox with body content', () => {
    const html = `<html><body><main class="main">
      <p>Keep this</p>
      <div class="task-box">
        <div class="task-header">
          <span class="task-badge">Lab</span>
          <span class="task-title">Try it</span>
          <span class="task-diff diff-2">Medium</span>
          <span class="task-time">20 min</span>
        </div>
        <div class="task-body"><p>Do the thing</p></div>
      </div>
    </main></body></html>`
    const { content } = convertHtmlToTiptap(html)
    expect(content.content).toHaveLength(2)
    expect(content.content[1]).toMatchObject({
      type: 'taskBox',
      attrs: { badge: 'Lab', taskTitle: 'Try it', difficulty: '2', timeEstimate: '20 min' },
    })
    expect(content.content[1].content[0].type).toBe('paragraph')
  })
})
