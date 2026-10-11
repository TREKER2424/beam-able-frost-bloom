class AudioBus {
  private ctx: AudioContext | null = null;
  private crowd: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private alive = false;
  private bassAt = 0;
  private step = 0;

  unlock() {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      const ctx = new AC();
      this.ctx = ctx;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 900;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
      this.filter = filter;
      this.crowd = gain;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMatch(on: boolean) {
    this.alive = on;
    if (!on && this.crowd && this.ctx) this.crowd.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
  }

  update(dt: number, volume: number, muffled: boolean) {
    if (!this.ctx || !this.crowd || !this.filter || !this.alive) return;
    const v = Math.max(0, Math.min(1, volume));
    this.crowd.gain.setTargetAtTime(v * 0.045, this.ctx.currentTime, 0.12);
    this.filter.frequency.setTargetAtTime(muffled ? 400 : 1400, this.ctx.currentTime, 0.08);
    this.bassAt -= dt;
    if (this.bassAt <= 0) {
      this.bassAt = 0.5;
      this.tone(this.step % 4 === 0 ? 82 : 55, 0.09, v * 0.05);
      if (this.step % 8 === 4) {
        const notes = [220, 247, 294, 330];
        this.tone(notes[Math.floor(this.step / 8) % notes.length] ?? 220, 0.12, v * 0.03);
      }
      this.step++;
    }
  }

  private tone(freq: number, dur: number, gain: number) {
    if (!this.ctx || gain <= 0 || !Number.isFinite(freq) || !Number.isFinite(gain)) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  suppressed = false;

  kick() {
    if (this.suppressed) return;
    this.tone(140, 0.07, 0.08);
  }

  whistle() {
    if (this.suppressed) return;
    this.tone(1480, 0.18, 0.05);
    this.tone(1760, 0.12, 0.03);
  }

  goal() {
    if (this.suppressed || !this.crowd || !this.ctx || typeof window === "undefined") return;
    this.crowd.gain.setTargetAtTime(0.12, this.ctx.currentTime, 0.05);
    [392, 494, 587, 784].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.18, 0.06), i * 120);
    });
  }
}

export const audio = new AudioBus();
