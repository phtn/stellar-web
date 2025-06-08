import { Icon } from '@/lib/icons'

const Loading = async () => {
  return (
    <div className="w-7xl h-[80vh] bg-sidebar/10 flex items-center justify-center">
      <div className="size-96 flex items-center justify-center relative">
        <Icon
          solid
          name="wing"
          className="text-sidebar/40 right-32 rotate-6 size-[72rem] absolute"
        />
        <Icon
          solid
          name="wing"
          className="text-zinc-800 right-32 rotate-12 size-[56.5rem] absolute"
        />
        <Icon
          solid
          name="wing"
          className="text-zinc-950/90 right-32 rotate-12 size-[56rem] absolute"
        />

        <Icon
          solid
          name="wing"
          className="text-sidebar/40 left-32 -scale-x-[1] -rotate-12 size-[64rem] absolute"
        />
        <Icon
          solid
          name="wing"
          className="text-zinc-800 left-32 -scale-x-[1] -rotate-12 size-[56.5rem] absolute"
        />
        <Icon
          solid
          name="wing"
          className="text-zinc-950/90 -scale-x-[1] -rotate-12 left-32 size-[56rem] absolute"
        />
        <Icon
          solid
          name="wing"
          className="text-orange-300 -left-48 rotate-[16deg] top-24 size-96 absolute"
        />

        <Icon
          solid
          name="wing"
          className="text-orange-300 -right-48 -rotate-[16deg] top-24 -scale-x-[1] size-96 absolute"
        />
        <div className="flex items-center justify-center rounded-full size-36 aspect-square bg-teal-300 absolute">
          <Icon
            solid
            strokeWidth={0}
            name="spinners-bars-middle"
            className="text-neutral-800 size-16"
          />
        </div>
      </div>
    </div>
  )
}
export default Loading
