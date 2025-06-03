import type { PlayHT_WSAuthResponse, PlayHTDialogEngine } from '@/types'
import { PlayHT_TTS_Service } from './playht'

class PlayHTWsAuthManager {
  private static instance: PlayHTWsAuthManager
  private wsUrls: PlayHT_WSAuthResponse | null = null
  private expiresAt: Date | null = null
  private refreshing: Promise<void> | null = null

  private constructor() {}

  public static getInstance(): PlayHTWsAuthManager {
    if (!PlayHTWsAuthManager.instance) {
      PlayHTWsAuthManager.instance = new PlayHTWsAuthManager()
    }
    return PlayHTWsAuthManager.instance
  }

  public async getWebSocketUrl(
    engine: PlayHTDialogEngine = 'PlayDialog'
  ): Promise<string | URL | undefined> {
    if (!this.wsUrls || !this.expiresAt || new Date() > this.expiresAt) {
      await this.refresh()
    }
    const urls = this.wsUrls?.websocket_urls
    return urls?.[engine]
  }

  public async refresh() {
    if (this.refreshing) {
      await this.refreshing
      return
    }
    this.refreshing = (async () => {
      const service = new PlayHT_TTS_Service()
      const wsAuth = (await service.wsAuth()) as PlayHT_WSAuthResponse
      this.wsUrls = wsAuth
      this.expiresAt = wsAuth.expires_at ? new Date(wsAuth.expires_at) : null
      this.refreshing = null
    })()
    await this.refreshing
  }
}

export default PlayHTWsAuthManager
