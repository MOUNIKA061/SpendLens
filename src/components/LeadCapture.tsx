'use client'

import { useState, useEffect } from 'react'

export function LeadCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = () => {
    console.log('Email captured:', email)
    setSubmitted(true)
    setTimeout(() => {
      setIsOpen(false)
      setEmail('')
      setSubmitted(false)
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#060b18] p-6 shadow-2xl shadow-black/40">
        <h3 className="text-lg font-semibold text-white mb-2">Get More Savings Tips</h3>
        <p className="text-slate-400 text-sm mb-4">
          Join founders optimizing their AI spend. We share exclusive tips via email.
        </p>
        
        {submitted ? (
          <div className="text-center">
            <p className="text-emerald-400 font-medium">Thanks for signing up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-slate-500"
            />
            <button
              onClick={handleSubmit}
              disabled={!email}
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              Send Tips
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
