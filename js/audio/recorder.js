/**
 * SoundCraft AI - Vocal & Instrument Recording Studio Engine
 * Handles low-latency audio stream, direct monitoring, waveform buffers, and demo vocals
 */

class VocalStudioRecorder {
  constructor(audioHub) {
    this.hub = audioHub;
    this.stream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordedBuffer = null;
    this.isRecording = false;
    this.directMonitor = false;
    this.inputGainVal = 1.0;
    this.micGainNode = null;
    this.monitorGainNode = null;
    this.micSource = null;
    this.activeVocalSource = null;

    this.takes = []; // List of recorded takes
    this.onWaveformUpdate = null;
  }

  get ctx() {
    return this.hub.ctx;
  }

  async initMic() {
    if (this.stream) return true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0
        }
      });

      if (!this.ctx) await this.hub.init();

      this.micSource = this.ctx.createMediaStreamSource(this.stream);
      this.micGainNode = this.ctx.createGain();
      this.micGainNode.gain.value = this.inputGainVal;

      this.monitorGainNode = this.ctx.createGain();
      this.monitorGainNode.gain.value = this.directMonitor ? 0.8 : 0;

      // Connect mic to gain
      this.micSource.connect(this.micGainNode);
      
      // Connect to monitor -> Master output
      this.micGainNode.connect(this.monitorGainNode);
      this.monitorGainNode.connect(this.ctx.destination);

      // Connect to vocal bus for processing
      if (this.hub.buses.vocal) {
        this.micGainNode.connect(this.hub.buses.vocal);
      }

      console.log("🎤 Studio Microphone Initialized");
      return true;
    } catch (err) {
      console.warn("Microphone access not granted or unavailable, demo mode ready:", err);
      return false;
    }
  }

  setInputGain(value) {
    this.inputGainVal = value;
    if (this.micGainNode && this.ctx) {
      this.micGainNode.gain.setTargetAtTime(value, this.ctx.currentTime, 0.02);
    }
  }

  toggleDirectMonitor(enabled) {
    this.directMonitor = enabled;
    if (this.monitorGainNode && this.ctx) {
      this.monitorGainNode.gain.setTargetAtTime(enabled ? 0.8 : 0, this.ctx.currentTime, 0.02);
    }
  }

  async startRecording() {
    if (!this.stream) {
      const ok = await this.initMic();
      if (!ok) {
        throw new Error("Microphone permission required. Or click 'Load Demo Vocal' to test instantly!");
      }
    }

    if (!this.ctx) await this.hub.init();

    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();
      this.recordedBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      const newTake = {
        id: Date.now(),
        name: `Vocal Take #${this.takes.length + 1}`,
        buffer: this.recordedBuffer,
        duration: this.recordedBuffer.duration.toFixed(1) + 's',
        blob: audioBlob
      };

      this.takes.push(newTake);
      if (this.onWaveformUpdate) {
        this.onWaveformUpdate(this.recordedBuffer);
      }
    };

    this.mediaRecorder.start(50);
    this.isRecording = true;
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
    }
  }

  // Playback recorded vocal buffer in sync
  playVocal(time = 0, offset = 0) {
    if (!this.recordedBuffer || !this.ctx) return;
    this.stopVocal();

    const t = time || this.ctx.currentTime;
    const dest = this.hub.buses.vocal || this.hub.masterGain;

    const source = this.ctx.createBufferSource();
    source.buffer = this.recordedBuffer;
    source.connect(dest);
    source.start(t, offset);
    this.activeVocalSource = source;
  }

  stopVocal() {
    if (this.activeVocalSource) {
      try {
        this.activeVocalSource.stop();
      } catch (e) {}
      this.activeVocalSource = null;
    }
  }

  // Load High-Fidelity Demo Vocal synthesized in key
  generateDemoVocal(keyName = 'A minor') {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const duration = 7.38; // 2 bars at 130 BPM
    const buffer = this.ctx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Synthesize vocal melody formants with melodic notes (A4, C5, D5, E5)
    const melodyNotes = [
      { freq: 440.0, start: 0.0, end: 0.8 },
      { freq: 523.25, start: 0.9, end: 1.6 },
      { freq: 587.33, start: 1.8, end: 2.5 },
      { freq: 659.25, start: 2.7, end: 3.5 },
      { freq: 523.25, start: 3.7, end: 4.4 },
      { freq: 440.0, start: 4.6, end: 5.4 },
      { freq: 392.0, start: 5.6, end: 6.4 },
      { freq: 440.0, start: 6.5, end: 7.2 }
    ];

    for (let i = 0; i < buffer.length; i++) {
      const time = i / sampleRate;
      let sample = 0;

      for (const note of melodyNotes) {
        if (time >= note.start && time < note.end) {
          const noteTime = time - note.start;
          const noteDur = note.end - note.start;
          // Smooth ADSR envelope
          const env = Math.sin((noteTime / noteDur) * Math.PI);
          // Fundamental voice + human vowel formants (Ah/Oh vowel resonances)
          const f0 = note.freq;
          const f1 = 800; // formant 1
          const f2 = 1200; // formant 2
          const vib = Math.sin(2 * Math.PI * 5.5 * time) * 4; // vocal vibrato

          sample = (
            Math.sin(2 * Math.PI * (f0 + vib) * time) * 0.5 +
            Math.sin(2 * Math.PI * f1 * time) * 0.25 +
            Math.sin(2 * Math.PI * f2 * time) * 0.15
          ) * env * 0.6;
          break;
        }
      }

      left[i] = sample;
      right[i] = sample;
    }

    this.recordedBuffer = buffer;
    const demoTake = {
      id: Date.now(),
      name: `🔥 Hit Studio Lead Vocal (${keyName})`,
      buffer: buffer,
      duration: `${duration.toFixed(1)}s`,
      isDemo: true
    };
    this.takes = [demoTake];

    if (this.onWaveformUpdate) {
      this.onWaveformUpdate(buffer);
    }
    return demoTake;
  }
}

window.VocalStudioRecorder = VocalStudioRecorder;
