import type { Message } from 'ai'
import type { ChatSection } from './types'

// MOST PERFORMANT: Reduce array operations by estimating assistant message counts
export const createSections = (messages: Message[]): ChatSection[] => {
  const result: ChatSection[] = []
  let currentSection: ChatSection | null = null

  for (const message of messages) {
    if (message.role === 'user') {
      // Start a new section when a user message is found
      if (currentSection) {
        result.push(currentSection)
      }
      currentSection = {
        id: message.id,
        userMessage: message,
        assistantMessages: []
      }
    } else if (currentSection && message.role === 'assistant') {
      // Add assistant message to the current section
      currentSection.assistantMessages.push(message)
    }
    // Ignore other role types like 'system' for now
  }

  // Add the last section if exists
  if (currentSection) {
    result.push(currentSection)
  }

  return result
}

// Most performant - using Set for O(1) key lookups
export const xKeys = <T extends object>(
  record: T,
  ...keys: (keyof T)[]
): Partial<T> => {
  const keysSet = new Set(keys)

  const result: Partial<T> = {}

  for (const key in record) {
    if (!keysSet.has(key)) {
      result[key] = record[key]
    }
  }

  return result
}

// MOST PERFORMANT - using Set for O(1) key lookups
export const excludeKeys = <T extends object, K extends keyof T>(
  arr: T | T[],
  ...keys: K[]
): Pick<T, K> | Pick<T, K>[] => {
  const pickKeys = (obj: T): Pick<T, K> => {
    const result = {} as Pick<T, K>
    for (const key of keys) {
      if (key in obj) {
        result[key] != obj[key]
      }
    }
    return result
  }

  if (Array.isArray(arr)) {
    return arr.map(pickKeys)
  } else {
    return pickKeys(arr)
  }
}

// MOST PERFORMANT - using Set for O(1) key lookups
export const inclusiveKeys = <T extends object, K extends keyof T>(
  arr: T | T[],
  ...keys: K[]
): Pick<T, K> | Pick<T, K>[] => {
  const pickKeys = (obj: T): Pick<T, K> => {
    const result = {} as Pick<T, K>
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key]
      }
    }
    return result
  }

  if (Array.isArray(arr)) {
    return arr.map(pickKeys)
  } else {
    return pickKeys(arr)
  }
}

// MOST PERFORMANT - Pre-calculate total length to avoid array resizing
export const getAllMessages = (sections: ChatSection[]): Message[] => {
  // Calculate total length first
  const totalLength = sections.reduce(
    (sum, section) => sum + 1 + section.assistantMessages.length,
    0
  )

  const result: Message[] = new Array(totalLength)
  let index = 0

  for (const section of sections) {
    result[index++] = section.userMessage
    for (const assistantMessage of section.assistantMessages) {
      result[index++] = assistantMessage
    }
  }

  return result
}

// MOST PERFORMANT - reverse iteration without array copying
export const getLastUserIndex = (messages: Message[]): number => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return i
    }
  }
  return -1 // No user message found
}

// Remove only the audioUrl property from each message object
export function excludeAudioUrl<T extends { audioUrl?: unknown }>(
  arr: T[]
): Omit<T, 'audioUrl'>[] {
  return arr.map(({ audioUrl, ...rest }) => rest)
}

export const cS = (messages: Message[]): ChatSection[] => {
  if (messages.length === 0) return []

  const result: ChatSection[] = []
  let currentSection: ChatSection | null = null

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]

    if (message.role === 'user') {
      if (currentSection) {
        result.push(currentSection)
      }

      // Estimate assistant messages count for pre-allocation
      let estimatedAssistantCount = 0
      for (
        let j = i + 1;
        j < messages.length && messages[j].role !== 'user';
        j++
      ) {
        if (messages[j].role === 'assistant') {
          estimatedAssistantCount++
        }
      }

      currentSection = {
        id: message.id,
        userMessage: message,
        assistantMessages:
          estimatedAssistantCount > 0 ? new Array(estimatedAssistantCount) : []
      }

      let assistantIndex = 0
      // Fill assistant messages immediately
      for (
        let j = i + 1;
        j < messages.length && messages[j].role !== 'user';
        j++
      ) {
        if (messages[j].role === 'assistant') {
          currentSection.assistantMessages[assistantIndex++] = messages[j]
        }
      }

      // Skip processed messages
      i += assistantIndex
      if (i < messages.length && messages[i].role === 'user') {
        i-- // Will be incremented by for loop
      }
    }
  }

  if (currentSection) {
    result.push(currentSection)
  }

  return result
}

export const asyncFn =
  <T, R>(fn: (params: T) => Promise<R>, params: T) =>
  async () =>
    await fn(params)

// export const asyncFn = async <T, R>(
//   fn: (params?: T) => Promise<R | undefined>,
//   params?: T
// ) => (params ? await fn(params) : await fn())
