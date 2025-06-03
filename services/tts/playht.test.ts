import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayHT_TTS_Service } from './playht'

globalThis.fetch = vi.fn()

class MockWebSocket {
  static OPEN = 1
  static CONNECTING = 0
  readyState = MockWebSocket.OPEN
  on() {}
  send() {}
  close() {}
}
globalThis.WebSocket = MockWebSocket as any

describe('PlayHT_TTS_Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls getVoices and returns voices', async () => {
    const voicesResponse = { voices: [{ id: '1', gender: 'female', language: 'en', accent: '', age: 'adult' }] }
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: async () => voicesResponse,
    })
    const service = new PlayHT_TTS_Service()
    const result = await service.getVoices()
    expect(result).toEqual(voicesResponse)
  })

  it('calls wsAuth and returns ws auth response', async () => {
    const wsAuthResponse = { websocket_urls: {}, expires_at: new Date().toISOString() }
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: async () => wsAuthResponse,
    })
    const service = new PlayHT_TTS_Service()
    const result = await service.wsAuth()
    expect(result).toEqual(wsAuthResponse)
  })
}) 