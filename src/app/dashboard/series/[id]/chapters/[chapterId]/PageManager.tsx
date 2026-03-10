'use client'

import { useRef, useState, useTransition } from 'react'
import { addPageAction, deletePageAction } from '../actions'

type Page = { id: string; page_number: number; image_url: string }

export default function PageManager({
  seriesId,
  chapterId,
  pages: initialPages,
}: {
  seriesId: string
  chapterId: string
  pages: Page[]
}) {
  const [pages, setPages] = useState<Page[]>(initialPages)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [deletePending, startDeleteTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setError('')
    setUploading(true)
    const fileArray = Array.from(files)
    const total = fileArray.length
    let done = 0

    for (const file of fileArray) {
      const form = new FormData()
      form.append('file', file)
      form.append('chapter_id', chapterId)

      const res = await fetch('/api/upload/page', { method: 'POST', body: form })
      const body = await res.json()

      if (!res.ok) {
        setError(body.error ?? 'Upload failed')
        setUploading(false)
        return
      }

      const pageNumber = pages.length + done + 1
      const result = await addPageAction(seriesId, chapterId, body.url, pageNumber)

      if ('error' in result) {
        setError(result.error)
        setUploading(false)
        return
      }

      done++
      setUploadProgress(Math.round((done / total) * 100))
      setPages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), page_number: pageNumber, image_url: body.url },
      ])
    }

    setUploading(false)
    setUploadProgress(0)
  }

  function handleDelete(pageId: string) {
    if (!confirm('Remove this page?')) return
    startDeleteTransition(async () => {
      const result = await deletePageAction(seriesId, chapterId, pageId)
      if (!('error' in result)) {
        setPages((prev) => prev.filter((p) => p.id !== pageId))
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          uploading
            ? 'border-border cursor-default'
            : 'border-border hover:border-primary/50 hover:bg-accent/30 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        />

        {uploading ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Uploading pages… {uploadProgress}%</p>
            <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <>
            <p className="text-2xl mb-2">🖼️</p>
            <p className="text-sm font-medium text-foreground mb-1">Click to upload pages</p>
            <p className="text-xs text-muted-foreground">
              Select multiple images at once. They will be added in order. JPG, PNG, WebP — 10MB max each.
            </p>
          </>
        )}
      </div>

      {/* Page grid */}
      {pages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {pages.map((page) => (
            <div key={page.id} className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-accent/30 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={page.image_url}
                alt={`Page ${page.page_number}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <button
                  onClick={() => handleDelete(page.id)}
                  disabled={deletePending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-destructive/80 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold hover:bg-destructive"
                >
                  ×
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-0.5">
                {page.page_number}
              </div>
            </div>
          ))}
        </div>
      )}

      {pages.length === 0 && !uploading && (
        <p className="text-center text-xs text-muted-foreground py-4">
          No pages yet. Upload images above.
        </p>
      )}
    </div>
  )
}
