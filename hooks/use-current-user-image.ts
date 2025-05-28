// import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export const useCurrentUserImage = () => {
  const [image, setImage] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserImage = async () => {
      // const { data, error } = await createClient().auth.getSession()
      // if (error) {
      //   console.error(error)
      // }

      setImage('https://www.svgrepo.com/svg/317464/soldier')
    }
    fetchUserImage()
  }, [])

  return image
}
