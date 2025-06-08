import { cn } from '@/lib/utils'
import { HyperList } from '@/components/hyper/list'
import Link from 'next/link'
import type { TocProps, Section, FooterProps } from './types'
import { Icon } from '@/lib/icons'

export const Toc = ({ sections, isOpen, toggleFn, footer }: TocProps) => {
  return (
    <div
      className={cn(
        'fixed top-16 left-0 z-50 h-fit  w-[--sidebar-width] overflow-hidden rounded-e-xl bg-sidebar ',
        'transition-all duration-300',
        {
          'translate-x-0': isOpen
        }
      )}
    >
      <Contents sections={sections} />
      <TocFooter {...footer} />
    </div>
  )
}

const Contents = (props: { sections: Section[] }) => (
  <div className="space-y-4 overflow-y-auto px-2 py-6">
    <h2 className="mb-4 ps-3 font-inter font-semibold tracking-tighter dark:text-chalk">
      Table of Contents
    </h2>
    <nav className="space-y-1">
      <HyperList data={props.sections} component={SectionItem} keyId="keyId" />
    </nav>
  </div>
)

const SectionItem = (section: Section) => (
  <a
    key={section.id}
    href={`#${section.id}`}
    className="flex space-x-2 rounded-xl p-2 text-xs text-primary-300 transition-colors duration-300 dark:hover:bg-indigo-100/5 hover:bg-teal-600/15"
  >
    <div className="relative flex size-8 items-center justify-center">
      <Icon
        name="squircle"
        className="absolute size-7 text-white dark:text-neutral-600/10"
      />
      <p className="absolute text-sm font-semibold dark:text-neutral-400">
        {section.keyId + 1}
      </p>
    </div>
    <div className="flex items-center font-inter font-medium tracking-tight dark:text-indigo-50/80">
      {section.title}
    </div>
  </a>
)

const TocFooter = ({ label, href, company }: FooterProps) => (
  <div className="flex h-12 w-full items-center justify-between gap-2 border-t-[0.33px] border-sidebar-border px-4 text-xs capitalize tracking-tight text-primary-400">
    <div className="flex gap-2">
      <Link href={'/'}>
        <span>&copy;&nbsp;{new Date().getFullYear()}</span>
        <span className="font-medium">&nbsp;&nbsp;{company}</span>
      </Link>
    </div>
    <Link
      href={href}
      className="flex items-center gap-2 dark:text-indigo-300 hover:underline"
    >
      {label}
      <Icon name="square-arrow-right" className="size-4" />
    </Link>
  </div>
)
