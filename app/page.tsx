import PlayHTWsAuthManager from '@/services/tts/playhtWsAuthManager'
import { Content } from './content'
import { getCookie, setCookie } from '@/lib/utils/cookies'
import { getModels } from '@/lib/config/models'

export default async function Page() {
  const models = await getModels()
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

    const wsUrl =
      await PlayHTWsAuthManager.getInstance().getWebSocketUrl('PlayDialog')

    if (wsUrl) {
      setCookie('ws-state', 'enabled')
    }
  }

  return <Content models={models} />
}
