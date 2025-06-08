import type {
  PlayHT_WSAuthResponse,
  PlayHTDialogEngine,
  PlayHTStreamRequest,
  PlayHTVoice,
  PlayHTVoicesResponse,
  PlayHTWebSocketMessage,
  WebSocketState
} from '@/types'
import WebSocket from 'ws'

const apiKey = process.env.PLAYHT_API_KEY
const userId = process.env.PLAYHT_USER_ID

const POLLING_INTERVAL = 10 // ms

export class PlayHT_TTS_Service {
  private static readonly BASE_URL = 'https://api.play.ht/api/v2'
  private static readonly TEXT_STREAM = 'https://api.play.ht/api/v2/tts/stream'

  // private static readonly WS_STREAM = 'wss://api.play.ht/v2/tts/stream'
  private ws_urls: Record<PlayHTDialogEngine, string | URL> | null

  constructor() {
    this.ws_urls = null
  }

  setWebSocketUrls(urls: Record<PlayHTDialogEngine, string | URL>) {
    this.ws_urls = urls
  }

  async wsAuth(): Promise<PlayHT_WSAuthResponse> {
    const response = await fetch('https://api.play.ht/api/v4/websocket-auth', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-USER-ID': userId!
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      // throw new Error(`PlayHT wsAuth failed: ${errorText}`)
      console.error(errorText)
    }

    const wsResponse = (await response.json()) as PlayHT_WSAuthResponse
    // console.log(JSON.stringify(wsResponse, null, 2))
    return wsResponse
  }

  async getVoices(): Promise<PlayHTVoicesResponse> {
    const url = `${PlayHT_TTS_Service.BASE_URL}/voices`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-USER-ID': userId!,
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`PlayHT API error: ${response.statusText}`)
    }

    return response.json() as Promise<PlayHTVoicesResponse>
  }

  async streamSpeech(
    text: string,
    voiceId: string,
    options: Partial<PlayHTStreamRequest> = {}
  ): Promise<Buffer> {
    const requestBody: PlayHTStreamRequest = {
      text,
      speed: 1.0,
      voice: voiceId,
      temperature: 0.8,
      sample_rate: 24000,
      output_format: 'mp3',
      voice_engine: 'PlayDialog',
      emotion: 'female_happy',
      ...options
    }

    const response = await fetch(PlayHT_TTS_Service.TEXT_STREAM, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'X-USER-ID': userId!,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.error(`LOG: ${JSON.stringify(response, null, 2)}`)
      throw new Error(`PlayHT API error: ${response.statusText}`)
    }

    const audioData = await response.arrayBuffer()
    return Buffer.from(audioData)
  }

  async *streamDialog(
    textStream: AsyncIterable<string>,
    voiceId: string,
    engine: PlayHTDialogEngine,
    options: Partial<PlayHTStreamRequest> = {}
  ): AsyncGenerator<Buffer> {
    const ws = this.ws_urls && new WebSocket(this.ws_urls[engine])

    if (!ws) return

    await this.setupWebSocketConnection(ws, voiceId, options)

    const audioQueue: Buffer[] = []
    let streamingFinished = false

    this.setupMessageHandler(ws, audioQueue, () => {
      streamingFinished = true
    })

    void this.processTextStream(ws, textStream)

    while (true) {
      if (audioQueue.length > 0) {
        yield audioQueue.shift()!
      } else if (streamingFinished && audioQueue.length === 0) {
        break
      } else if (this.isWebSocketActive(ws.readyState)) {
        await this.delay(POLLING_INTERVAL)
      } else {
        console.error(
          'WebSocket not open/connecting, and streaming not finished. Exiting audio stream.',
          ws.readyState
        )
        break
      }
    }

    this.closeWebSocketIfNeeded(ws)
  }

  private setupMessageHandler(
    ws: WebSocket,
    audioQueue: Buffer[],
    onFinish: () => void
  ): void {
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        let size = 0
        if (Buffer.isBuffer(data)) {
          size = data.length
        } else if (data instanceof ArrayBuffer) {
          size = data.byteLength
        } else if (ArrayBuffer.isView(data)) {
          size = data.byteLength
        }
        console.log('Received binary audio chunk:', size)
        audioQueue.push(data as Buffer)
      } else {
        try {
          const message = JSON.parse(data.toString()) as PlayHTWebSocketMessage
          console.log('Received PlayHT WebSocket message:', message.type)
          switch (message.type) {
            case 'start':
              // Optionally handle start
              break
            case 'end':
              // Optionally handle end
              onFinish()
              ws.close()
              break
            case 'error':
              console.error('PlayHT error:', message.message)
              break
            default:
              // Ignore unknown types
              break
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
        }
      }
    })
  }

  private async setupWebSocketConnection(
    ws: WebSocket,
    voiceId: string,
    options: Partial<PlayHTStreamRequest> = {}
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        console.log('PlayHT WebSocket connected.')

        const initMessage: Omit<PlayHTStreamRequest, 'text'> = {
          voice: voiceId,
          output_format: 'mp3',
          voice_engine: 'PlayDialog',
          speed: 1.0,
          sample_rate: 24000,
          temperature: 1.4,
          ...options
        }

        ws.send(JSON.stringify(initMessage))
        resolve()
      })

      ws.on('error', (error: Error) => {
        console.error('PlayHT WebSocket error:', error)
        reject(error)
      })

      ws.on('close', (code: number, reason: Buffer) => {
        console.log(
          `PlayHT WebSocket closed with code ${code} and reason: ${reason.toString()}`
        )
      })
    })
  }

  private async processTextStream(
    ws: WebSocket,
    textStream: AsyncIterable<string>
  ): Promise<void> {
    try {
      for await (const text of textStream) {
        if (text.trim()) {
          const textMessage = {
            type: 'text',
            text: text.trim()
          }
          ws.send(JSON.stringify(textMessage))
        }
      }

      // Signal end of text stream
      const endMessage = {
        type: 'end'
      }
      ws.send(JSON.stringify(endMessage))
    } catch (error) {
      console.error('Error sending text to PlayHT WebSocket:', error)
    }
  }

  private isBinaryAudioData(data: Buffer): boolean {
    // Check if data starts with common audio file headers
    const mp3Header =
      data.length > 2 && data[0] === 0xff && (data?.[1] ?? 0 & 0xe0) === 0xe0
    const wavHeader =
      data.length > 4 &&
      data[0] === 0x52 &&
      data[1] === 0x49 &&
      data[2] === 0x46 &&
      data[3] === 0x46

    return mp3Header || wavHeader || data.length > 1000 // Assume large buffers are audio
  }

  private isWebSocketActive(readyState: WebSocketState): boolean {
    return readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING
  }

  private closeWebSocketIfNeeded(ws: WebSocket): void {
    if (this.isWebSocketActive(ws.readyState)) {
      ws.close()
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms))
  }

  // Utility method to get a specific voice by characteristics
  async findVoice(criteria: {
    gender?: string
    language?: string
    accent?: string
    age?: string
  }): Promise<PlayHTVoice | null> {
    const voices = await this.getVoices()

    return (
      voices.voices.find(
        voice =>
          (criteria.gender !== null ||
            voice.gender.toLowerCase() === criteria.gender) &&
          (criteria.language !== null ||
            voice.language.toLowerCase().includes(criteria.language)) &&
          (criteria.accent !== null ||
            voice.accent.toLowerCase().includes(criteria.accent)) &&
          (criteria.age !== undefined ||
            voice.age.toLowerCase() === criteria.age)
      ) || null
    )
  }
}
