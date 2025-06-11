import { JSONValue, ToolInvocation } from 'ai'
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
      .filter((item) => 
        typeof item === 'object' && 
        item !== null && 
        'type' in item && 
        (item as any).type === 'tool_call'
      )
      .map((item): ToolInvocation => {
        const toolData = item as unknown as ToolCallData
        return {
          state: toolData.data.state,
          toolCallId: toolData.data.toolCallId,
          toolName: toolData.data.toolName,
          args: parseJSON(toolData.data.args),
          result: parseJSON(toolData.data.result)
        } as ToolInvocation
      })
  }, [data, parseJSON])

  // Get the last tool call
  const lastToolData = useMemo(() => {
    return toolCalls.length > 0 ? toolCalls[toolCalls.length - 1] : null
  }, [toolCalls])

  // Get pending tool calls (calls without results)
  const pendingToolCalls = useMemo(() => {
    return toolCalls.filter((tool: ToolInvocation) => tool.state === 'call')
  }, [toolCalls])

  // Get completed tool calls
  const completedToolCalls = useMemo(() => {
    return toolCalls.filter((tool: ToolInvocation) => tool.state === 'result')
  }, [toolCalls])

  // Find tool by ID
  const findToolById = useCallback((toolCallId: string) => {
    return toolCalls.find((tool: ToolInvocation) => tool.toolCallId === toolCallId)
  }, [toolCalls])

  return {
    toolCalls,
    lastToolData,
    pendingToolCalls,
    completedToolCalls,
    findToolById
  }
}
