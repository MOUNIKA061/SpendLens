'use client'

import { useState } from 'react'

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  const baseClassName =
    'inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-white focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-950 focus:outline-none'

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy share URL:', error)
      }
    }
  }

  return (
    <button onClick={handleShare} className={`${baseClassName} ${className ?? ''}`.trim()}>
      {copied ? 'Copied to clipboard' : 'Share Audit'}
    </button>
  )
}
