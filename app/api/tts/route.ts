import * as msgpack from '@msgpack/msgpack'

const TTS_Service = {
  BASE_URL: process.env.TTS_SERVICE_URL ?? ''
}
const key = process.env.TTS_API_KEY ?? ''
const reference_id = process.env.MOODY ?? ''

export async function POST(req: Request): Promise<Response> {
  const { content } = await req.json()

  try {
    const url = `${TTS_Service.BASE_URL}/v1/tts`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'content-type': 'application/msgpack',
        model: 'speech-1.6'
      },
      body: msgpack.encode({
        reference_id,
        text: content,
        temperature: 0.3,
        top_p: 0.9,
        normalize: true
      })
    })

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`)
    }

    const audioData = await response.arrayBuffer()

    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('TTS generation failed:', error)
    return new Response('TTS generation failed', { status: 500 })
  }
}
