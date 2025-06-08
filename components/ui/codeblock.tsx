'use client'

import { useCopy } from '@/lib/hooks/use-copy'
import { generateId } from 'ai'
import {
  CSSProperties,
  Dispatch,
  FC,
  memo,
  SetStateAction,
  useCallback,
  useState
} from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  dracula,
  xonokai,
  nightOwl,
  synthwave84,
  materialDark,
  a11yDark
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { IconBtn } from '../icon-btn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './dropdown-menu'

interface Props {
  language: string
  value: string
}

interface languageMap {
  [key: string]: string | undefined
}

export const programmingLanguages: languageMap = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  perl: '.pl',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css'
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
}

const styles = {
  dracula,
  xonokai,
  nightOwl,
  synthwave84,
  materialDark,
  a11yDark
}

const CodeBlock: FC<Props> = memo(({ language, value }) => {
  const { isCopied, copy } = useCopy({ timeout: 2000 })

  const downloadAsFile = () => {
    if (typeof window === 'undefined') {
      return
    }
    const fileExtension = programmingLanguages[language] || '.file'
    const suggestedFileName = `file-${generateId()}${fileExtension}`
    const fileName = window.prompt('Enter file name', suggestedFileName)

    if (!fileName) {
      // User pressed cancel on prompt.
      return
    }

    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const onCopy = () => {
    if (isCopied) return
    copy(value)
  }

  const [styleName, setStyleName] = useState<keyof typeof styles>('synthwave84')

  return (
    <div className="relative w-full font-sans codeblock bg-neutral-800">
      <div className="flex items-center justify-between w-full px-6 py-1 pr-4 bg-neutral-700 text-zinc-100">
        <span className="text-xs lowercase">{language}</span>
        <div className="flex items-center space-x-1">
          <StyleSelector styles={styles} setStyleName={setStyleName} />
          <IconBtn
            size={32}
            icon="download-linear"
            btnProps={{ onClick: downloadAsFile }}
            hoverStyle="group-hover:text-stone-400/20"
            iconStyle="text-stone-300 group-hover:text-teal-300"
          />
          <IconBtn
            size={32}
            btnProps={{ onClick: onCopy }}
            hoverStyle="group-hover:text-stone-400/20"
            icon={isCopied ? 'check-circle' : 'copy-outline'}
            iconStyle="text-stone-300 group-hover:text-teal-300"
          />
        </div>
      </div>
      <SyntaxHighlighter
        PreTag="div"
        showLineNumbers
        language={language}
        style={styles[styleName]}
        customStyle={{
          margin: 0,
          width: '100%',
          padding: '1.5rem 1rem',
          background: 'transparent'
        }}
        lineNumberStyle={{
          userSelect: 'none'
        }}
        codeTagProps={{
          style: {
            fontSize: '0.9rem',
            fontFamily: 'var(--font-mono)'
          }
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  )
})
CodeBlock.displayName = 'CodeBlock'

interface StyleSelectorProps {
  styles: Record<string, Record<string, CSSProperties>>
  setStyleName: Dispatch<SetStateAction<keyof typeof styles>>
}

// Add a type guard for style keys
function isStyleKey(key: string): key is keyof typeof styles {
  return key in styles
}

const StyleSelector = ({ styles, setStyleName }: StyleSelectorProps) => {
  const handleSet = useCallback(
    (name: keyof typeof styles) => () => {
      if (isStyleKey(name)) setStyleName(name)
    },
    [setStyleName]
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <IconBtn
          size={32}
          icon="paint-bucket"
          btnProps={{ asChild: true }}
          iconStyle="text-stone-300 group-hover:text-teal-300"
          hoverStyle="group-hover:text-stone-400/20"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {Object.keys(styles)
          .filter(isStyleKey)
          .map(name => (
            <DropdownMenuItem key={name} onClick={handleSet(name)}>
              <span className="font-space">{name}</span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { CodeBlock }
