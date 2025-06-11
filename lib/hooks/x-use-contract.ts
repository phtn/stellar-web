import { useWriteContract } from 'wagmi'
import type { Abi, Address } from 'viem'
import { useCallback } from 'react'

export const useContract = () => {
  const { writeContract } = useWriteContract()

  const write = useCallback(
    (abi: Abi, address: Address, fn = 'func') => {
      writeContract({
        abi,
        address,
        args: [],
        functionName: fn
      })
    },
    [writeContract]
  )

  return { write }
}
