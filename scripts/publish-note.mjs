#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { convertHtmlToTiptap } from './html-to-tiptap.mjs'

// Load .env.local from project root
config({ path: resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const IMPORT_EMAIL = process.env.IMPORT_EMAIL
const IMPORT_PASSWORD = process.env.IMPORT_PASSWORD

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function estimateReadingTime(content) {
  const words = JSON.stringify(content).split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

async function main() {
  // ─── 1. Validate args ────────────────────────────────────────────────────────
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: node scripts/publish-note.mjs <path-to-html-file>')
    process.exit(1)
  }

  const absolutePath = resolve(filePath)
  if (!existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`)
    process.exit(1)
  }

  // ─── 2. Parse HTML ───────────────────────────────────────────────────────────
  const html = readFileSync(absolutePath, 'utf-8')
  const fileTitle = basename(absolutePath, '.html').replace(/-/g, ' ')
  const { title: parsedTitle, excerpt, tagNames, content } = convertHtmlToTiptap(html)
  const title = parsedTitle || fileTitle

  console.log(`\nParsed: "${title}"`)
  console.log(`Excerpt: ${excerpt || '(none)'}`)
  console.log(`Tags found in HTML: ${tagNames.join(', ') || '(none)'}`)

  // ─── 3. Supabase auth ────────────────────────────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }
  if (!IMPORT_EMAIL || !IMPORT_PASSWORD) {
    console.error('Missing IMPORT_EMAIL or IMPORT_PASSWORD in .env.local')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { error: authError } = await supabase.auth.signInWithPassword({
    email: IMPORT_EMAIL,
    password: IMPORT_PASSWORD,
  })

  if (authError) {
    console.error(`Authentication failed: ${authError.message}`)
    console.error('Check IMPORT_EMAIL / IMPORT_PASSWORD in .env.local')
    process.exit(1)
  }

  // ─── 4–8. Post-auth operations (always sign out on exit) ────────────────────
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error(`Failed to get authenticated user: ${userError?.message ?? 'unknown error'}`)
      process.exit(1)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'author') {
      console.error(`User does not have author role (current role: ${profile?.role ?? 'unknown'})`)
      process.exit(1)
    }

    // ─── 5. Match tags ─────────────────────────────────────────────────────────
    const { data: allTags } = await supabase.from('tags').select('id, name')
    const tagIds = (allTags ?? [])
      .filter(t => tagNames.some(n => n.toLowerCase() === t.name.toLowerCase()))
      .map(t => t.id)

    console.log(`Tags matched in DB: ${tagIds.length}/${tagNames.length}`)

    // ─── 6. Insert post ────────────────────────────────────────────────────────
    const slug = `${slugify(title) || 'untitled'}-${Date.now()}`

    const { data: post, error: insertError } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        excerpt: excerpt || null,
        slug,
        status: 'draft',
        author_id: user.id,
        reading_time_mins: estimateReadingTime(content),
        published_at: null,
      })
      .select('id, slug')
      .single()

    if (insertError || !post) {
      console.error(`Failed to create post: ${insertError?.message ?? 'unknown error'}`)
      process.exit(1)
    }

    // ─── 7. Insert post tags ───────────────────────────────────────────────────
    if (tagIds.length > 0) {
      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(tagIds.map(tag_id => ({ post_id: post.id, tag_id })))
      if (tagError) console.warn(`Warning: tags insert failed: ${tagError.message}`)
    }

    // ─── 8. Done ───────────────────────────────────────────────────────────────
    console.log('\n✓ Draft saved!')
    console.log(`  Title:  ${title}`)
    console.log(`  Slug:   ${slug}`)
    console.log(`  Review: https://the-devops-ledger.vercel.app/dashboard`)
  } finally {
    await supabase.auth.signOut()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
