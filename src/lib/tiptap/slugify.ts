/**
 * Convert a heading text string to a URL-safe slug.
 * Used for both TOC link hrefs and heading id attributes.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')  // strip non-word chars (keeps letters, digits, _, -, spaces)
    .replace(/[\s_]+/g, '-')   // spaces and underscores → hyphens
    .replace(/-+/g, '-')       // collapse multiple hyphens
    .replace(/^-|-$/g, '')     // strip leading/trailing hyphens
}
