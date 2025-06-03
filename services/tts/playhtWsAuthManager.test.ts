import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlayHT_TTS_Service } from './playht'
import PlayHTWsAuthManager from './playhtWsAuthManager'

describe('PlayHTWsAuthManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should refresh and set wsUrls and expiresAt', async () => {
    const wsAuthResponse = {
      websocket_urls: { PlayDialog: 'wss://test' },
      expires_at: new Date(Date.now() + 10000).toISOString(),
    }
    vi.spyOn(PlayHT_TTS_Service.prototype, 'wsAuth').mockResolvedValue(wsAuthResponse as any)
    const manager = PlayHTWsAuthManager.getInstance()
    await manager.refresh()
    const url = await manager.getWebSocketUrl('PlayDialog')
    expect(url).toBe('wss://test')
  })

  it('should return undefined if websocket_urls missing', async () => {
    const wsAuthResponse = { websocket_urls: {}, expires_at: new Date(Date.now() + 10000).toISOString() }
    vi.spyOn(PlayHT_TTS_Service.prototype, 'wsAuth').mockResolvedValue(wsAuthResponse as any)
    const manager = PlayHTWsAuthManager.getInstance()
    await manager.refresh()
    const url = await manager.getWebSocketUrl('PlayDialog')
    expect(url).toBeUndefined()
  })
}) 