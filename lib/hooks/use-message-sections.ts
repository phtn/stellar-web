import { createSections } from '@/ctx/chat/helpers'
import { ChatSection } from '@/ctx/chat/types'
import { Message } from 'ai'
import { useCallback, useMemo, useState } from 'react'

interface UseMessageSectionsReturn {
  sections: ChatSection[]
  openStates: Record<string, boolean>
  handleOpenChange: (id: string, open: boolean) => void
  getIsOpen: (id: string, messageIndex?: number, lastUserIndex?: number) => boolean
  toggleSection: (id: string) => void
  openAllSections: () => void
  closeAllSections: () => void
}

export function useMessageSections(messages: Message[]): UseMessageSectionsReturn {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({})

  // Memoize sections creation
  const sections = useMemo(() => {
    return messages ? createSections(messages) : []
  }, [messages])

  // Handle open state changes
  const handleOpenChange = useCallback((id: string, open: boolean) => {
    setOpenStates((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: open
    }))
  }, [])

  // Toggle section open state
  const toggleSection = useCallback((id: string) => {
    setOpenStates((prev: Record<string, boolean>) => ({
      ...prev,
      [id]: !prev[id]
    }))
  }, [])

  // Get if a section is open
  const getIsOpen = useCallback((
    id: string,
    messageIndex?: number,
    lastUserIndex?: number
  ): boolean => {
    // Check explicit open state first
    if (openStates[id] !== undefined) {
      return openStates[id]
    }

    // For tool calls, default to open
    if (id.includes('call')) {
      return true
    }

    // Handle related questions or other special IDs
    const baseId = id.endsWith('-related') ? id.slice(0, -8) : id

    // Check if we have an explicit state for the base ID
    if (openStates[baseId] !== undefined) {
      return openStates[baseId]
    }

    // Use message position if provided
    if (messageIndex !== undefined && lastUserIndex !== undefined && lastUserIndex !== -1) {
      return messageIndex >= lastUserIndex
    }

    // Default to true
    return true
  }, [openStates])

  // Open all sections
  const openAllSections = useCallback(() => {
    const allOpen: Record<string, boolean> = {}
    sections.forEach((section: ChatSection) => {
      allOpen[section.id] = true
      section.assistantMessages.forEach((msg: Message) => {
        allOpen[msg.id] = true
      })
    })
    setOpenStates(allOpen)
  }, [sections])

  // Close all sections
  const closeAllSections = useCallback(() => {
    setOpenStates({})
  }, [])

  return {
    sections,
    openStates,
    handleOpenChange,
    getIsOpen,
    toggleSection,
    openAllSections,
    closeAllSections
  }
}