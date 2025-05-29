import {
  EventHandler,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from './ui/carousel'
import { ConfigCtx } from '@/ctx/config'
import Image from 'next/image'
import { Icon, IconName } from '@/lib/icons'
import { cn } from '@/lib/utils'

interface IBabe {
  id: string
  src: string
  greeting: string
}

export const Babes = () => {
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
        }
      ] as IBabe[],
    [getFileUri]
  )
  return (
    <div className="mb-10 flex flex-col items-center gap-4 scroll-smooth will-change-scroll">
      <div className="md:w-[36rem] w-[28rem] flex items-center justify-between">
        <div className="flex items-center">
          <span className="font-space font-bold">{current}</span>
          <span className="px-2 text-xs scale-75 opacity-50">|</span>
          <span className="font-space font-medium capitalize">
            {babes[current - 1]?.id}
          </span>
        </div>
        <ActionFeature
          label="Voice"
          icon="voice-solid"
          fn={() => console.log('babes.tsx', 'voice')}
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
                src={babe.src}
                alt={babe.src}
                width={0}
                height={0}
                className="lg:h-[28rem] select-none h-[22rem] w-auto rounded-2xl aspect-auto"
                unoptimized
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
          name="quotes"
          size={28}
          className="rotate-180 opacity-50 text-teal-500"
        />
        <p className="text-center font-space text-base italic text-neutral-500">
          {babes[current - 1]?.greeting}
        </p>

        <Icon name="quotes" size={28} className="opacity-10" />
      </div>
    </div>
  )
}

export const Pro = () => (
  <div
    className={cn(
      'bg-slate-300 text-teal-950 h-[11px] border-0 border-red-500 rounded-tl-[2.75px] rounded-e-xl flex items-center justify-center'
    )}
  >
    <span className="ps-[1.5px] pe-[2.25px] font-space pb-[2.5px] text-lg scale-105 -tracking-wide">
      pro
    </span>
  </div>
)

interface ActionFeatureProps {
  label: string
  icon: IconName
  fn: VoidFunction
}
export const ActionFeature = ({ icon, label, fn }: ActionFeatureProps) => (
  <button
    onClick={fn}
    className="font-space font-medium rounded-full flex items-center justify-center space-x-2 border border-primary bg-primary ps-1 pe-1.5 text-sm py-1 text-teal-200 dark:bg-foreground/15 dark:border-foreground/10"
  >
    <Icon name={icon} size={16} /> <span>{label}</span>
    <Pro />
  </button>
)
