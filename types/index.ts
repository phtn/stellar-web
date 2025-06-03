export type WebSocketState = 0 | 1 | 2 | 3 // Numeric values for WebSocket states

export interface ModelAuthor {
  _id: string
  nickname: string
  avatar: string
}

export interface ModelItem {
  _id: string
  type: string
  title: string
  description: string
  cover_image: string
  train_mode: string
  state: string
  tags: string[]
  samples: string[]
  created_at: string
  updated_at: string
  languages: string[]
  visibility: string
  lock_visibility: boolean
  like_count: number
  mark_count: number
  shared_count: number
  task_count: number
  unliked: boolean
  liked: boolean
  marked: boolean
  author: ModelAuthor
}

export interface ModelResponse {
  total: number
  items: ModelItem[]
}

export interface ModelListParams {
  page_size?: number
  page_number?: number
  title?: string
  tag?: string[] | string
  self?: boolean
  author_id?: string
  language?: string[] | string
  title_language?: string[] | string
  sort_by?: string
}

export interface WSMessage {
  event: string
  audio?: Uint8Array
  message?: string
}

// PLAYHT
export interface PlayHTVoice {
  id: string
  name: string
  sample_rate: number
  language: string
  language_code: string
  gender: string
  age: string
  accent: string
  style: string
  tempo: string
  loudness: string
  texture: string
  is_cloned: boolean
  voice_engine: string
}

export interface PlayHTVoicesResponse {
  voices: PlayHTVoice[]
}

export type PlayHTVoiceEngine =
  | 'PlayHT1.0'
  | 'PlayHT2.0'
  | 'PlayHT2.0-turbo'
  | 'Play3.0-mini'
  | 'PlayDialog'
  | 'PlayDialog-turbo'

export type PlayHTDialogEngine =
  | 'Play3.0-mini'
  | 'PlayDialog'
  | 'PlayDialogArabic'
  | 'PlayDialogMultilingual'
export interface PlayHTStreamRequest {
  text: string
  voice: string
  output_format: 'mp3' | 'wav' | 'ogg' | 'flac'
  voice_engine: PlayHTVoiceEngine
  emotion?:
    | 'female_happy'
    | 'female_sad'
    | 'female_angry'
    | 'female_fearful'
    | 'female_disgust'
    | 'female_surprised'
    | 'male_happy'
    | 'male_sad'
    | 'male_angry'
    | 'male_fearful'
    | 'male_disgust'
    | 'male_surprised'
  /**
   * @type {number}
   * A number between 1 and 6.
   * Use lower numbers to reduce how unique your chosen voice will be
   * compared to other voices. Higher numbers will maximize its individuality.
   */
  voice_guidance?: number // 1 to 6
  /**
   * @type {number}
   * A number between 1 and 30.
   * Use lower numbers to to reduce how strong your chosen emotion will be.
   * Higher numbers will create a very emotional performance.
   */
  style_guidance?: number // 1 to 30
  speed?: number // 0.1 to 5.0
  sample_rate?: 22050 | 24000 | 44100 | 48000
  seed?: number
  temperature?: number // 0.1 to 2.0
}

export interface PlayHTStreamResponse {
  url: string
}

export interface PlayHTWebSocketMessage {
  type: 'audio' | 'error' | 'done' | 'start' | 'end'
  data?: Uint8Array
  message?: string
}

export interface PlayHT_WSAuthResponse {
  websocket_urls: Record<PlayHTDialogEngine, string | URL>
  expires_at: Date
}
