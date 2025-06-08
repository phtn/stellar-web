'use client'

import { useToggle } from '@/lib/hooks/use-toggle'
import { cn } from '@/lib/utils'
import { HyperList } from '@/components/hyper/list'
import { useCopy } from '@/lib/hooks/use-copy'
import Link from 'next/link'
import { useCallback } from 'react'
import { Toc } from './toc'
import type {
  BodyProps,
  ContentProps,
  FooterProps,
  HeaderProps,
  ImportantMessageProps,
  Section
} from './types'
import { IconBtn } from '@/components/icon-btn'
import { Icon } from '@/lib/icons'
import { Button } from '@/components/ui'

export const Content = ({
  company,
  footer,
  important_message,
  sections,
  title
}: ContentProps) => {
  const { on, toggle } = useToggle()

  return (
    <div className="bg-white dark:bg-transparent font-inter transition-colors duration-300 md:min-h-screen">
      <Toc
        sections={sections}
        footer={{ ...footer, company }}
        isOpen={on}
        toggleFn={toggle}
      />
      <Header company={company} title={title} toggle={toggle} />
      <main className="container mx-auto h-[80vh] max-w-4xl overflow-y-scroll p-2 sm:px-6 lg:px-8">
        <Body sections={sections} message={important_message} />
        <Footer company={company} {...footer} />
      </main>
    </div>
  )
}

const Header = ({ company, title, toggle }: HeaderProps) => (
  <div className="mx-auto flex max-w-4xl items-center justify-between border-b-[0.33px] border-primary-200 py-4 ps-4 sm:px-6 md:p-2 lg:px-8">
    <h1 className="w-fit space-x-2 whitespace-nowrap font-inter text-xl font-medium capitalize tracking-tighter md:text-3xl">
      <span className="font-extrabold">{company}</span>{' '}
      <span className="font-light">{title}</span>
    </h1>
    <section className="flex w-fit space-x-2 pe-2 sm:space-x-6 md:space-x-6 md:pe-2">
      <div>
        <IconBtn
          //
          btnProps={{
            id: 'content-list',
            onClick: toggle
          }}
          icon="share"
        />
      </div>
      <div className="w-fit">
        <IconBtn
          btnProps={{ id: 'print', onClick: () => window.print() }}
          icon="printer"
        />
      </div>
    </section>
  </div>
)

const Body = (props: BodyProps) => (
  <div className="container mx-auto">
    <ImportantMessage message={props.message} />
    <HyperList
      data={props.sections}
      component={Article}
      keyId="keyId"
      container="py-8 space-y-14 px-1 scroll-smooth"
    />
  </div>
)

const ImportantMessage = ({ message }: ImportantMessageProps) => (
  <div className="my-8 max-w-2xl">
    <div className="mx-2 h-6 w-fit rounded-t-[4px] px-3 py-1 text-[11px] font-semibold uppercase dark:text-indigo-100 text-sky-700">
      important to read
    </div>
    <section
      className={cn(
        'mx-2 flex space-x-2 rounded-lg rounded-tl-none border-1.5 border-teal-400 dark:bg-sidebar bg-sky-100 py-4 pe-4 ps-2 text-justify font-inter shadow-sm'
      )}
    >
      <div className="flex size-8 flex-shrink-0 items-start justify-center p-1">
        <Icon
          name="square-arrow-right"
          className="size-4 stroke-0 dark:text-teal-300 text-sky-700"
        />
      </div>
      <p className="text-base font-light leading-6 dark:text-teal-100  text-sky-900">
        {message}
      </p>
    </section>
  </div>
)

const Article = ({ id, title, content, keyId }: Section) => {
  const { copy } = useCopy({ timeout: 2000 })
  const handleCopyContent = useCallback(async () => {
    copy(`${title} \n ${content}`)
  }, [copy, content, title])
  return (
    <section
      id={id}
      className={cn(
        'space-y-2 rounded-lg border-[0.33px] border-sidebar-border dark:border-neutral-700 dark:bg-transparent text-justify font-inter',
        'group-hover/list:border-primary-300/60 group-hover/list:shadow-md shadow-neutral-300',
        'transition-all duration-300 overflow-hidden'
      )}
    >
      <div
        className={cn(
          'flex h-4 w-full items-center justify-between border-b-[0.33px] dark:border-neutral-600 px-2 py-8',
          'group-hover/list:border-primary-300/80 bg-sidebar dark:bg-transparent'
        )}
      >
        <h2
          className={cn(
            'flex items-center space-x-2 text-xl font-semibold tracking-tighter text-primary-900 px-2',
            'transition-transform duration-500 ease-out dark:text-orange-200/80 group-hover/list:translate-x-1'
          )}
        >
          <span className="text-base text-neutral-500 px-3">{keyId + 1}.</span>
          <span>{title}</span>
        </h2>
        <Button
          size="sm"
          className="mr-1 hidden dark:hover:bg-sidebar bg-transparent text-center align-middle animate-enter group-hover/list:flex"
          onClick={handleCopyContent}
        >
          <Icon name="copy-outline" className="size-5 text-foreground/60" />
        </Button>
      </div>
      <p className="p-5 leading-relaxed dark:bg-sidebar tracking-tight text-primary-700">
        {content}
      </p>
    </section>
  )
}

const Footer = ({ company, label, href }: FooterProps) => (
  <footer className="flex items-center justify-between px-2 py-4 text-center text-xs capitalize leading-none tracking-tighter text-primary">
    <div className="flex w-full items-start justify-between">
      <p className="capitalize">
        <span>&copy;&nbsp;{new Date().getFullYear()}</span>
        <span className="font-semibold">&nbsp;&nbsp;{company}</span>
      </p>
      <div className="justify-start">
        <p className="font-semibold">February 17, 2025</p>
        <p className="text-left text-tiny tracking-tight opacity-80">
          Last updated
        </p>
      </div>

      <Link
        href={href}
        className="flex items-center gap-1 dark:text-teal-400 hover:underline"
      >
        {label} <Icon name="square-arrow-right" className="size-4" />
      </Link>
    </div>
  </footer>
)
