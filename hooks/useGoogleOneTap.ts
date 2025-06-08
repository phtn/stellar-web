'use client'

// Add this at the top for TypeScript to recognize window.google
declare global {
  interface Window {
    google: any
  }
}

import { auth } from '@/lib/firebase'
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth'
import { useEffect } from 'react'

export function useGoogleOneTap(
  onSuccess?: (user: any) => void,
  onError?: (err: any) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined' || !window.google || !auth) return

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async (response: any) => {
        try {
          const credential = GoogleAuthProvider.credential(response.credential)
          const result = await signInWithCredential(auth, credential)
          onSuccess?.(result.user)
        } catch (err) {
          console.log(err)
          // onError?.(err)
        }
      },
      auto_select: false,
      cancel_on_tap_outside: false
    })

    window.google.accounts.id.prompt()
  }, [onSuccess, onError, enabled])
}
