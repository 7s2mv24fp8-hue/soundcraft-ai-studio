/**
 * SoundCraft AI - Web Audio Context & Central Routing Hub
 */

class StudioAudioContext {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.meterAnalyserL = null;
    this.meterAnalyserR = null;
    this.splitter = null;
    this.isInitialized = false;

    // Stem Buses
    this.buses = {
      drums: null,
      bass: null,
      synth: null,
      chords: null,
      vocal: null,
      fx: null
    };

    // Stem Gains & Pans
    this.stemControls = {
      drums: { gain: null, panner: null, volume: 0.85, pan: 0, muted: false, solo: false },
      bass: { gain: null, panner: null, volume: 0.9, pan: 0, muted: false, solo: false },
      synth: { gain: null, panner: null, volume: 0.75, pan: 0.15, muted: false, solo: false },
      chords: { gain: null, panner: null, volume: 0.7, pan: -0.15, muted: false, solo: false },
      vocal: { gain: null, panner: null, volume: 1.0, pan: 0, muted: false, solo: false },
      fx: { gain: null, panner: null, volume: 0.65, pan: 0, muted: false, solo: false }
    };
  }

  async init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return this.ctx;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 48000
    });

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.9, this.ctx.currentTime);

    // Spectrum Analyzer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;

    // Stereo split meters
    this.splitter = this.ctx.createChannelSplitter(2);
    this.meterAnalyserL = this.ctx.createAnalyser();
    this.meterAnalyserL.fftSize = 256;
    this.meterAnalyserR = this.ctx.createAnalyser();
    this.meterAnalyserR.fftSize = 256;

    // Create stem buses
    Object.keys(this.buses).forEach(stem => {
      const busGain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
      
      busGain.gain.value = this.stemControls[stem].volume;
      this.stemControls[stem].gain = busGain;
      this.stemControls[stem].panner = panner;

      if (panner) {
        panner.pan.value = this.stemControls[stem].pan;
        busGain.connect(panner);
        this.buses[stem] = busGain;
      } else {
        this.buses[stem] = busGain;
      }
    });

    this.isInitialized = true;
    console.log("⚡ SoundCraft AudioContext Initialized at 48kHz");
    return this.ctx;
  }

  connectBusToMaster(busNode) {
    if (!this.masterGain) return;
    busNode.connect(this.masterGain);
  }

  setStemVolume(stem, value) {
    if (!this.stemControls[stem]) return;
    this.stemControls[stem].volume = value;
    if (this.stemControls[stem].gain && this.ctx) {
      const vol = this.stemControls[stem].muted ? 0 : value;
      this.stemControls[stem].gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02);
    }
  }

  setStemPan(stem, value) {
    if (!this.stemControls[stem]) return;
    this.stemControls[stem].pan = value;
    if (this.stemControls[stem].panner && this.ctx) {
      this.stemControls[stem].panner.pan.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  setStemMute(stem, isMuted) {
    if (!this.stemControls[stem]) return;
    this.stemControls[stem].muted = isMuted;
    this.updateStemMuteSolo();
  }

  setStemSolo(stem, isSolo) {
    if (!this.stemControls[stem]) return;
    this.stemControls[stem].solo = isSolo;
    this.updateStemMuteSolo();
  }

  updateStemMuteSolo() {
    const anySolo = Object.values(this.stemControls).some(s => s.solo);
    Object.keys(this.stemControls).forEach(stem => {
      const ctrl = this.stemControls[stem];
      let targetGain = ctrl.volume;
      if (ctrl.muted) {
        targetGain = 0;
      } else if (anySolo && !ctrl.solo) {
        targetGain = 0;
      }
      if (ctrl.gain && this.ctx) {
        ctrl.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02);
      }
    });
  }

  getPeakLevels() {
    if (!this.meterAnalyserL || !this.meterAnalyserR) return { l: 0, r: 0 };
    const bufferL = new Uint8Array(this.meterAnalyserL.frequencyBinCount);
    const bufferR = new Uint8Array(this.meterAnalyserR.frequencyBinCount);
    this.meterAnalyserL.getByteTimeDomainData(bufferL);
    this.meterAnalyserR.getByteTimeDomainData(bufferR);

    let maxL = 0, maxR = 0;
    for (let i = 0; i < bufferL.length; i++) {
      const valL = Math.abs((bufferL[i] - 128) / 128);
      const valR = Math.abs((bufferR[i] - 128) / 128);
      if (valL > maxL) maxL = valL;
      if (valR > maxR) maxR = valR;
    }
    return { l: maxL, r: maxR };
  }
}

window.studioContext = new StudioAudioContext();
