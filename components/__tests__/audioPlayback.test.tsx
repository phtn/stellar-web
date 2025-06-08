import { render } from '@testing-library/react'
import { describe, expect, it } from 'bun:test'

// Minimal mock of AnswerSection for isolated test
function MockAnswerSection({ messageId, audioUrl }: { messageId: string, audioUrl?: string }) {
  return audioUrl ? (
    <audio data-testid={`audio-${messageId}`} src={audioUrl} />
  ) : null
}

describe('audio playback', () => {
  it('maps audioUrl to correct message id and renders audio element', () => {
    const messageId = 'msg-abc123'
    const audioUrl = 'https://storage.example.com/audio.mp3'

    // Simulate audioUrls state
    const audioUrls: Record<string, string> = { [messageId]: audioUrl }

    // Render the mock AnswerSection with the audioUrl
    const { getByTestId } = render(
      <MockAnswerSection messageId={messageId} audioUrl={audioUrls[messageId]} />
    )

    const audio = getByTestId(`audio-${messageId}`) as HTMLAudioElement
    expect(audio).toBeTruthy()
    expect(audio.src).toBe(audioUrl)
  })

  it('does not render audio element if audioUrl is missing', () => {
    const messageId = 'msg-xyz789'
    const { queryByTestId } = render(
      <MockAnswerSection messageId={messageId} audioUrl={undefined} />
    )
    expect(queryByTestId(`audio-${messageId}`)).toBeNull()
  })
}) 