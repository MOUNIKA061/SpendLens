import { ImageResponse } from 'next/og'
import { createElement } from 'react'

import { getAuditRecord } from '@/lib/server/persistence'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_req: Request, context: RouteContext) {
  const params = await context?.params
  const id = typeof params?.id === 'string' ? params.id : ''
  const audit = await getAuditRecord(id)

  if (!audit) {
    return new Response('Not found', { status: 404 })
  }

  const topOpportunity = audit.results[0]

  return new ImageResponse(
    createElement(
      'div',
      {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, #050816 0%, #04060f 100%)',
          color: 'white',
          padding: '64px',
          fontFamily: 'Arial, sans-serif',
        },
      },
      createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } },
        createElement(
          'div',
          null,
          createElement(
            'div',
            { style: { fontSize: '28px', color: '#86efac', fontWeight: 700 } },
            'SpendLens',
          ),
          createElement(
            'div',
            { style: { marginTop: '18px', fontSize: '28px', color: '#cbd5e1' } },
            'Saved',
          ),
          createElement(
            'div',
            {
              style: {
                fontSize: '88px',
                fontWeight: 800,
                lineHeight: 1.0,
                marginTop: '8px',
                color: '#f8fafc',
              },
            },
            `$${audit.totalMonthlySavings}/mo`,
          ),
          createElement(
            'div',
            { style: { marginTop: '10px', fontSize: '34px', color: '#86efac', fontWeight: 700 } },
            `$${audit.totalAnnualSavings}/year`,
          ),
        ),
        createElement(
          'div',
          {
            style: {
              width: '320px',
              borderRadius: '28px',
              background: 'rgba(255,255,255,0.06)',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.10)',
            },
          },
          createElement(
            'div',
            { style: { fontSize: '18px', color: '#94a3b8' } },
            'Top opportunity',
          ),
          createElement(
            'div',
            { style: { marginTop: '8px', fontSize: '28px', fontWeight: 700 } },
            topOpportunity?.toolName ?? 'AI stack',
          ),
          createElement(
            'div',
            { style: { marginTop: '8px', fontSize: '18px', color: '#cbd5e1' } },
            topOpportunity?.recommendedAction ?? 'Optimize spend',
          ),
        ),
      ),
      createElement(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } },
        createElement(
          'div',
          { style: { fontSize: '26px', color: '#cbd5e1', maxWidth: '760px', lineHeight: 1.3 } },
          'AI spend audit results, optimized for sharing and screenshots.',
        ),
        createElement(
          'div',
          { style: { fontSize: '24px', color: '#86efac', fontWeight: 700 } },
          'spendlens.app',
        ),
      ),
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
