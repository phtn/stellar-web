'use client'

import { useEffect } from 'react'
import PlayHTWsAuthManager from '@/services/tts/playhtWsAuthManager'
import { getCookie, setCookie } from '@/lib/utils/cookies'

export function VoiceInitializer() {
  useEffect(() => {
    const isVoiceEnabled = getCookie('vc-st')
    if (isVoiceEnabled === 'enabled') {
      PlayHTWsAuthManager.getInstance()
        .refresh()
        .then(() => {
          console.log('init')
        })
        .finally(() => {
          console.log('Stream ON')
        })

      PlayHTWsAuthManager.getInstance()
        .getWebSocketUrl('PlayDialog')
        .then(wsUrl => {
          if (wsUrl) {
            setCookie('ws-state', 'enabled')
          }
        })
    }
  }, [])

  return null
}
