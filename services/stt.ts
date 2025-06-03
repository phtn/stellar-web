// TypeScript type declarations for browser SpeechRecognition APIs
// These are needed for type safety and to resolve linter errors

declare global {
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }
  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }
  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    addEventListener(
      type: 'result',
      listener: (event: SpeechRecognitionEvent) => void
    ): void;
    addEventListener(
      type: 'error',
      listener: (event: SpeechRecognitionErrorEvent) => void
    ): void;
    addEventListener(type: 'end', listener: () => void): void;
    addEventListener(type: 'start', listener: () => void): void;
  }
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface STTOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
  maxDurationMs?: number; // Maximum recording duration in milliseconds
  onResult?: (finalTranscript: string, interimTranscript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechToTextService {
  private recognition: SpeechRecognition | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isRecording = false;
  private options: STTOptions = {};

  constructor(options: STTOptions = {}) {
    this.options = options;
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = options.continuous ?? false;
        this.recognition.interimResults = options.interimResults ?? true;
        this.recognition.lang = options.lang ?? 'en-US';
        this.attachListeners();
      }
    }
  }

  private attachListeners() {
    if (!this.recognition) return;
    this.recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      this.options.onResult?.(finalTranscript, interimTranscript);
    });
    this.recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
      this.isRecording = false;
      this.clearTimeout();
      this.options.onError?.(event.error);
    });
    this.recognition.addEventListener('end', () => {
      this.isRecording = false;
      this.clearTimeout();
      this.options.onEnd?.();
    });
  }

  public start() {
    if (!this.recognition || this.isRecording) return;
    this.isRecording = true;
    this.recognition.start();
    if (this.options.maxDurationMs) {
      this.timeoutId = setTimeout(() => {
        this.stop();
      }, this.options.maxDurationMs);
    }
  }

  public stop() {
    if (!this.recognition || !this.isRecording) return;
    this.recognition.stop();
    this.isRecording = false;
    this.clearTimeout();
  }

  public abort() {
    if (!this.recognition || !this.isRecording) return;
    this.recognition.abort();
    this.isRecording = false;
    this.clearTimeout();
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  public isSupported() {
    return !!(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }
} 