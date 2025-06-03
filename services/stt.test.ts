import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpeechToTextService } from './stt'

describe('SpeechToTextService', () => {
  let originalSpeechRecognition: any
  let originalWebkitSpeechRecognition: any

  beforeEach(() => {
    // Save originals
    originalSpeechRecognition = globalThis.window.SpeechRecognition
    originalWebkitSpeechRecognition = globalThis.window.webkitSpeechRecognition
    // Mock the window object and SpeechRecognition
    globalThis.window = Object.create(window)
    class MockSpeechRecognition {
      addEventListener = vi.fn()
      start = vi.fn()
      stop = vi.fn()
      abort = vi.fn()
      continuous = false
      interimResults = false
      lang = 'en-US'
    }
    globalThis.window.SpeechRecognition = MockSpeechRecognition as any
    delete (globalThis.window as any).webkitSpeechRecognition
  })

  afterEach(() => {
    // Restore originals
    globalThis.window.SpeechRecognition = originalSpeechRecognition
    globalThis.window.webkitSpeechRecognition = originalWebkitSpeechRecognition
  })

  it('should instantiate and report support', () => {
    const service = new SpeechToTextService()
    expect(service.isSupported()).toBe(true)
  })

  it('should not be supported if SpeechRecognition is missing', () => {
    delete (globalThis.window as any).SpeechRecognition
    const service = new SpeechToTextService()
    expect(service.isSupported()).toBe(false)
  })
}) 