'use client'

import { useEffect, useState } from 'react'

import type { LeadSubmission } from '@/types'

type LeadCaptureProps = {
  auditId: string
  source?: 'low-savings' | 'credex' | 'waitlist'
  triggerDelayMs?: number
}

export function LeadCapture({
  auditId,
  source = 'waitlist',
  triggerDelayMs = 3000,
}: LeadCaptureProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [teamSize, setTeamSize] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, triggerDelayMs)
    return () => clearTimeout(timer)
  }, [triggerDelayMs])

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const payload: LeadSubmission = {
      email,
      companyName: companyName || undefined,
      role: role || undefined,
      teamSize: teamSize ? Number(teamSize) : undefined,
      auditId,
      source,
      honeypot,
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const payloadError = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payloadError?.error ?? 'Failed to save lead')
      }

      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setEmail('')
        setCompanyName('')
        setRole('')
        setTeamSize('')
        setHoneypot('')
        setSubmitted(false)
      }, 1800)
    } catch (err) {
      console.error('Lead capture failed', err)
      setError('Could not save your signup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[#060b18] p-6 shadow-2xl shadow-black/40">
        <h3 className="mb-2 text-lg font-semibold text-white">
          Notify me when new optimizations apply
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          We&apos;ll save your audit and send a confirmation email with the results.
        </p>

        {submitted ? (
          <div className="text-center">
            <p className="font-medium text-emerald-400">You&apos;re on the list.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500"
              />
              <input
                type="text"
                placeholder="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500"
              />
            </div>
            <input
              type="number"
              min="1"
              placeholder="Team size"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500"
            />

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <button
              onClick={handleSubmit}
              disabled={!email || loading}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {loading ? 'Saving…' : 'Notify me'}
            </button>
          </div>
        )}

        <button
          onClick={() => setIsOpen(false)}
          className="mt-3 w-full text-sm text-slate-400 hover:text-slate-300"
        >
          Close
        </button>
      </div>
    </div>
  )
}
