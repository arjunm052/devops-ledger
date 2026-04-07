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
  const SKIP = ['callout-label', 'summary-title', 'analogy-label']
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

function flowListNode($, el) {
  const items = []
  $(el).find('.flow-step').each((_, step) => {
    const title = $(step).find('.flow-content strong').first().text().trim()
    const desc = $(step).find('.flow-content p').first().text().trim()
    const inlineContent = []
    if (title) inlineContent.push({ type: 'text', text: title, marks: [{ type: 'bold' }] })
    if (title && desc) inlineContent.push({ type: 'text', text: ` — ${desc}` })
    else if (desc) inlineContent.push({ type: 'text', text: desc })
    items.push({
      type: 'listItem',
      content: [{ type: 'paragraph', content: inlineContent }],
    })
  })
  return { type: 'orderedList', content: items }
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

function rawHtmlNode($, el) {
  const svg = $(el).find('svg')
  if (!svg.length) return null
  return { type: 'rawHtml', attrs: { html: $.html(svg) } }
}

function twoColNodes($, el) {
  const nodes = []
  $(el).find('.mini-card').each((_, card) => {
    const title = $(card).find('h5').text().trim()
    if (title) nodes.push(headingNode(title, 4))
    $(card).children().each((_, child) => {
      if (child.tagName?.toLowerCase() === 'h5') return
      const node = convertBlock($, child)
      if (node) nodes.push(node)
    })
  })
  return nodes
}

// ─── Block dispatcher ─────────────────────────────────────────────────────────

function convertBlock($, el) {
  if (!el || el.type !== 'tag') return null

  const tag = el.tagName.toLowerCase()
  const cls = ($(el).attr('class') ?? '').split(' ')

  if (cls.includes('task-box')) return null
  if (cls.includes('section-num')) return null

  if (tag === 'h2') return headingNode($(el).text().trim(), 2)
  if (tag === 'h3') return headingNode($(el).text().trim(), 3)
  if (tag === 'h4' || tag === 'h5') return headingNode($(el).text().trim(), 4)

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

  if (cls.includes('analogy')) return calloutNode($, el, 'tip')
  if (cls.includes('summary-box')) return calloutNode($, el, 'info')

  if (cls.includes('flow')) return flowListNode($, el)

  if (tag === 'table') return tableNode($, el)
  if (cls.includes('table-wrap')) return tableNode($, el)

  if (cls.includes('diagram-wrap')) return rawHtmlNode($, el)

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
      nodes.push(...twoColNodes($, el))
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

  const title = $('.banner h1').text().replace(/\s+/g, ' ').trim()
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
      contentNodes.push(...twoColNodes($, el))
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
