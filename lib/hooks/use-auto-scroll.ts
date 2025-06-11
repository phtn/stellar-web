import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAutoScrollOptions {
  threshold?: number
  throttleDelay?: number
}

/**
 * Custom hook to manage scroll/auto-scroll logic for chat UI.
 * Handles scroll container ref, isAtBottom state, and scrolling to sections.
 */
export function useAutoScroll(options: UseAutoScrollOptions = {}) {
  const { threshold = 50, throttleDelay = 100 } = options
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Handle scroll event to update isAtBottom state with throttling.
   */
  const handleScroll = useCallback(() => {
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    // Throttle the scroll handler
    scrollTimeoutRef.current = setTimeout(() => {
      const container = scrollContainerRef.current
      if (!container) return
      
      const { scrollTop, scrollHeight, clientHeight } = container
      const newIsAtBottom = scrollHeight - scrollTop - clientHeight < threshold
      
      // Only update state if value changed to avoid unnecessary re-renders
      setIsAtBottom((prev: boolean) => prev !== newIsAtBottom ? newIsAtBottom : prev)
    }, throttleDelay)
  }, [threshold, throttleDelay])

  /**
   * Scroll to a specific section by sectionId.
   */
  const scrollToSection = useCallback((sectionId: string) => {
    const sectionElement = document.getElementById(`section-${sectionId}`)
    sectionElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /**
   * Scroll to bottom of the container.
   */
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current
    if (!container) return
    
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }, [])

  // Attach/detach scroll event listener
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Set initial state
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  return {
    scrollContainerRef,
    isAtBottom,
    scrollToSection,
    scrollToBottom
  }
} 