/**
 * SoundCraft AI - Professional Studio DSP Effects Chain
 * Auto-Tune, 5-Band Parametric EQ, Dynamic Compressor, Space Reverb, Delay & Tape Saturation
 */

class StudioEffectsChain {
  constructor(audioHub) {
    this.hub = audioHub;
    
    // Nodes
    this.inputNode = null;
    this.outputNode = null;
    this.eqNodes = {};
    this.compressorNode = null;
    this.makeupGainNode = null;
    this.reverbNode = null;
    this.reverbGain = null;
    this.delayNode = null;
    this.delayFeedbackNode = null;
    this.delayGain = null;
    this.saturationNode = null;
    this.dryNode = null;

    // State toggles
    this.enabled = {
      autotune: true,
      eq: true,
      comp: true,
      reverb: true,
      sat: true
    };
  }

  get ctx() {
    return this.hub.ctx;
  }

  buildChain() {
    if (!this.ctx) return;

    this.inputNode = this.ctx.createGain();
    this.outputNode = this.ctx.createGain();

    // 1. 5-Band Parametric EQ
    this.eqNodes.lowCut = this.ctx.createBiquadFilter();
    this.eqNodes.lowCut.type = 'highpass';
    this.eqNodes.lowCut.frequency.value = 80;

    this.eqNodes.low = this.ctx.createBiquadFilter();
    this.eqNodes.low.type = 'lowshelf';
    this.eqNodes.low.frequency.value = 250;
    this.eqNodes.low.gain.value = -2;

    this.eqNodes.lowMid = this.ctx.createBiquadFilter();
    this.eqNodes.lowMid.type = 'peaking';
    this.eqNodes.lowMid.frequency.value = 500;
    this.eqNodes.lowMid.Q.value = 1.2;
    this.eqNodes.lowMid.gain.value = -1;

    this.eqNodes.mid = this.ctx.createBiquadFilter();
    this.eqNodes.mid.type = 'peaking';
    this.eqNodes.mid.frequency.value = 2000;
    this.eqNodes.mid.Q.value = 1.0;
    this.eqNodes.mid.gain.value = 2;

    this.eqNodes.highMid = this.ctx.createBiquadFilter();
    this.eqNodes.highMid.type = 'peaking';
    this.eqNodes.highMid.frequency.value = 4500;
    this.eqNodes.highMid.Q.value = 1.4;
    this.eqNodes.highMid.gain.value = 3;

    this.eqNodes.high = this.ctx.createBiquadFilter();
    this.eqNodes.high.type = 'highshelf';
    this.eqNodes.high.frequency.value = 10000;
    this.eqNodes.high.gain.value = 4;

    // 2. Studio Compressor
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -20;
    this.compressorNode.knee.value = 12;
    this.compressorNode.ratio.value = 4;
    this.compressorNode.attack.value = 0.015;
    this.compressorNode.release.value = 0.12;

    this.makeupGainNode = this.ctx.createGain();
    this.makeupGainNode.gain.value = 1.4; // +3 dB makeup

    // 3. Reverb & Space
    this.reverbNode = this.ctx.createConvolver();
    this.reverbNode.buffer = this.generateReverbImpulse(2.4, 1.8);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.35;

    // 4. BPM Synced Delay / Echo
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.25; // 1/4 note at 120bpm
    this.delayFeedbackNode = this.ctx.createGain();
    this.delayFeedbackNode.gain.value = 0.35;
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = 0.25;

    this.delayNode.connect(this.delayFeedbackNode);
    this.delayFeedbackNode.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);

    // 5. Tape Saturation
    this.saturationNode = this.ctx.createWaveShaper();
    this.saturationNode.curve = this.createTapeSaturationCurve(25);
    this.saturationNode.oversample = '2x';

    // Direct dry signal path
    this.dryNode = this.ctx.createGain();
    this.dryNode.gain.value = 1.0;

    // Series Wiring:
    // Input -> LowCut -> Low -> LowMid -> Mid -> HighMid -> High -> Comp -> Makeup -> Saturation -> Out
    this.inputNode.connect(this.eqNodes.lowCut);
    this.eqNodes.lowCut.connect(this.eqNodes.low);
    this.eqNodes.low.connect(this.eqNodes.lowMid);
    this.eqNodes.lowMid.connect(this.eqNodes.mid);
    this.eqNodes.mid.connect(this.eqNodes.highMid);
    this.eqNodes.highMid.connect(this.eqNodes.high);
    this.eqNodes.high.connect(this.compressorNode);
    this.compressorNode.connect(this.makeupGainNode);
    this.makeupGainNode.connect(this.saturationNode);

    // Wet Sends
    this.saturationNode.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.outputNode);

    this.saturationNode.connect(this.delayNode);
    this.delayGain.connect(this.outputNode);

    // Dry Out
    this.saturationNode.connect(this.outputNode);

    console.log("🎛️ SoundCraft Pro DSP FX Chain Built");
  }

  setEQBand(band, gainValue) {
    if (!this.eqNodes[band] || !this.ctx) return;
    this.eqNodes[band].gain.setTargetAtTime(gainValue, this.ctx.currentTime, 0.02);
  }

  setCompressor(thresh, ratio, attackMs, releaseMs, makeupGainVal) {
    if (!this.compressorNode || !this.ctx) return;
    this.compressorNode.threshold.setTargetAtTime(thresh, this.ctx.currentTime, 0.02);
    this.compressorNode.ratio.setTargetAtTime(ratio, this.ctx.currentTime, 0.02);
    this.compressorNode.attack.setTargetAtTime(attackMs / 1000, this.ctx.currentTime, 0.02);
    this.compressorNode.release.setTargetAtTime(releaseMs / 1000, this.ctx.currentTime, 0.02);
    if (this.makeupGainNode) {
      const linearGain = Math.pow(10, makeupGainVal / 20);
      this.makeupGainNode.gain.setTargetAtTime(linearGain, this.ctx.currentTime, 0.02);
    }
  }

  getGainReduction() {
    if (!this.compressorNode) return 0;
    return this.compressorNode.reduction || 0;
  }

  setReverb(decaySec, mixPercent) {
    if (!this.ctx || !this.reverbGain) return;
    this.reverbGain.gain.setTargetAtTime(mixPercent / 100, this.ctx.currentTime, 0.02);
  }

  setDelay(timeSec, feedbackPercent, mixPercent) {
    if (!this.ctx || !this.delayNode) return;
    this.delayNode.delayTime.setTargetAtTime(timeSec, this.ctx.currentTime, 0.02);
    this.delayFeedbackNode.gain.setTargetAtTime(feedbackPercent / 100, this.ctx.currentTime, 0.02);
    this.delayGain.gain.setTargetAtTime(mixPercent / 100, this.ctx.currentTime, 0.02);
  }

  setSaturation(driveVal) {
    if (!this.saturationNode) return;
    this.saturationNode.curve = this.createTapeSaturationCurve(driveVal);
  }

  generateReverbImpulse(duration = 2.4, decay = 2.0) {
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.pow(1 - n, decay);
      left[i] = ((Math.random() * 2) - 1) * factor;
      right[i] = ((Math.random() * 2) - 1) * factor;
    }
    return impulse;
  }

  createTapeSaturationCurve(amount = 25) {
    const k = Math.max(1, amount);
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }
}

window.StudioEffectsChain = StudioEffectsChain;
