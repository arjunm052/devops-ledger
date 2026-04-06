/** First image file from a DataTransfer (paste or drop). */
export function getImageFileFromDataTransfer(dt: DataTransfer | null): File | null {
  if (!dt) return null
  if (dt.files?.length) {
    for (let i = 0; i < dt.files.length; i++) {
      const f = dt.files.item(i)
      if (f?.type.startsWith('image/')) return f
    }
  }
  const items = dt.items
  if (!items) return null
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const f = item.getAsFile()
      if (f) return f
    }
  }
  return null
}
