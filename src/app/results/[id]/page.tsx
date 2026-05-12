import type { Metadata } from 'next'

import { AuditResults } from '@/components/AuditResults'
import { getAuditRecord } from '@/lib/server/persistence'

type ResultsPageProps = {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ saved?: string }>
}

function getSavedAmount(searchParams?: { saved?: string }): number {
  const rawValue = searchParams?.saved ?? '0'
  const parsedValue = Number(rawValue)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

export async function generateMetadata({ params }: ResultsPageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const audit = await getAuditRecord(id)
    if (audit) {
      const monthly = Number(audit.totalMonthlySavings) || 0
      const annual = Number(audit.totalAnnualSavings) || 0
      const shareUrl = `/results/${id}`
      return {
        title: `Saved $${monthly}/month on AI tools`,
        description: `SpendLens found ${annual}/year in AI savings`,
        openGraph: {
          title: `Saved $${monthly}/month on AI tools`,
          description: `SpendLens found ${annual}/year in AI savings`,
          url: shareUrl,
          images: [`/api/og/${id}`],
        },
        twitter: {
          card: 'summary_large_image',
          title: `Saved $${monthly}/month on AI tools`,
          description: `SpendLens found ${annual}/year in AI savings`,
          images: [`/api/og/${id}`],
        },
      }
    }
  } catch (err) {
    // ignore and fall back
    console.error('metadata audit read failed', err)
  }

  return {
    title: `Audit results — SpendLens`,
    description: 'Free AI spend audit — see where your startup is overspending',
    openGraph: {
      title: `Audit results — SpendLens`,
      description: 'Free AI spend audit — see where your startup is overspending',
      url: `/results/${id}`,
      images: [`/api/og/${id}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Audit results — SpendLens`,
      description: 'Free AI spend audit — see where your startup is overspending',
      images: [`/api/og/${id}`],
    },
  }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
  const { id } = await params
  return <AuditResults auditId={id} />
}
