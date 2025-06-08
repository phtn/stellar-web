import PlayHTWsAuthManager from '@/services/tts/playhtWsAuthManager'
import { Content } from './content'
import { setCookie } from '@/lib/utils/cookies'

export default async function Page() {
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
  return <Content />
}
