class AudioBus {
  private ctx: AudioContext | null = null;
  private crowd: GainNode | null = null;
  private murmur: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private mid: BiquadFilterNode | null = null;
  private alive = false;
  private phrase = 0;
  private nextChant = 1.4;
  ui = true;
  suppressed = false;

  unlock() {
    this.ctxOnly();
    const ctx = this.ctx;
    if (!ctx || this.crowd) {
      if (ctx?.state === "suspended") void ctx.resume();
      return;
    }
    const seconds = 3;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.985 * b0 + 0.015 * white;
      b1 = 0.9 * b1 + 0.1 * white;
      data[i] = b0 * 0.82 + b1 * 0.28;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 380;
    const mid = ctx.createBiquadFilter();
    mid.type = "bandpass";
    mid.frequency.value = 640;
    mid.Q.value = 0.45;
      const lowGain = ctx.createGain();
      lowGain.gain.value = 0;
      const midGain = ctx.createGain();
      midGain.gain.value = 0;
      const sum = ctx.createGain();
      sum.gain.value = 1;
      src.connect(low);
      low.connect(lowGain);
      src.connect(mid);
      mid.connect(midGain);
      lowGain.connect(sum);
      midGain.connect(sum);
      sum.connect(ctx.destination);
      src.start();
      this.filter = low;
      this.mid = mid;
      this.crowd = lowGain;
      this.murmur = midGain;
    if (ctx.state === "suspended") void ctx.resume();
  }

  setMatch(on: boolean) {
    this.alive = on;
    if (!on && this.ctx) {
      const t = this.ctx.currentTime;
      this.crowd?.gain.setTargetAtTime(0, t, 0.12);
      this.murmur?.gain.setTargetAtTime(0, t, 0.12);
    }
  }

  update(dt: number, volume: number, muffled: boolean, heat = 0) {
    if (!this.ctx || !this.crowd || !this.murmur || !this.filter || !this.mid || !this.alive) return;
    const v = Math.max(0, Math.min(1, volume));
    const h = Math.max(0, Math.min(1, heat));
    this.phrase += dt;
    const swell = 0.55 + 0.45 * Math.sin(this.phrase * 0.85) * Math.sin(this.phrase * 0.23);
    const bed = (muffled ? 0.05 : 0.085 + h * 0.05 + swell * 0.02) * v;
    const chat = (muffled ? 0.022 : 0.04 + h * 0.045) * v;
    const t = this.ctx.currentTime;
    this.crowd.gain.setTargetAtTime(bed, t, 0.25);
    this.murmur.gain.setTargetAtTime(chat, t, 0.18);
    this.filter.frequency.setTargetAtTime(muffled ? 220 : 300 + h * 90, t, 0.3);
    this.mid.frequency.setTargetAtTime(muffled ? 480 : 520 + h * 180, t, 0.25);
    this.nextChant -= dt;
    if (this.nextChant <= 0) {
      this.nextChant = (muffled ? 3.6 : 1.8) + Math.random() * 1.8 - h * 0.6;
      this.chant(h, v * (muffled ? 0.4 : 1));
      if (h > 0.72 && Math.random() < 0.22) this.clap(v * 0.35, h);
    }
  }

  private chant(heat: number, volume: number) {
    if (!this.ctx || volume <= 0) return;
    const t = this.ctx.currentTime;
    const dur = 0.7 + heat * 0.55;
    const noise = this.ctx.createBufferSource();
    const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      const env = Math.sin((i / data.length) * Math.PI);
      brown = 0.94 * brown + 0.06 * (Math.random() * 2 - 1);
      data[i] = brown * env;
    }
    noise.buffer = buffer;
    const band = this.ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 280 + heat * 160 + Math.random() * 40;
    band.Q.value = 0.7;
    const g = this.ctx.createGain();
    const peak = volume * (0.05 + heat * 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.16);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    noise.connect(band);
    band.connect(g);
    g.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + dur + 0.02);
  }

  private clap(volume: number, heat: number) {
    if (!this.ctx || volume <= 0) return;
    const beats = 1 + Math.floor(heat * 1.2);
    for (let i = 0; i < beats; i++) {
      const t = this.ctx.currentTime + i * (0.28 + heat * 0.06);
      const noise = this.ctx.createBufferSource();
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.09), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let brown = 0;
      for (let n = 0; n < data.length; n++) {
        brown = 0.86 * brown + 0.14 * (Math.random() * 2 - 1);
        data[n] = brown * Math.pow(1 - n / data.length, 1.6);
      }
      noise.buffer = buffer;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 380;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0002, volume * 0.007), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      noise.connect(lp);
      lp.connect(g);
      g.connect(this.ctx.destination);
      noise.start(t);
      noise.stop(t + 0.1);
    }
  }

  click() {
    if (!this.ui || this.suppressed) return;
    try {
      this.ctxOnly();
      this.tone(520, 0.018, 0.0032, "sine");
    } catch {
      /* щелчок меню не должен срывать нажатие */
    }
  }

  private ctxOnly() {
    if (typeof window === "undefined") return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) this.ctx = new AC();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = "sine") {
    if (!this.ctx || gain <= 0 || !Number.isFinite(freq) || !Number.isFinite(gain)) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  kick() {
    if (this.suppressed) return;
    try {
      this.ctxOnly();
      this.thud();
    } catch {
      /* удар мяча не должен срывать кадр */
    }
  }

  private thud() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const dur = 0.06;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      brown = 0.82 * brown + 0.18 * (Math.random() * 2 - 1);
      data[i] = brown * Math.pow(1 - i / data.length, 1.4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 160;
    const g = ctx.createGain();
    g.gain.value = 0.07;
    src.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  whistle() {
    if (this.suppressed) return;
    this.tone(1480, 0.12, 0.02);
    this.tone(1760, 0.08, 0.012);
  }

  goal() {
    if (this.suppressed || !this.ctx || typeof window === "undefined") return;
    const t = this.ctx.currentTime;
    this.crowd?.gain.setTargetAtTime(0.16, t, 0.05);
    this.murmur?.gain.setTargetAtTime(0.09, t, 0.05);
    this.chant(1, 1);
    this.clap(1, 1);
  }
}

export const audio = new AudioBus();
