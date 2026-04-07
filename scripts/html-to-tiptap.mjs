import { load } from 'cheerio'

// ─── Inline content ───────────────────────────────────────────────────────────

function inlineNodes($, el) {
  const nodes = []
  $(el).contents().each((_, node) => {
    if (node.type === 'text') {
      const text = node.data ?? ''
      if (text) nodes.push({ type: 'text', text })
      return
    }
    if (node.type !== 'tag') return

    const tag = node.tagName.toLowerCase()

    if (tag === 'strong' || tag === 'b') {
      inlineNodes($, node).forEach(n => {
        nodes.push({ ...n, marks: [...(n.marks ?? []), { type: 'bold' }] })
      })
    } else if (tag === 'em' || tag === 'i') {
      inlineNodes($, node).forEach(n => {
        nodes.push({ ...n, marks: [...(n.marks ?? []), { type: 'italic' }] })
      })
    } else if (tag === 'code') {
      const text = $(node).text()
      if (text) nodes.push({ type: 'text', text, marks: [{ type: 'code' }] })
    } else if (tag === 'a') {
      const href = $(node).attr('href') ?? ''
      inlineNodes($, node).forEach(n => {
        nodes.push({ ...n, marks: [...(n.marks ?? []), { type: 'link', attrs: { href } }] })
      })
    } else if (tag === 'br') {
      nodes.push({ type: 'hardBreak' })
    } else {
      nodes.push(...inlineNodes($, node))
    }
  })
  return nodes
}

// ─── Block builders ───────────────────────────────────────────────────────────

function paragraphNode($, el) {
  return { type: 'paragraph', content: inlineNodes($, el) }
}

function paragraphFromText(text) {
  return { type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }
}

function headingNode(text, level) {
  return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }
}

function listItemNode($, el) {
  return { type: 'listItem', content: [paragraphNode($, el)] }
}

function bulletListNode($, el) {
  const items = []
  $(el).children('li').each((_, li) => items.push(listItemNode($, li)))
  return { type: 'bulletList', content: items }
}

function orderedListNode($, el) {
  const items = []
  $(el).children('li').each((_, li) => items.push(listItemNode($, li)))
  return { type: 'orderedList', content: items }
}

function codeBlockNode($, el) {
  const langRaw = $(el).find('.code-lang').text().trim()
  const language = langRaw.split('—')[0].trim().toLowerCase() || null
  const code = $(el).find('pre').text()
  return {
    type: 'codeBlock',
    attrs: { language, filename: null },
    content: [{ type: 'text', text: code }],
  }
}

function calloutNode($, el, type) {
  const SKIP = ['callout-label']
  const blockContent = []

  $(el).children().each((_, child) => {
    const cls = ($(child).attr('class') ?? '').split(' ')
    if (cls.some(c => SKIP.includes(c))) return
    const node = convertBlock($, child)
    if (node) blockContent.push(node)
  })

  if (blockContent.length === 0) {
    const text = $(el).text().trim()
    blockContent.push(paragraphFromText(text))
  }

  return { type: 'callout', attrs: { type }, content: blockContent }
}

function analogyNode($, el) {
  const label = $(el).find('.analogy-label').first().text().trim() || 'Analogy'
  const blockContent = []
  $(el).children().each((_, child) => {
    const c = ($(child).attr('class') ?? '').split(' ')
    if (c.includes('analogy-label')) return
    const node = convertBlock($, child)
    if (node) blockContent.push(node)
  })
  if (blockContent.length === 0) blockContent.push(paragraphFromText(''))
  return { type: 'analogy', attrs: { label }, content: blockContent }
}

function summaryBoxNode($, el) {
  const title = $(el).find('.summary-title').first().text().trim() || '// Section summary'
  const blockContent = []
  $(el).children().each((_, child) => {
    const c = ($(child).attr('class') ?? '').split(' ')
    if (c.includes('summary-title')) return
    const node = convertBlock($, child)
    if (node) blockContent.push(node)
  })
  if (blockContent.length === 0) blockContent.push(paragraphFromText(''))
  return { type: 'summaryBox', attrs: { title }, content: blockContent }
}

function taskBoxNode($, el) {
  const badge = $(el).find('.task-badge').first().text().trim() || 'Practice'
  const taskTitle = $(el).find('.task-title').first().text().trim() || ''
  const diffEl = $(el).find('.task-diff').first()
  let difficulty = '1'
  if (diffEl.hasClass('diff-2')) difficulty = '2'
  else if (diffEl.hasClass('diff-3')) difficulty = '3'
  const timeEstimate = $(el).find('.task-time').first().text().trim() || ''
  const blockContent = []
  $(el).find('.task-body').children().each((_, child) => {
    const node = convertBlock($, child)
    if (node) blockContent.push(node)
  })
  if (blockContent.length === 0) blockContent.push(paragraphFromText(''))
  return {
    type: 'taskBox',
    attrs: { badge, taskTitle, difficulty, timeEstimate },
    content: blockContent,
  }
}

function flowListNode($, el) {
  const items = []
  $(el).children('.flow-step').each((_, step) => {
    const numText = $(step).find('.flow-num').first().text().trim()
    const stepNum = parseInt(numText, 10)
    const stepN = Number.isFinite(stepNum) ? stepNum : items.length + 1
    const body = []
    $(step).find('.flow-content').children().each((_, child) => {
      const node = convertBlock($, child)
      if (node) body.push(node)
    })
    if (body.length === 0) body.push(paragraphFromText(''))
    items.push({ type: 'flowItem', attrs: { step: stepN }, content: body })
  })
  if (items.length === 0) return null
  return { type: 'flowList', content: items }
}

function twoColNode($, el) {
  const cards = []
  $(el).children('.mini-card').each((_, card) => {
    const blockContent = []
    $(card).children().each((_, child) => {
      const node = convertBlock($, child)
      if (node) blockContent.push(node)
    })
    if (blockContent.length === 0) blockContent.push(paragraphFromText(''))
    cards.push({ type: 'miniCard', content: blockContent })
  })
  if (cards.length === 0) return null
  return { type: 'twoCol', content: cards }
}

function diagramNode($, el) {
  const title = $(el).find('.diagram-title').first().text().trim() || ''
  const svg = $(el).find('svg').first()
  const svgHtml = svg.length ? $.html(svg) : ''
  return { type: 'diagram', attrs: { title, svgHtml } }
}

function tableNode($, elOrWrap) {
  const table = elOrWrap.tagName === 'table'
    ? $(elOrWrap)
    : $(elOrWrap).find('table')
  const rows = []

  table.find('thead tr').each((_, tr) => {
    const cells = []
    $(tr).find('th').each((_, th) => {
      cells.push({
        type: 'tableHeader',
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [paragraphNode($, th)],
      })
    })
    if (cells.length) rows.push({ type: 'tableRow', content: cells })
  })

  table.find('tbody tr').each((_, tr) => {
    const cells = []
    $(tr).find('td').each((_, td) => {
      cells.push({
        type: 'tableCell',
        attrs: { colspan: 1, rowspan: 1, colwidth: null },
        content: [paragraphNode($, td)],
      })
    })
    if (cells.length) rows.push({ type: 'tableRow', content: cells })
  })

  return { type: 'table', content: rows }
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

function convertBlock($, el) {
  if (!el || el.type !== 'tag') return null

  const tag = el.tagName.toLowerCase()
  const cls = ($(el).attr('class') ?? '').split(' ')

  if (cls.includes('section-num')) return null

  if (tag === 'h2') return headingNode($(el).text().trim(), 2)
  if (tag === 'h3') return headingNode($(el).text().trim(), 3)
  if (tag === 'h4') return headingNode($(el).text().trim(), 4)
  if (tag === 'h5') return headingNode($(el).text().trim(), 5)

  if (tag === 'p') return paragraphNode($, el)

  if (tag === 'ul') return bulletListNode($, el)
  if (tag === 'ol') return orderedListNode($, el)

  if (cls.includes('code-block')) return codeBlockNode($, el)

  if (cls.includes('callout')) {
    if (cls.includes('callout-info')) return calloutNode($, el, 'info')
    if (cls.includes('callout-warn')) return calloutNode($, el, 'warning')
    if (cls.includes('callout-danger')) return calloutNode($, el, 'danger')
    if (cls.includes('callout-success')) return calloutNode($, el, 'tip')
    return calloutNode($, el, 'info')
  }

  if (cls.includes('analogy')) return analogyNode($, el)
  if (cls.includes('summary-box')) return summaryBoxNode($, el)
  if (cls.includes('task-box')) return taskBoxNode($, el)

  if (cls.includes('flow')) return flowListNode($, el)
  if (cls.includes('two-col')) return twoColNode($, el)

  if (tag === 'table') return tableNode($, el)
  if (cls.includes('table-wrap')) return tableNode($, el)

  if (cls.includes('diagram-wrap')) return diagramNode($, el)

  if (cls.includes('section-header')) {
    const h2 = $(el).find('h2')
    return h2.length ? headingNode(h2.text().trim(), 2) : null
  }

  return null
}

function convertSection($, section) {
  const nodes = []
  $(section).children().each((_, el) => {
    const cls = ($(el).attr('class') ?? '').split(' ')
    if (cls.includes('two-col')) {
      const n = twoColNode($, el)
      if (n) nodes.push(n)
      return
    }
    const node = convertBlock($, el)
    if (node) nodes.push(node)
  })
  return nodes
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function convertHtmlToTiptap(htmlString) {
  const $ = load(htmlString)

  const titleParts = []
  $('.banner h1').contents().each((_, node) => {
    const text = $(node).text().trim()
    if (text) titleParts.push(text)
  })
  const title = titleParts.join(' ').replace(/\s+/g, ' ').trim()
  const excerpt = $('.banner-sub').text().trim()

  const tagNames = []
  $('.banner-tags .tag').each((_, el) => {
    const t = $(el).text().trim()
    if (t) tagNames.push(t)
  })

  const contentNodes = []
  $('.main').children().each((_, el) => {
    if (!el || el.type !== 'tag') return
    const tag = el.tagName.toLowerCase()
    const cls = ($(el).attr('class') ?? '').split(' ')

    if (tag === 'section') {
      contentNodes.push(...convertSection($, el))
    } else if (cls.includes('two-col')) {
      const n = twoColNode($, el)
      if (n) contentNodes.push(n)
    } else {
      const node = convertBlock($, el)
      if (node) contentNodes.push(node)
    }
  })

  return {
    title,
    excerpt,
    tagNames,
    content: { type: 'doc', content: contentNodes },
  }
}
