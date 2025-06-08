import { ConfigCtx } from '@/ctx/config'
import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { use, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from './ui/carousel'
import { Toggle } from './ui/toggle'
import { Voices } from '@/lib/store/voiceSettings'
import { setVoice } from '@/app/actions'

interface IBabe {
  id: Voices
  src: string
  greeting: string
}

interface BabesProps {
  startVoiceChat: (voice: Voices) => void
}
export const Babes = ({ startVoiceChat }: BabesProps) => {
  const { getFileUri } = use(ConfigCtx)!
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])
  const babes = useMemo(
    () =>
      [
        {
          id: 'kenna',
          greeting: "I'm not in to small talk nonsense.",
          src: getFileUri('sega1.webp')
        },
        {
          id: 'lindsay',
          greeting: "What's on your mind?",
          src: getFileUri('sony1.webp')
        },
        {
          id: 'emma',
          greeting: 'What do you want?',
          src: getFileUri('diet.webp')
        },
        {
          id: 'ellie',
          greeting: "I'm down for anything.",
          src: getFileUri('pepsi.webp')
        },
        {
          id: 'maddie',
          greeting: "Take me shopping and I'll let you cuddle.",
          src: getFileUri('maddie.webp')
        },
        {
          id: 'poki',
          greeting: 'You must be that guy!.',
          src: getFileUri('poki.webp')
        },
        {
          id: 'lovins',
          greeting: 'Take me away..',
          src: getFileUri('lovins.webp')
        }
      ] as IBabe[],
    [getFileUri]
  )

  const handleSelect = useCallback(
    (id: Voices) => async () => {
      console.log(id)
      startVoiceChat(id)
      await setVoice(id)
    },
    [startVoiceChat]
  )
  return (
    <div className="mb-10 flex flex-col items-center gap-4 scroll-smooth will-change-scroll">
      <div className="md:w-[34rem] w-full flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-space font-bold opacity-60">{current}</span>
          <span className="px-2 text-xs scale-75 opacity-50">|</span>
          <span className="font-space font-medium capitalize opacity-80">
            {babes[current - 1]?.id}
          </span>
        </div>
        <ActionFeature
          label="Voice Chat"
          icon="voice-solid"
          fn={handleSelect(babes[current - 1]?.id)}
        />
      </div>
      <Carousel
        setApi={setApi}
        orientation="horizontal"
        className="flex max-w-3xl"
      >
        <CarouselContent>
          {babes.map(babe => (
            <CarouselItem
              key={babe.id}
              className="w-fit flex justify-center rounded-3xl"
              onSelect={e => console.log(e)}
            >
              <Image
                width={0}
                height={0}
                unoptimized
                src={babe.src}
                alt={babe.src}
                className="lg:h-[28rem] select-none h-[22rem] w-auto rounded-2xl aspect-auto"
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute bottom-4 right-4 md:right-28 md:w-24 z-10 w-1/4 border-pink-500 h-12">
          <CarouselPrevious className="z-10 absolute left-2" />
          <CarouselNext className="z-10 right-2" />
        </div>
      </Carousel>
      <div className="flex items-center justify-center space-x-6 h-16">
        <Icon
          size={32}
          name="quotes"
          className="rotate-180 opacity-50 dark:text-cyan-300 text-teal-500"
        />
        <p className="text-center font-space text-base italic dark:text-neutral-400 text-neutral-500">
          {babes[current - 1]?.greeting}
        </p>

        <Icon
          size={24}
          name="quotes"
          className="dark:opacity-15 dark:text-teal-100 text-stone-300 blur-[1.5px]"
        />
      </div>
    </div>
  )
}

export const Pro = () => (
  <div
    className={cn(
      'bg-stone-800 h-[12.5px]',
      'flex items-center justify-center overflow-hidden',
      'border border-b-0 border-stone-800',
      'rounded-ss-[3.5px] rounded-se-[1px] rounded-e-xl'
    )}
  >
    <span
      className={cn(
        'font-space text-lg scale-105 -tracking-wide',
        'ps-[1px] pe-[2.25px] pb-[2.70px] text-transparent bg-clip-text',
        'bg-gradient-to-r from-indigo-400 via-sky-400 to-cyan-200 ',
        ''
      )}
    >
      pro
    </span>
  </div>
)

interface ActionFeatureProps {
  label: string
  icon: IconName
  fn: VoidFunction
  pressed?: boolean
}
export const ActionFeature = ({ icon, label, fn }: ActionFeatureProps) => (
  <button
    onClick={fn}
    className={cn(
      ' rounded-full flex items-center justify-center space-x-2 border border-teal-500 bg-teal-500 ps-1 pe-2 py-1 dark:bg-foreground/15 dark:border-foreground/10'
    )}
  >
    <Icon name={icon} size={18} color="white" className="text-white" solid />
    <span className="tracking-tight font-space font-medium text-base text-white">
      {label}
    </span>
    {/* <Pro /> */}
  </button>
)

export const ToggleFeature = ({
  icon,
  label,
  fn,
  pressed = false
}: ActionFeatureProps) => (
  <Toggle
    pressed={pressed}
    onClick={fn}
    className={cn(
      'h-9 flex items-center justify-center self-end',
      'dark:bg-zinc-950/40 dark:border-foreground/10',
      'rounded-full border border-primary',
      'bg-primary px-2.5 pe-3 hover:bg-zinc-700'
    )}
  >
    <Icon name={icon} size={10} className="text-teal-400" />
    <span className="font-space text-sm text-neutral-50 dark:text-teal-50">
      {label}
    </span>
  </Toggle>
)
