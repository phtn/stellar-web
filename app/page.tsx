import Script from 'next/script'
import { headers } from 'next/headers'
import { getModels } from '@/lib/config/models'
import { Content } from './content'

export default async function Page() {
  const models = await getModels()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <>
      <Script strategy="afterInteractive" nonce={nonce} />
      <Content models={models} />
    </>
  )
}
