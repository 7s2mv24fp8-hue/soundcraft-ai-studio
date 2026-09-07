/**
 * SoundCraft AI - Professional Sound Synthesis Engine
 * Drum Synthesis, 808 Bass, Polyphonic Chords & Melodic Lead Synths
 */

class SoundSynthesisEngine {
  constructor(audioHub) {
    this.hub = audioHub;
  }

  get ctx() {
    return this.hub.ctx;
  }

  get buses() {
    return this.hub.buses;
  }

  // --- 1. DRUM SYNTHESIS ---

  playKick(time = 0, velocity = 1.0) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.drums || this.hub.masterGain;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pitch sweep: 150Hz -> 42Hz for punchy low-end thud
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    // Amplitude envelope
    gain.gain.setValueAtTime(1.0 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    // Click transient generator
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(300, t);
    clickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.02);
    clickGain.gain.setValueAtTime(0.4 * velocity, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.36);
    clickOsc.start(t);
    clickOsc.stop(t + 0.03);
  }

  playSnare(time = 0, velocity = 1.0) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.drums || this.hub.masterGain;

    // 1. Body tone (Pitched Tri/Sine)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.08);

    oscGain.gain.setValueAtTime(0.7 * velocity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(dest);

    // 2. Snare White Noise burst
    const noiseNode = this.createNoiseBufferNode();
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1200;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.85 * velocity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.16);
    noiseNode.start(t);
    noiseNode.stop(t + 0.24);
  }

  playHiHat(time = 0, velocity = 0.8, open = false) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.drums || this.hub.masterGain;
    const duration = open ? 0.3 : 0.06;

    const noise = this.createNoiseBufferNode();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8500;
    filter.Q.value = 4.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime((open ? 0.7 : 0.5) * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noise.start(t);
    noise.stop(t + duration + 0.02);
  }

  // --- 2. 808 SUB BASS ---

  play808Bass(note = 'C2', time = 0, duration = 0.45, velocity = 1.0) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.bass || this.hub.masterGain;
    const freq = typeof note === 'number' ? note : this.noteToFreq(note);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const drive = this.ctx.createWaveShaper();

    // Saturated sub tone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);

    // Warm analog saturation curve
    drive.curve = this.makeDistortionCurve(18);
    drive.oversample = '2x';

    gain.gain.setValueAtTime(0.95 * velocity, t);
    gain.gain.setValueAtTime(0.85 * velocity, t + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(drive);
    drive.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // --- 3. HARMONIC CHORDS & LO-FI RHODES ---

  playChord(notes = ['C4', 'E4', 'G4', 'B4'], time = 0, duration = 0.8, velocity = 0.7, style = 'rhodes') {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.chords || this.hub.masterGain;

    notes.forEach((note, idx) => {
      const freq = typeof note === 'number' ? note : this.noteToFreq(note);
      
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      if (style === 'rhodes') {
        // Bell-like electric piano / Rhodes EP
        osc1.type = 'sine';
        osc2.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, t);
        osc2.frequency.setValueAtTime(freq * 2.0, t); // harmonic chime

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, t);
        filter.frequency.exponentialRampToValueAtTime(800, t + duration);

        gain.gain.setValueAtTime(0.25 * velocity, t + idx * 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      } else {
        // Lush Analog Synth Pad
        osc1.type = 'sawtooth';
        osc2.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq - 0.7, t); // subtle detune
        osc2.frequency.setValueAtTime(freq + 0.7, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.frequency.exponentialRampToValueAtTime(450, t + duration);

        gain.gain.setValueAtTime(0.18 * velocity, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      }

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + duration + 0.05);
      osc2.stop(t + duration + 0.05);
    });
  }

  // --- 4. MELODIC LEAD SYNTH ---

  playLeadNote(note = 'C5', time = 0, duration = 0.25, velocity = 0.75) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.synth || this.hub.masterGain;
    const freq = typeof note === 'number' ? note : this.noteToFreq(note);

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    // Pluck filter envelope
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3800, t);
    filter.frequency.exponentialRampToValueAtTime(800, t + duration);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.35 * velocity, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + duration + 0.03);
  }

  // --- 5. FX (VINYL, RISER) ---

  playFX(type = 'vinyl', time = 0, duration = 0.5) {
    if (!this.ctx) return;
    const t = time || this.ctx.currentTime;
    const dest = this.buses.fx || this.hub.masterGain;

    if (type === 'vinyl') {
      const noise = this.createNoiseBufferNode();
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1800;
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(t);
      noise.stop(t + duration + 0.05);
    }
  }

  // --- UTILITIES ---

  createNoiseBufferNode() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    return noise;
  }

  makeDistortionCurve(amount = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  noteToFreq(note) {
    if (typeof note === 'number') return note;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const regex = /^([A-G]#?)(-?\d+)$/;
    const match = note.match(regex);
    if (!match) return 440;
    const noteName = match[1];
    const octave = parseInt(match[2], 10);
    const noteIndex = notes.indexOf(noteName);
    const midi = (octave + 1) * 12 + noteIndex;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
}

window.SoundSynthesisEngine = SoundSynthesisEngine;
