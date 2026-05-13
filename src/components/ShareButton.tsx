'use client'

import { useState } from 'react'

export function ShareButton({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

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
    <button
      onClick={handleShare}
      className={
        className ??
        'rounded-full bg-emerald-400 px-6 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300'
      }
    >
      {copied ? 'Copied to clipboard' : 'Share Audit'}
    </button>
  )
}
