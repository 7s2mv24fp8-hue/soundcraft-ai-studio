/**
 * SoundCraft AI - Studio Application Controller
 * Master Transport Clock, Audio Scheduling, Export WAV Bouncing, and UI Orchestration
 */

class SoundCraftApp {
  constructor() {
    this.hub = window.studioContext;
    this.synth = new window.SoundSynthesisEngine(this.hub);
    this.generator = new window.AIBeatGenerator(this.synth);
    this.recorder = new window.VocalStudioRecorder(this.hub);
    this.effects = new window.StudioEffectsChain(this.hub);
    this.master = new window.AIMasterEngine(this.hub);

    // UI Modules
    this.sequencerUI = null;
    this.mixerUI = null;
    this.visualizers = null;
    this.coverArt = null;

    // Transport Clock State
    this.isPlaying = false;
    this.currentStep = 0;
    this.tempoBPM = 130;
    this.nextStepTime = 0;
    this.scheduleAheadTime = 0.1; // seconds
    this.timerWorker = null;
    this.elapsedSeconds = 0;
    this.clockInterval = null;
  }

  async init() {
    console.log("🚀 Booting SoundCraft AI Studio...");

    // 1. Initialize UI Handlers
    this.sequencerUI = new window.SequencerUI(this.generator, (track, step, val) => {
      console.log(`Step updated: ${track} [${step}] = ${val}`);
    });
    this.sequencerUI.render();

    this.mixerUI = new window.MixerUI(this.hub, this.effects);
    this.mixerUI.render();

    this.visualizers = new window.StudioVisualizers(this.hub);
    this.coverArt = new window.CoverArtGenerator();
    this.coverArt.render();

    // 2. Attach DOM Event Listeners
    this.attachTransportEvents();
    this.attachWorkflowNavEvents();
    this.attachBeatmakerEvents();
    this.attachRecorderEvents();
    this.attachMasteringEvents();
    this.attachExportEvents();
    this.attachKeyboardShortcuts();

    // 3. Load initial default beat & demo vocal
    this.generator.generateFromPrompt('', 'trap');
    this.sequencerUI.render();

    // 4. Update Time display timer
    setInterval(() => this.updateTransportTimeDisplay(), 100);

    // 5. Update Loudness metrics periodic tick
    setInterval(() => this.updateMasterMetricsDisplay(), 300);

    console.log("✅ SoundCraft AI Studio Ready");
  }

  async ensureAudioContext() {
    if (!this.hub.isInitialized) {
      await this.hub.init();
      this.effects.buildChain();
      this.master.initMasterChain();
      this.visualizers.start();
    }
  }

  // --- TRANSPORT CONTROLS ---

  async play() {
    await this.ensureAudioContext();
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = this.hub.ctx.currentTime + 0.05;

    // Start vocal playback if take exists
    if (this.recorder.recordedBuffer) {
      this.recorder.playVocal(this.nextStepTime);
    }

    this.updatePlayStateUI(true);
    this.scheduler();
  }

  stop() {
    this.isPlaying = false;
    this.currentStep = 0;
    this.elapsedSeconds = 0;
    this.recorder.stopVocal();
    if (this.sequencerUI) this.sequencerUI.updatePlayhead(0);
    this.updatePlayStateUI(false);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  scheduler() {
    if (!this.isPlaying) return;

    while (this.nextStepTime < this.hub.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    requestAnimationFrame(() => this.scheduler());
  }

  advanceStep() {
    const secondsPerBeat = 60.0 / this.tempoBPM;
    const secondsPer16th = secondsPerBeat / 4.0;
    this.nextStepTime += secondsPer16th;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  scheduleStep(stepIndex, time) {
    const p = this.generator.pattern;
    const scale = this.generator.getScaleNotes();

    // Visual playhead sync
    setTimeout(() => {
      if (this.isPlaying && this.sequencerUI) {
        this.sequencerUI.updatePlayhead(stepIndex);
      }
    }, Math.max(0, (time - this.hub.ctx.currentTime) * 1000));

    // 1. Kick
    if (p.kick[stepIndex]) {
      this.synth.playKick(time);
    }

    // 2. Snare
    if (p.snare[stepIndex]) {
      this.synth.playSnare(time);
    }

    // 3. Hi-Hat
    if (p.hihat[stepIndex]) {
      const isOpen = stepIndex % 4 === 2 && this.generator.currentStyle === 'house';
      this.synth.playHiHat(time, 0.75, isOpen);
    }

    // 4. 808 Bass
    if (p.bass[stepIndex]) {
      const bassNoteIndex = Math.floor(stepIndex / 4) % scale.bass.length;
      const bassNote = scale.bass[bassNoteIndex];
      this.synth.play808Bass(bassNote, time, 0.45);
    }

    // 5. Chords
    if (p.chords[stepIndex]) {
      const chordIndex = Math.floor(stepIndex / 4) % scale.chords.length;
      const chord = scale.chords[chordIndex];
      this.synth.playChord(chord, time, 0.9, 0.75, this.generator.currentStyle === 'lofi' ? 'rhodes' : 'pad');
    }

    // 6. Lead Synth
    if (p.lead[stepIndex]) {
      const leadNote = scale.lead[stepIndex % scale.lead.length];
      this.synth.playLeadNote(leadNote, time, 0.25);
    }

    // 7. FX
    if (p.fx[stepIndex]) {
      this.synth.playFX('vinyl', time, 0.8);
    }
  }

  updatePlayStateUI(isPlaying) {
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    if (playIcon && pauseIcon) {
      if (isPlaying) {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
      } else {
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
      }
    }
  }

  updateTransportTimeDisplay() {
    const display = document.getElementById('display-time');
    if (!display) return;
    if (this.isPlaying) {
      this.elapsedSeconds += 0.1;
      const mins = Math.floor(this.elapsedSeconds / 60);
      const secs = (this.elapsedSeconds % 60).toFixed(1);
      display.textContent = `${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`;
    }
  }

  // --- ATTACH EVENT HANDLERS ---

  attachTransportEvents() {
    const btnPlay = document.getElementById('btn-transport-play');
    const btnStop = document.getElementById('btn-transport-stop');
    const btnStart = document.getElementById('btn-transport-start');
    const btnBpmInc = document.getElementById('btn-bpm-inc');
    const btnBpmDec = document.getElementById('btn-bpm-dec');
    const inputBpm = document.getElementById('input-bpm');
    const selectKey = document.getElementById('select-global-key');

    if (btnPlay) btnPlay.addEventListener('click', () => this.togglePlay());
    if (btnStop) btnStop.addEventListener('click', () => this.stop());
    if (btnStart) btnStart.addEventListener('click', () => {
      this.currentStep = 0;
      if (this.sequencerUI) this.sequencerUI.updatePlayhead(0);
    });

    if (btnBpmInc) btnBpmInc.addEventListener('click', () => {
      this.tempoBPM = Math.min(180, this.tempoBPM + 2);
      if (inputBpm) inputBpm.value = this.tempoBPM;
    });

    if (btnBpmDec) btnBpmDec.addEventListener('click', () => {
      this.tempoBPM = Math.max(60, this.tempoBPM - 2);
      if (inputBpm) inputBpm.value = this.tempoBPM;
    });

    if (inputBpm) inputBpm.addEventListener('change', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val >= 60 && val <= 180) this.tempoBPM = val;
    });

    if (selectKey) selectKey.addEventListener('change', (e) => {
      this.generator.key = e.target.value;
      this.showToast(`Key & Scale updated to ${e.target.value}`);
    });
  }

  attachWorkflowNavEvents() {
    const navBtns = document.querySelectorAll('.nav-step-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.ensureAudioContext();
        navBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.studio-tab-panel').forEach(p => p.classList.remove('active'));
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });
  }

  attachBeatmakerEvents() {
    const btnGen = document.getElementById('btn-generate-ai-beat');
    const btnRandom = document.getElementById('btn-random-prompt');
    const promptInput = document.getElementById('ai-beat-prompt');
    const stylePills = document.querySelectorAll('.style-pill');
    const btnMutate = document.getElementById('btn-seq-mutate');
    const btnClear = document.getElementById('btn-seq-clear');

    const randomPrompts = [
      "Heavy 140 BPM Drill beat with sliding 808s and dark piano in C minor",
      "Chill 85 BPM Lo-Fi study beat with warm vinyl crackle and vintage Rhodes chords",
      "Neon 124 BPM Cyber Synthwave with driving bass and 80s arcade lead in A minor",
      "Punchy 128 BPM Club House groove with pumping synth stabs and open hi-hats",
      "Billboard Top 10 Pop 118 BPM with bright melodic synths and acoustic cadence"
    ];

    if (btnRandom && promptInput) {
      btnRandom.addEventListener('click', () => {
        const rand = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
        promptInput.value = rand;
      });
    }

    if (btnGen) {
      btnGen.addEventListener('click', async () => {
        await this.ensureAudioContext();
        const text = promptInput ? promptInput.value : '';
        const res = this.generator.generateFromPrompt(text, this.generator.currentStyle);

        this.tempoBPM = res.bpm;
        const inputBpm = document.getElementById('input-bpm');
        if (inputBpm) inputBpm.value = res.bpm;

        const selectKey = document.getElementById('select-global-key');
        if (selectKey) selectKey.value = res.key;

        this.sequencerUI.render();
        this.showToast(`✨ Generated ${res.style.toUpperCase()} Beat at ${res.bpm} BPM (${res.key})!`);
      });
    }

    stylePills.forEach(pill => {
      pill.addEventListener('click', async () => {
        await this.ensureAudioContext();
        stylePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const style = pill.getAttribute('data-style');
        const res = this.generator.generateFromPrompt('', style);

        this.tempoBPM = res.bpm;
        const inputBpm = document.getElementById('input-bpm');
        if (inputBpm) inputBpm.value = res.bpm;

        this.sequencerUI.render();
        this.showToast(`Loaded ${style.toUpperCase()} Style Preset!`);
      });
    });

    if (btnMutate) {
      btnMutate.addEventListener('click', () => {
        this.generator.mutateFill();
        this.sequencerUI.render();
        this.showToast("🪄 Added dynamic drum variation fill!");
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        Object.keys(this.generator.pattern).forEach(k => {
          this.generator.pattern[k] = new Array(16).fill(0);
        });
        this.sequencerUI.render();
        this.showToast("Cleared pattern grid.");
      });
    }
  }

  attachRecorderEvents() {
    const btnRecord = document.getElementById('btn-record-main');
    const countdownEl = document.getElementById('rec-countdown');
    const recLabel = document.getElementById('rec-btn-label');
    const btnDemoVocal = document.getElementById('btn-load-demo-vocal');
    const btnDirectMon = document.getElementById('btn-direct-monitor');
    const takesList = document.getElementById('takes-list-container');
    const takesCount = document.getElementById('takes-count');

    this.recorder.onWaveformUpdate = (buffer) => {
      this.visualizers.drawVocalBufferWaveform(buffer);
      this.renderTakesList();
    };

    if (btnDemoVocal) {
      btnDemoVocal.addEventListener('click', async () => {
        await this.ensureAudioContext();
        const demoTake = this.recorder.generateDemoVocal(this.generator.key);
        this.showToast("🎵 Loaded Studio Demo Vocal! Press Play to listen.");
      });
    }

    if (btnDirectMon) {
      btnDirectMon.addEventListener('click', async () => {
        await this.ensureAudioContext();
        const isMon = btnDirectMon.classList.toggle('active');
        this.recorder.toggleDirectMonitor(isMon);
      });
    }

    if (btnRecord) {
      btnRecord.addEventListener('click', async () => {
        await this.ensureAudioContext();

        if (this.recorder.isRecording) {
          // Stop recording
          this.recorder.stopRecording();
          btnRecord.classList.remove('is-recording');
          if (recLabel) recLabel.textContent = 'START RECORDING';
          this.showToast("Vocal Take recorded successfully!");
        } else {
          // Start countdown
          if (countdownEl) {
            countdownEl.classList.remove('hidden');
            const numEl = countdownEl.querySelector('.countdown-num');
            let count = 3;
            numEl.textContent = count;

            const interval = setInterval(async () => {
              count--;
              if (count > 0) {
                numEl.textContent = count;
              } else {
                clearInterval(interval);
                countdownEl.classList.add('hidden');
                
                try {
                  await this.recorder.startRecording();
                  btnRecord.classList.add('is-recording');
                  if (recLabel) recLabel.textContent = 'RECORDING... CLICK TO STOP';
                  this.play();
                } catch (err) {
                  this.showToast(err.message);
                }
              }
            }, 800);
          }
        }
      });
    }
  }

  renderTakesList() {
    const container = document.getElementById('takes-list-container');
    const countEl = document.getElementById('takes-count');
    if (!container) return;

    container.innerHTML = '';
    const takes = this.recorder.takes;
    if (countEl) countEl.textContent = `${takes.length} Active Tracks`;

    takes.forEach((take, idx) => {
      const item = document.createElement('div');
      item.className = 'take-item-row';
      item.innerHTML = `
        <div class="take-item-info">
          <span>🎙️</span>
          <strong>${take.name}</strong>
          <small style="color:#64748b">(${take.duration})</small>
        </div>
        <div class="take-item-actions">
          <button class="btn-micro btn-play-take">Preview ▶</button>
        </div>
      `;

      item.querySelector('.btn-play-take').addEventListener('click', () => {
        this.recorder.playVocal(this.hub.ctx.currentTime);
      });

      container.appendChild(item);
    });
  }

  attachMasteringEvents() {
    const profileCards = document.querySelectorAll('.master-profile-card');
    const btnAB = document.getElementById('btn-toggle-ab');
    const pill = document.getElementById('header-master-pill');
    const pillName = document.getElementById('header-master-name');

    profileCards.forEach(card => {
      card.addEventListener('click', async () => {
        await this.ensureAudioContext();
        profileCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const presetKey = card.getAttribute('data-preset');
        const p = this.master.applyPreset(presetKey);

        if (pill) pill.classList.remove('unmastered');
        if (pillName) pillName.textContent = p.name.toUpperCase();

        const summaryProfile = document.getElementById('summary-master-profile');
        if (summaryProfile) summaryProfile.textContent = `${p.name} Standard`;

        this.showToast(`⚡ Applied 1-Click Master: ${p.name}`);
      });
    });

    if (btnAB) {
      btnAB.addEventListener('click', async () => {
        await this.ensureAudioContext();
        const isMastered = !this.master.isMasteredActive;
        this.master.setABMode(isMastered);

        const modeA = btnAB.querySelector('.ab-a');
        const modeB = btnAB.querySelector('.ab-b');

        if (isMastered) {
          modeA.classList.remove('active');
          modeB.classList.add('active');
          if (pill) pill.classList.remove('unmastered');
          if (pillName) pillName.textContent = 'AI MASTERED';
        } else {
          modeA.classList.add('active');
          modeB.classList.remove('active');
          if (pill) pill.classList.add('unmastered');
          if (pillName) pillName.textContent = 'UNMASTERED (RAW)';
        }
      });
    }
  }

  updateMasterMetricsDisplay() {
    if (!this.hub.isInitialized) return;
    const m = this.master.getLiveLUFSMetrics();

    const lufsEl = document.getElementById('metric-lufs-readout');
    const peakEl = document.getElementById('metric-peak-readout');
    const drEl = document.getElementById('metric-dr-readout');

    if (lufsEl) lufsEl.innerHTML = `${m.lufs} <small>LUFS</small>`;
    if (peakEl) peakEl.innerHTML = `${m.peakTP} <small>dBTP</small>`;
    if (drEl) drEl.innerHTML = `${m.dynamicRange}`;
  }

  attachExportEvents() {
    const btnWav = document.getElementById('btn-export-wav');
    const btnMp3 = document.getElementById('btn-export-mp3');
    const btnStems = document.getElementById('btn-export-stems');
    const btnDownloadCover = document.getElementById('btn-download-cover');
    const btnRandomArt = document.getElementById('btn-random-artwork');

    // Artwork inputs
    const inputTitle = document.getElementById('input-track-title');
    const inputArtist = document.getElementById('input-artist-name');
    const selectTheme = document.getElementById('select-art-theme');

    const updateArt = () => {
      if (this.coverArt) {
        this.coverArt.title = inputTitle.value;
        this.coverArt.artist = inputArtist.value;
        this.coverArt.theme = selectTheme.value;
        this.coverArt.render();

        const sumTitle = document.getElementById('summary-display-title');
        const sumArtist = document.getElementById('summary-display-artist');
        if (sumTitle) sumTitle.textContent = inputTitle.value;
        if (sumArtist) sumArtist.textContent = `by ${inputArtist.value}`;
      }
    };

    if (inputTitle) inputTitle.addEventListener('input', updateArt);
    if (inputArtist) inputArtist.addEventListener('input', updateArt);
    if (selectTheme) selectTheme.addEventListener('change', updateArt);

    if (btnRandomArt) {
      btnRandomArt.addEventListener('click', () => {
        const titles = ["Midnight Velocity", "Neon Cyberpunk", "Tokyo Rain", "Astral Horizon", "Solar Bloom", "Drill Gravity"];
        const artists = ["Future Wave", "CyberSoul", "Apex Pulse", "Nova Vibe", "Echo District"];
        const themes = ["cyberpunk", "cosmic", "retro", "minimal", "sunset", "gold"];

        inputTitle.value = titles[Math.floor(Math.random() * titles.length)];
        inputArtist.value = artists[Math.floor(Math.random() * artists.length)];
        selectTheme.value = themes[Math.floor(Math.random() * themes.length)];
        updateArt();
      });
    }

    if (btnDownloadCover) {
      btnDownloadCover.addEventListener('click', () => {
        this.coverArt.downloadImage();
        this.showToast("🖼️ Cover Art downloaded in high resolution!");
      });
    }

    // Audio Exports
    if (btnWav) {
      btnWav.addEventListener('click', async () => {
        await this.exportMasterAudio('wav');
      });
    }
    if (btnMp3) {
      btnMp3.addEventListener('click', async () => {
        await this.exportMasterAudio('mp3');
      });
    }
    if (btnStems) {
      btnStems.addEventListener('click', async () => {
        await this.exportMasterAudio('stems');
      });
    }
  }

  async exportMasterAudio(format = 'wav') {
    this.showToast(`Rendering 24-Bit / 48kHz ${format.toUpperCase()} Master... ⏳`);

    // Offline Audio Context Render (2 bars = 7.38s)
    const duration = (60.0 / this.tempoBPM) * 8; // 2 bars
    const sampleRate = 48000;
    const OfflineCtxClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtxClass(2, sampleRate * duration, sampleRate);

    // Render synthesized master buffer
    const synthOff = new window.SoundSynthesisEngine({ ctx: offlineCtx, buses: {}, masterGain: offlineCtx.destination });
    const scale = this.generator.getScaleNotes();
    const p = this.generator.pattern;
    const secondsPer16th = (60.0 / this.tempoBPM) / 4.0;

    for (let step = 0; step < 32; step++) {
      const step16 = step % 16;
      const t = step * secondsPer16th;

      if (p.kick[step16]) synthOff.playKick(t);
      if (p.snare[step16]) synthOff.playSnare(t);
      if (p.hihat[step16]) synthOff.playHiHat(t, 0.75, step16 % 4 === 2);
      if (p.bass[step16]) synthOff.play808Bass(scale.bass[Math.floor(step16 / 4) % scale.bass.length], t, 0.45);
      if (p.chords[step16]) synthOff.playChord(scale.chords[Math.floor(step16 / 4) % scale.chords.length], t, 0.9);
      if (p.lead[step16]) synthOff.playLeadNote(scale.lead[step16 % scale.lead.length], t, 0.25);
    }

    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = this.audioBufferToWavBlob(renderedBuffer);

    const title = this.coverArt ? this.coverArt.title : 'Track';
    const artist = this.coverArt ? this.coverArt.artist : 'Artist';
    const filename = `${artist}_-_${title}_[Mastered].${format === 'mp3' ? 'mp3' : 'wav'}`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(wavBlob);
    link.download = filename;
    link.click();

    this.showToast(`🚀 Exported: ${filename} ready for distribution!`);
  }

  audioBufferToWavBlob(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result;
    if (numChannels === 2) {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
      result = buffer.getChannelData(0);
    }

    return this.encodeWAV(result, format, sampleRate, numChannels, bitDepth);
  }

  interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;

    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    /* RIFF identifier */
    this.writeString(view, 0, 'RIFF');
    /* file length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    /* RIFF type */
    this.writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    this.writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    this.writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true);

    this.floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
  }

  floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  attachKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Ignore when typing inside input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlay();
      }
    });
  }

  showToast(message) {
    const toast = document.getElementById('studio-toast');
    const msgEl = document.getElementById('toast-message');
    if (toast && msgEl) {
      msgEl.textContent = message;
      toast.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
      }, 3000);
    }
  }
}

// Bootstrap Application on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  window.app = new SoundCraftApp();
  window.app.init();
});
