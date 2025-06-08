import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook to manage scroll/auto-scroll logic for chat UI.
 * Handles scroll container ref, isAtBottom state, and scrolling to sections.
 */
export function useAutoScroll() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  /**
   * Handle scroll event to update isAtBottom state.
   */
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const threshold = 50 // threshold in pixels
    if (scrollHeight - scrollTop - clientHeight < threshold) {
      setIsAtBottom(true)
    } else {
      setIsAtBottom(false)
    }
  }, [])

  /**
   * Scroll to a specific section by sectionId.
   */
  const scrollToSection = useCallback((sectionId: string) => {
    requestAnimationFrame(() => {
      const sectionElement = document.getElementById(`section-${sectionId}`)
      sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  // Attach/detach scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return {
    scrollContainerRef,
    isAtBottom,
    scrollToSection
  }
} 