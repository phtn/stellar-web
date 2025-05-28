import * as msgpack from '@msgpack/msgpack'

const ASR_Service = {
  BASE_URL: process.env.TTS_SERVICE_URL ?? ''
}
const key = process.env.TTS_API_KEY ?? ''

export async function POST(req: Request): Promise<Response> {
  const { audio } = await req.json()

  try {
    const url = `${ASR_Service.BASE_URL}/v1/asr`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/msgpack'
      },
      body: msgpack.encode({
        audio: audio,
        language: 'en',
        ignore_timestamps: true
      })
    })

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`)
    }

    const text = await response.text()

    return new Response(text)
  } catch (error) {
    console.error('ASR generation failed:', error)
    return new Response('ASR generation failed', { status: 500 })
  }
}
