import type { ActionEffects } from '../engine/types';

type SfxName = ActionEffects['sfx'][number];

class RetroSfxEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(value: boolean): void {
    this.muted = value;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(
    freq: number,
    durationSec: number,
    type: OscillatorType,
    gainVal: number,
    delaySec = 0,
    endFreq?: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const start = ctx.currentTime + delaySec;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + durationSec);
    }

    gain.gain.setValueAtTime(gainVal, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + durationSec + 0.01);
  }

  play(name: SfxName): void {
    if (this.muted) return;
    switch (name) {
      case 'click':
        this.tone(540, 0.04, 'square', 0.04, 0, 720);
        break;
      case 'accept':
        this.tone(520, 0.06, 'triangle', 0.06, 0);
        this.tone(780, 0.09, 'triangle', 0.06, 0.05);
        break;
      case 'reject':
        this.tone(420, 0.06, 'square', 0.05, 0, 290);
        break;
      case 'hallucination':
        this.tone(180, 0.14, 'sawtooth', 0.08, 0, 110);
        this.tone(140, 0.14, 'sawtooth', 0.07, 0.11, 95);
        break;
      case 'ship':
        this.tone(523, 0.08, 'triangle', 0.07, 0);
        this.tone(659, 0.08, 'triangle', 0.07, 0.07);
        this.tone(784, 0.12, 'triangle', 0.08, 0.14);
        this.tone(1046, 0.18, 'triangle', 0.08, 0.22);
        break;
      case 'mcb_trip':
        this.tone(140, 0.12, 'sawtooth', 0.12, 0, 50);
        this.tone(90, 0.16, 'square', 0.1, 0.05, 40);
        break;
      case 'mcb_restore':
        this.tone(240, 0.06, 'square', 0.08, 0, 480);
        this.tone(640, 0.12, 'triangle', 0.07, 0.06);
        break;
      case 'upgrade':
        this.tone(440, 0.07, 'triangle', 0.07, 0);
        this.tone(660, 0.08, 'triangle', 0.07, 0.06);
        this.tone(880, 0.14, 'triangle', 0.08, 0.12);
        break;
      case 'email':
        this.tone(740, 0.05, 'sine', 0.05, 0);
        this.tone(988, 0.08, 'sine', 0.05, 0.05);
        break;
      case 'story':
        this.tone(392, 0.09, 'triangle', 0.07, 0);
        this.tone(523, 0.09, 'triangle', 0.07, 0.09);
        this.tone(659, 0.16, 'triangle', 0.08, 0.18);
        break;
    }
  }
}

export const sfx = new RetroSfxEngine();
