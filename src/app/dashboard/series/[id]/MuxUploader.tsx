'use client'

import { useRef, useState } from 'react'

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

export default function MuxUploader({
  onUploadId,
}: {
  onUploadId: (uploadId: string) => void
}) {
  const [state, setState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return

    setState('uploading')
    setProgress(0)
    setErrorMsg('')

    try {
      // 1. Get a direct upload URL from our API
      const res = await fetch('/api/mux/upload', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to get upload URL')
      }
      const { uploadId, url } = await res.json()

      // 2. Upload the file directly to Mux using XHR for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100))
          }
        })
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        })
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.open('PUT', url)
        xhr.send(file)
      })

      onUploadId(uploadId)
      setState('done')
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Upload failed')
      setState('error')
    }
  }

  return (
    <div className="space-y-3">
      <div
        onClick={() => state === 'idle' || state === 'error' ? inputRef.current?.click() : undefined}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          state === 'idle' || state === 'error'
            ? 'border-border hover:border-primary/50 hover:bg-accent/30'
            : 'border-border cursor-default'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />

        {state === 'idle' && (
          <>
            <p className="text-2xl mb-2">🎬</p>
            <p className="text-sm font-medium text-foreground mb-1">Click to upload video</p>
            <p className="text-xs text-muted-foreground">MP4, MOV, MKV — up to 10GB</p>
          </>
        )}

        {state === 'uploading' && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Uploading… {progress}%</p>
            <div className="w-full bg-accent rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Do not close this page</p>
          </div>
        )}

        {state === 'done' && (
          <>
            <p className="text-2xl mb-2">✅</p>
            <p className="text-sm font-medium text-foreground">Upload complete!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Video is processing on Mux — this may take a few minutes.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm font-medium text-destructive mb-1">{errorMsg}</p>
            <p className="text-xs text-muted-foreground">Click to try again</p>
          </>
        )}
      </div>
    </div>
  )
}
