import { cohere } from '@ai-sdk/cohere'
import { streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30
const instructions = process.env.INSTRUCTIONS

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: cohere('command-a-03-2025'),
    temperature: 0.9,
    messages: [
      {
        role: 'system',
        content: instructions
      },
      ...messages
    ]
  })

  return result.toDataStreamResponse()
}
