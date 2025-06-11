'use client'

import {
  Dispatch,
  SetStateAction,
  TransitionStartFunction,
  useCallback,
  useEffect,
  useState,
  useTransition
} from 'react'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { usePathname } from 'next/navigation'
import { getConversation } from '@/lib/firebase/conversations'
import { IConversation } from '@/lib/firebase/types'

export const Conversation = () => {
  const [conv, setConv] = useState<IConversation>()
  const pathname = usePathname()
  const id = pathname.split('/').pop()

  const [pending, start] = useTransition()

  const transition = <R,>(
    fn: TransitionStartFunction,
    action: () => Promise<R>,
    set: Dispatch<SetStateAction<R>>
  ) => {
    fn(async () => {
      set(await action())
    })
  }

  const get = useCallback(async () => {
    if (id) {
      return (await getConversation(id)) as IConversation
    }
  }, [id])

  useEffect(() => {
    if (id) transition(start, get, setConv)
  }, [id, get])

  return (
    conv && (
      <div className="mb-6 mx-10 pb-4">
        <div className="truncate max-w-lg">
          <h1 className="text-2xl font-bold mb-1 font-space truncate whitespace-nowrap tracking-tight">
            {conv.title ?? 'Conversation'}
          </h1>
        </div>
        <div className="capitalize flex gap-4 flex-wrap items-center">
          <p className="text-base font-semibold font-space dark:text-teal-400 text-teal-700">
            {conv.assistant}
          </p>
          {conv.createdAt && (
            <span className="italic text-sm text-muted-foreground tracking-wider">
              - {formatt({ ...conv.createdAt } as FormatDateProps)}
            </span>
          )}
        </div>
      </div>
    )
  )
}

interface FormatDateProps extends Timestamp {
  seconds: number
  nanoseconds: number
}

const formatt = ({ seconds, nanoseconds }: FormatDateProps) => {
  const millis = seconds * 1000 + Math.floor(nanoseconds / 1e6)
  const date = new Date(millis)
  return format(date, 'Pp')
}
