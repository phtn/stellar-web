import { getVoice } from '@/app/actions'
import { Voices } from '@/lib/store/voiceSettings'
import { PlayHT_TTS_Service } from '@/services/tts/playht'

const voices: Record<Voices, string> = {
  ellie: process.env.ELLIE_ID!,
  maddie: process.env.MOODY_ID!,
  emma: process.env.EMMA_ID!,
  lindsay: process.env.LINDSAY_ID!,
  kenna: process.env.KENDALL_ID!,
  poki: process.env.POKI_ID!,
  lovins: process.env.LOVINS_ID!
}

export async function POST(req: Request): Promise<Response> {
  const {
    content,
    voiceEngine = 'playht',
    outputMode = 'text-stream',
    voice
  } = await req.json()

  const voiceId = voices[(await getVoice()) as Voices]

  console.log('VOICE', voice, voiceId)

  try {
    if (voiceEngine === 'playht') {
      const playht = new PlayHT_TTS_Service()
      if (outputMode === 'text-stream') {
        const audioBuffer = await playht.streamSpeech(content, voiceId)
        return new Response(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache'
          }
        })
      } else if (outputMode === 'dialog') {
        // 1. Get websocket URLs
        const wsAuth = await playht.wsAuth()
        playht.setWebSocketUrls(wsAuth.websocket_urls)
        // 2. Create a simple async generator for the dialog text
        async function* textStream() {
          yield content
        }
        // 3. Use PlayDialog engine for now
        const engine = 'PlayDialog'
        // 4. Stream audio chunks as they arrive
        const audioStream = playht.streamDialog(textStream(), voiceId, engine)
        // 5. Return a streaming response
        const stream = new ReadableStream({
          async pull(controller) {
            const { done, value } = await audioStream.next()
            if (done) {
              console.log('Stream completed')
              controller.close()
            } else {
              controller.enqueue(value)
            }
          }
        })
        return new Response(stream, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache'
          }
        })
      } else {
        return new Response('Invalid output mode', { status: 400 })
      }
    } else {
      return new Response('Unsupported voice engine', { status: 400 })
    }
  } catch (error) {
    console.error('TTS generation failed:', error)
    return new Response('TTS generation failed', { status: 500 })
  }
}
