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
  searchParams: Promise<{ filter?: string }>
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
  const { filter = 'all' } = await searchParams
  const filteredPosts =
    filter === 'published' ? allPosts.filter((p) => p.status === 'published')
    : filter === 'drafts'    ? allPosts.filter((p) => p.status === 'draft')
    : allPosts

  const tabClass = (tab: string) =>
    tab === (filter || 'all')
      ? 'px-6 py-1.5 rounded-full bg-white shadow-sm text-[#323233] text-sm font-medium'
      : 'px-6 py-1.5 rounded-full text-[#5f5f5f] hover:text-[#323233] transition-colors text-sm font-medium'

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <main className="max-w-6xl mx-auto pt-12 pb-20 px-6">

        {/* Header */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1
              className="text-4xl md:text-5xl font-bold tracking-tight mb-2"
              style={{ fontFamily: 'var(--font-newsreader)' }}
            >
              Author Dashboard
            </h1>
            <p className="text-[#5f5f5f] text-sm" style={{ fontFamily: 'var(--font-inter)' }}>
              Manage your writing, monitor performance, and engage with your readers.
            </p>
          </div>
          <Link
            href="/dashboard/new"
            className="shrink-0 inline-flex items-center gap-2 bg-[#056d41] text-[#e7ffeb] px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#006038] transition-all active:opacity-80 active:scale-95"
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
            { label: 'Total Posts', value: totalPosts, sub: `${draftsCount} draft${draftsCount !== 1 ? 's' : ''}`, subColor: '#7b7b7a', icon: <IconArticle /> },
            { label: 'Claps', value: formatCount(totalClaps), sub: 'Across all posts', subColor: '#7b7b7a', icon: <IconClap /> },
            { label: 'Comments', value: formatCount(totalComments), sub: 'Across all posts', subColor: '#7b7b7a', icon: <IconChat /> },
            { label: 'Drafts', value: draftsCount, sub: 'Ready to polish', subColor: '#7b7b7a', icon: <IconDraft /> },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl border border-[#b2b2b1]/10 shadow-sm transition-transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <span
                  className="text-xs font-bold uppercase tracking-widest text-[#5f5f5f]"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  {stat.label}
                </span>
                <span className="text-[#056d41] opacity-70">{stat.icon}</span>
              </div>
              <div
                className="text-4xl font-bold text-[#323233]"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs mt-2"
                style={{ fontFamily: 'var(--font-inter)', color: stat.subColor }}
              >
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-xl border border-[#b2b2b1]/10 overflow-hidden shadow-sm">

          {/* Table header with tabs */}
          <div className="p-8 border-b border-[#f0eded]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h2
                className="text-2xl font-bold text-[#323233]"
                style={{ fontFamily: 'var(--font-newsreader)' }}
              >
                Your Posts
              </h2>
              <div
                className="flex items-center gap-1 bg-[#f6f3f2] p-1 rounded-full"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <Link href="/dashboard" className={tabClass('all')}>All</Link>
                <Link href="/dashboard?filter=published" className={tabClass('published')}>Published</Link>
                <Link href="/dashboard?filter=drafts" className={tabClass('drafts')}>Drafts</Link>
              </div>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="px-8 py-16 text-center text-[#5f5f5f]" style={{ fontFamily: 'var(--font-newsreader)' }}>
              No posts yet.{' '}
              <Link href="/dashboard/new" className="text-[#056d41] underline underline-offset-4">
                Write your first article.
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left" style={{ fontFamily: 'var(--font-inter)' }}>
                  <thead>
                    <tr className="bg-[#f6f3f2]/50 text-xs font-bold uppercase tracking-widest text-[#5f5f5f]">
                      <th className="px-8 py-4 font-semibold">Post Title</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold">Tags</th>
                      <th className="px-6 py-4 font-semibold text-center">Claps</th>
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-8 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0eded]">
                    {filteredPosts.map((post) => {
                      const clapCount = post.claps.reduce(
                        (s: number, c: { count: number | null }) => s + (c.count ?? 0), 0
                      )
                      const isPublished = post.status === 'published'
                      return (
                        <tr key={post.id} className="hover:bg-[#f6f3f2]/30 transition-colors group">
                          <td className="px-8 py-6">
                            <div
                              className={`font-bold text-lg line-clamp-1 ${isPublished ? 'text-[#323233]' : 'text-[#5f5f5f]/80'}`}
                              style={{ fontFamily: 'var(--font-newsreader)' }}
                            >
                              {post.title}
                            </div>
                          </td>
                          <td className="px-6 py-6">
                            {isPublished ? (
                              <span className="bg-[#9df5bd] text-[#005e37] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Published
                              </span>
                            ) : (
                              <span className="bg-[#e4e2e2] text-[#5f5f5f] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 2).map((pt: { tag: { id: string; name: string; slug: string } }) => (
                                <span
                                  key={pt.tag.id}
                                  className="bg-[#e4e2e2] px-2 py-0.5 rounded-md text-[10px] text-[#5f5f5f]"
                                >
                                  {pt.tag.name}
                                </span>
                              ))}
                              {post.tags.length === 0 && (
                                <span className="text-[#b2b2b1] text-xs">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-6 text-center font-medium text-sm">
                            {isPublished ? formatCount(clapCount) : (
                              <span className="text-[#b2b2b1]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-6 text-sm text-[#5f5f5f]">
                            {isPublished ? formatDate(post.published_at) : formatDate(post.updated_at ?? post.created_at)}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/dashboard/edit/${post.id}`}
                                className="p-2 hover:bg-[#eae8e7] rounded-full transition-colors text-[#5f5f5f]"
                                title="Edit"
                              >
                                <IconEdit />
                              </Link>
                              <form action={deletePost.bind(null, post.id)}>
                                <button
                                  type="submit"
                                  className="p-2 hover:bg-[#9f403d]/10 rounded-full transition-colors text-[#9f403d]"
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
              <div className="px-8 py-6 border-t border-[#f0eded] bg-[#f6f3f2]/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#5f5f5f]" style={{ fontFamily: 'var(--font-inter)' }}>
                    Showing {filteredPosts.length} of {totalPosts} post{totalPosts !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
