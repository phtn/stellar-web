import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ status: 405 })
  }
  const payload = req.body
  // e.g. log, send to BetterStack, etc.
  console.log('CSP Report:', JSON.stringify(payload))

  return NextResponse.json({ status: 204 })
}
