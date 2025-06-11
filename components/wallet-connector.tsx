import { useCallback, useEffect } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { IconBtn } from './icon-btn'
import { appKit } from '@/ctx/wagmi'
import { useTheme } from 'next-themes'
import { type ThemeMode } from '@reown/appkit'
import { useAppKitAccount } from '@reown/appkit/react'
import { parseUnits } from 'viem'
import { useSend } from '@/lib/hooks/x-use-send'
import { onSuccess } from '@/ctx/toast'

const TO = '0x611F3143b76a994214d751d762b52D081d8DC4de'
export const WalletConnector = () => {
  const { isConnected, address } = useAccount()
  const { theme } = useTheme()
  const { allAccounts } = useAppKitAccount()
  const { sendFrom, isPending, isSuccess } = useSend()

  const sendFn = useCallback(() => {
    sendFrom({ to: TO, value: 5 })
  }, [sendFrom])

  const getFn = useCallback(async () => {
    const u = allAccounts?.map(a => ({ ...a }))

    console.log(u)
  }, [allAccounts])

  const { refetch } = useBalance({
    address
  })

  useEffect(() => {
    appKit.setThemeMode((theme as ThemeMode) ?? 'dark')
  }, [theme])

  const getBal = useCallback(async () => {
    const balance = await refetch()
    const v = balance.data?.value
    const d = balance.data?.decimals
    console.log('BAL', v && parseUnits(String(v), Number(d)))
  }, [refetch])

  useEffect(() => {
    if (!isPending && isSuccess) {
      onSuccess('Payment Sent')
    }
  }, [isPending, isSuccess])

  return (
    <div className="flex space-x-6">
      <IconBtn
        icon={isPending ? 'spinners-ring' : 'arrow-up-broken'}
        btnProps={{ onClick: sendFn }}
      />
      <IconBtn icon="ai-coder" btnProps={{ onClick: getFn }} />
      <IconBtn icon="ai-mind" btnProps={{ onClick: getBal }} />
      <div className=" hover:bg-background">
        <appkit-button
          // balance="hide"
          label="Sign in"
          loadingLabel="Connecting..."
        />
      </div>
      {isConnected && (
        <div className="hidden md:flex text-xs">
          <w3m-network-button />
        </div>
      )}
    </div>
  )
}
