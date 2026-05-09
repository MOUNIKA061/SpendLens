import type { Metadata } from 'next'

import { SpendForm } from '@/components/SpendForm'

export const metadata: Metadata = {
  title: 'Audit | SpendLens',
  description: 'Run a free AI spend audit for your startup.',
}

export default function AuditPage() {
  return <SpendForm />
}
