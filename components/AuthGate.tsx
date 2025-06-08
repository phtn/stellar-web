'use client'

import { useGoogleOneTap } from '@/hooks/useGoogleOneTap'
import { auth } from '@/lib/firebase'
import { useState } from 'react'

export default function AuthGate() {
  const [user, setUser] = useState<any>(auth.currentUser)

  useGoogleOneTap(
    user => {
      setUser(user)
    },
    err => {
      // handle error
      console.log('One Tap error:', err)
    }
  )

  if (user) {
    return <div>Welcome, {user.displayName || user.email}!</div>
  }

  return <div></div>
}
