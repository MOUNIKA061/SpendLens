import type { Metadata } from 'next'

import { AuditResults } from '@/components/AuditResults'

type ResultsPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ saved?: string }>
}

function getSavedAmount(searchParams?: { saved?: string }): number {
  const rawValue = searchParams?.saved ?? '0'
  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export async function generateMetadata({ params, searchParams }: ResultsPageProps): Promise<Metadata> {
  const { id } = await params
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const savedAmount = getSavedAmount(resolvedSearchParams)
  const shareUrl = `/results/${id}${savedAmount > 0 ? `?saved=${savedAmount}` : ''}`

  return {
    title: `I could save $${savedAmount}/month on AI tools`,
    description: 'Free AI spend audit — see where your startup is overspending',
    openGraph: {
      title: `I could save $${savedAmount}/month on AI tools`,
      description: 'Free AI spend audit — see where your startup is overspending',
      url: shareUrl,
    },
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params
  return <AuditResults auditId={id} />
}
