import { JSONValue } from 'ai'
import { useCallback, useMemo } from 'react'

interface ToolCallData {
  type: 'tool_call'
  data: {
    toolCallId: string
    state: 'call' | 'result'
    toolName: string
    args: string
    result?: string
  }
}

interface ParsedToolData {
  state: 'call' | 'result'
  toolCallId: string
  toolName: string
  args?: any
  result?: any
}

export const useTools = (data: JSONValue[] | undefined) => {
  // Safely parse JSON with error handling
  const parseJSON = useCallback((str: string | undefined): any => {
    if (!str || str === 'undefined') return undefined
    try {
      return JSON.parse(str)
    } catch (error) {
      console.error('Failed to parse tool JSON:', error)
      return undefined
    }
  }, [])

  // Get all tool calls from the data
  const toolCalls = useMemo(() => {
    if (!data || !Array.isArray(data)) return []
    
    return data
      .filter((item): item is ToolCallData => 
        typeof item === 'object' && 
        item !== null && 
        'type' in item && 
        item.type === 'tool_call'
      )
      .map((item): ParsedToolData => ({
        state: item.data.state,
        toolCallId: item.data.toolCallId,
        toolName: item.data.toolName,
        args: parseJSON(item.data.args),
        result: parseJSON(item.data.result)
      }))
  }, [data, parseJSON])

  // Get the last tool call
  const lastToolData = useMemo(() => {
    return toolCalls.length > 0 ? toolCalls[toolCalls.length - 1] : null
  }, [toolCalls])

  // Get pending tool calls (calls without results)
  const pendingToolCalls = useMemo(() => {
    return toolCalls.filter((tool: ParsedToolData) => tool.state === 'call' && !tool.result)
  }, [toolCalls])

  // Get completed tool calls
  const completedToolCalls = useMemo(() => {
    return toolCalls.filter((tool: ParsedToolData) => tool.state === 'result' || tool.result !== undefined)
  }, [toolCalls])

  // Find tool by ID
  const findToolById = useCallback((toolCallId: string) => {
    return toolCalls.find((tool: ParsedToolData) => tool.toolCallId === toolCallId)
  }, [toolCalls])

  return {
    toolCalls,
    lastToolData,
    pendingToolCalls,
    completedToolCalls,
    findToolById
  }
}
