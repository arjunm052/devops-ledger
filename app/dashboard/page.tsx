import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deletePost } from '@/actions/posts'

export const metadata: Metadata = { title: 'Author Dashboard' }

// Icons (inline SVG to avoid Material Symbols dependency)
function IconArticle() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function IconClap() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 11V5a2 2 0 0 1 4 0v3m0 0V5a2 2 0 0 1 4 0v3m0 0V7a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7H9a6 6 0 0 1-6-6v-2a2 2 0 0 1 4 0" />
    </svg>
  )
}
function IconChat() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconDraft() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  )
}
function IconDelete() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6m4-6v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

interface DashboardPageProps {
  searchParams: Promise<{ filter?: string; page?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'author') redirect('/')

  // Fetch all author posts with stats
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id, title, slug, status, published_at, updated_at, created_at,
      tags:post_tags ( tag:tags ( id, name, slug ) ),
      claps ( count ),
      comments ( id )
    `)
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const allPosts = posts ?? []

  // Stats
  const totalPosts = allPosts.length
  const totalClaps = allPosts.reduce(
    (sum, p) => sum + p.claps.reduce((s: number, c: { count: number | null }) => s + (c.count ?? 0), 0),
    0
  )
  const totalComments = allPosts.reduce((sum, p) => sum + p.comments.length, 0)
  const draftsCount = allPosts.filter((p) => p.status === 'draft').length

  // Tab filter
  const { filter = 'all', page: pageStr = '1' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10) || 1)
  const perPage = 10
  const filteredPosts =
    filter === 'published' ? allPosts.filter((p) => p.status === 'published')
    : filter === 'drafts'    ? allPosts.filter((p) => p.status === 'draft')
    : allPosts

  const totalFiltered = filteredPosts.length
  const totalPages = Math.ceil(totalFiltered / perPage)
  const paginatedPosts = filteredPosts.slice((page - 1) * perPage, page * perPage)

  const tabClass = (tab: string) =>
    tab === (filter || 'all')
      ? 'px-6 py-1.5 rounded-full bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white shadow-sm text-sm font-medium'
      : 'px-6 py-1.5 rounded-full text-[var(--color-body)] hover:text-[var(--color-link)] transition-colors text-sm font-medium'

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto pt-12 pb-20 px-6">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-[var(--color-heading)]"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Author Dashboard
            </h1>
            <p className="text-[var(--color-body)] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
              Manage your writing, monitor performance, and engage with your readers.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="shrink-0 inline-flex items-center gap-2 bg-gradient-to-r from-[#0045ad] to-[#1a5dd5] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all active:scale-95"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            New Post
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Total Posts', value: totalPosts, sub: `${draftsCount} draft${draftsCount !== 1 ? 's' : ''}`, icon: <IconArticle /> },
            { label: 'Claps', value: formatCount(totalClaps), sub: 'Across all posts', icon: <IconClap /> },
            { label: 'Comments', value: formatCount(totalComments), sub: 'Across all posts', icon: <IconChat /> },
            { label: 'Drafts', value: draftsCount, sub: 'Ready to polish', icon: <IconDraft /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[var(--color-surface)] p-6 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className="text-xs font-bold uppercase tracking-widest text-[var(--color-body)]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {stat.label}
                </span>
                <span className="text-[#b2c5ff] opacity-70">{stat.icon}</span>
              </div>
              <div
                className="text-4xl font-bold text-[var(--color-heading)]"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs mt-2 text-[var(--color-muted-text)]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Posts Table */}
        <div className="bg-[var(--color-surface)] rounded-xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.2)]">

          {/* Table header with tabs */}
          <div className="p-8 bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2
                className="text-2xl font-bold text-[var(--color-heading)]"
                style={{ fontFamily: 'var(--font-space-grotesk)' }}
              >
                Your Posts
              </h2>
              <div
                className="flex items-center gap-1 bg-[var(--color-surface-dim)] p-1 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <Link href="/dashboard" className={tabClass('all')}>All</Link>
                <Link href="/dashboard?filter=published" className={tabClass('published')}>Published</Link>
                <Link href="/dashboard?filter=drafts" className={tabClass('drafts')}>Drafts</Link>
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="px-8 py-16 text-center text-[var(--color-body)]" style={{ fontFamily: 'var(--font-newsreader)' }}>
              No posts yet.{' '}
              <Link href="/dashboard/new" className="text-[var(--color-link)] underline underline-offset-4">
                Write your first article.
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ fontFamily: 'var(--font-inter)' }}>
                  <thead>
                    <tr className="bg-muted text-xs font-bold uppercase tracking-widest text-[var(--color-body)]">
                      <th className="px-8 py-4 font-semibold">Post Title</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Tags</th>
                      <th className="px-6 py-4 font-semibold text-center">Claps</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-8 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.map((post, idx) => {
                      const clapCount = post.claps.reduce(
                        (s: number, c: { count: number | null }) => s + (c.count ?? 0), 0
                      )
                      const isPublished = post.status === 'published'
                      return (
                        <tr key={post.id} className={`transition-colors group ${idx % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-muted/30'} hover:bg-muted/50`}>
                          <td className="px-8 py-6">
                            <div
                              className={`font-bold text-lg line-clamp-1 ${isPublished ? 'text-[var(--color-heading)]' : 'text-[var(--color-body)]'}`}
                              style={{ fontFamily: 'var(--font-space-grotesk)' }}
                            >
                              {post.title}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            {isPublished ? (
                              <span className="bg-[var(--color-surface-raised)] text-[var(--color-link)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Published
                              </span>
                            ) : (
                              <span className="bg-[rgba(112,66,0,0.3)] text-[#ffb86c] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 2).map((pt: { tag: { id: string; name: string; slug: string } }) => (
                                <span
                                  key={pt.tag.id}
                                  className="bg-[var(--color-surface-raised)] text-[var(--color-chip-text)] px-2 py-0.5 rounded-full text-[10px]"
                                >
                                  {pt.tag.name}
                                </span>
                              ))}
                              {post.tags.length === 0 && (
                                <span className="text-[var(--color-border-subtle)] text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center font-medium text-sm text-[var(--color-heading)]">
                            {isPublished ? formatCount(clapCount) : (
                              <span className="text-[var(--color-muted-text)]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-6 text-sm text-[var(--color-body)]">
                            {isPublished ? formatDate(post.published_at) : formatDate(post.updated_at ?? post.created_at)}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/dashboard/edit/${post.id}`}
                                className="p-2 hover:bg-muted rounded-full transition-colors text-[var(--color-body)]"
                                title="Edit"
                              >
                                <IconEdit />
                              </Link>
                              <form action={deletePost.bind(null, post.id)}>
                                <button
                                  type="submit"
                                  className="p-2 hover:bg-red-500/10 rounded-full transition-colors text-red-500"
                                  title="Delete"
                                  onClick={(e) => {
                                    if (!confirm('Delete this post? This cannot be undone.')) e.preventDefault()
                                  }}
                                >
                                  <IconDelete />
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="px-8 py-6 bg-muted/30">
                <div className="flex items-center justify-between" style={{ fontFamily: 'var(--font-inter)' }}>
                  <span className="text-sm text-[var(--color-body)]">
                    Showing {Math.min((page - 1) * perPage + 1, totalFiltered)}–{Math.min(page * perPage, totalFiltered)} of {totalFiltered} post{totalFiltered !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    {page > 1 && (
                      <Link
                        href={`/dashboard?filter=${filter}&page=${page - 1}`}
                        className="px-3 py-1.5 rounded-lg bg-muted text-sm text-[var(--color-body)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        &larr; Prev
                      </Link>
                    )}
                    {page < totalPages && (
                      <Link
                        href={`/dashboard?filter=${filter}&page=${page + 1}`}
                        className="px-3 py-1.5 rounded-lg bg-muted text-sm text-[var(--color-body)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        Next &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
