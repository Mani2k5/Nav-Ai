/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LiveAudioCallbacks {
  onAudioDataReceived?: (data: string) => void;
  onInterrupted?: () => void;
  onRouteUpdated?: (route: any, stepIndex: number) => void;
  onStepAdvanced?: (stepIndex: number) => void;
  onArrived?: (destination: string) => void;
  onTextMessage?: (text: string) => void;
  onError?: (err: string) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onSpeakingVolume?: (volume: number) => void; // For live phone call wave animation
}

export class AudioLiveManager {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private callbacks: LiveAudioCallbacks = {};
  private isConnected: boolean = false;
  private animFrameId: number | null = null;
  private isMuted: boolean = false;

  constructor(callbacks: LiveAudioCallbacks) {
    this.callbacks = callbacks;
  }

  public async connect(): Promise<void> {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = async () => {
          this.isConnected = true;
          this.callbacks.onConnectionChange?.(true);
          try {
            await this.startMicCapture();
            this.initAudioPlayback();
            resolve();
          } catch (micErr: any) {
            console.warn('Microphone permission blocked or unavailable:', micErr);
            // Even if mic is blocked, the user can still hear incoming audio or use text!
            this.initAudioPlayback();
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'audio' && data.audio) {
              this.playPcmChunk(data.audio);
            } else if (data.type === 'interrupted') {
              this.handleInterruption();
              this.callbacks.onInterrupted?.();
            } else if (data.type === 'route_updated') {
              this.callbacks.onRouteUpdated?.(data.route, data.stepIndex || 0);
            } else if (data.type === 'step_advanced') {
              this.callbacks.onStepAdvanced?.(data.stepIndex);
            } else if (data.type === 'arrived') {
              this.callbacks.onArrived?.(data.destination);
            } else if (data.type === 'text') {
              this.callbacks.onTextMessage?.(data.text);
            } else if (data.type === 'error') {
              this.callbacks.onError?.(data.message);
            }
          } catch (e) {
            // non-json
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.callbacks.onConnectionChange?.(false);
          this.cleanup();
        };

        this.ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          this.callbacks.onError?.('Live audio connection failed');
          reject(err);
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public sendTextMessage(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ text }));
    }
  }

  public syncSession(originNodeId: string, destinationNodeId: string, stepFreeOnly: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'sync_session',
          originNodeId,
          destinationNodeId,
          stepFreeOnly,
        })
      );
    }
  }

  private async startMicCapture() {
    this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 16000,
    });

    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      },
    });

    const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
    // Buffer size 2048 at 16kHz is ~128ms per chunk for low latency
    this.processor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);

    source.connect(this.processor);
    this.processor.connect(this.inputAudioCtx.destination);

    this.processor.onaudioprocess = (e) => {
      if (this.isMuted || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const base64Audio = this.floatTo16BitPCMBase64(inputData);
      this.ws.send(JSON.stringify({ audio: base64Audio }));
    };
  }

  private initAudioPlayback() {
    // 24kHz AudioContext matching Gemini Live output
    this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000,
    });
    this.analyser = this.outputAudioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.connect(this.outputAudioCtx.destination);

    this.startVolumeTracker();
  }

  private playPcmChunk(base64Audio: string) {
    if (!this.outputAudioCtx || !this.analyser) return;

    if (this.outputAudioCtx.state === 'suspended') {
      this.outputAudioCtx.resume();
    }

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert 16-bit PCM Little Endian to Float32
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);

      const now = this.outputAudioCtx.currentTime;
      // Schedule gaplessly
      const startTime = Math.max(now, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.push(source);
      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx > -1) this.activeSources.splice(idx, 1);
      };
    } catch (err) {
      console.error('Error decoding audio chunk:', err);
    }
  }

  private handleInterruption() {
    for (const src of this.activeSources) {
      try {
        src.stop();
      } catch (e) {
        // already stopped
      }
    }
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextStartTime = this.outputAudioCtx.currentTime;
    }
  }

  private startVolumeTracker() {
    const update = () => {
      if (this.analyser && this.callbacks.onSpeakingVolume) {
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        const avg = sum / (data.length || 1);
        this.callbacks.onSpeakingVolume(avg / 255); // 0.0 to 1.0
      }
      this.animFrameId = requestAnimationFrame(update);
    };
    update();
  }

  private floatTo16BitPCMBase64(input: Float32Array): string {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(output.buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.handleInterruption();
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx) {
      this.inputAudioCtx.close();
      this.inputAudioCtx = null;
    }
    if (this.outputAudioCtx) {
      this.outputAudioCtx.close();
      this.outputAudioCtx = null;
    }
  }
}
