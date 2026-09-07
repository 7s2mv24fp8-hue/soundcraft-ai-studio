/**
 * SoundCraft AI - Sequencer UI Module
 * Renders 16-step grid, track headers, solo/mute buttons, and playhead indicator
 */

class SequencerUI {
  constructor(generator, onStepChange) {
    this.gen = generator;
    this.onStepChange = onStepChange;
    this.matrixEl = document.getElementById('sequencer-matrix');
    this.indicatorsEl = document.getElementById('step-indicators');
    this.currentStep = 0;

    this.trackMeta = [
      { id: 'kick', name: 'Punchy Kick', color: '#ff3366', icon: '🥁' },
      { id: 'snare', name: 'Snare / Clap', color: '#00f2fe', icon: '💥' },
      { id: 'hihat', name: 'Hi-Hat (Rolls)', color: '#ffb703', icon: '🎩' },
      { id: 'bass', name: '808 Sub Bass', color: '#9b51e0', icon: '🔊' },
      { id: 'lead', name: 'Lead Synth', color: '#00f59b', icon: '🎹' },
      { id: 'chords', name: 'Rhodes Chords', color: '#4facfe', icon: '🎼' },
      { id: 'fx', name: 'Atmosphere FX', color: '#f72585', icon: '✨' }
    ];
  }

  render() {
    this.renderHeaderTimeline();
    this.renderMatrix();
  }

  renderHeaderTimeline() {
    if (!this.indicatorsEl) return;
    this.indicatorsEl.innerHTML = `
      <div class="track-info-cell"><span style="font-size:0.7rem;font-weight:800;color:#64748b">STEM / 16 STEPS</span></div>
    `;

    for (let i = 0; i < 16; i++) {
      const isBeatStart = i % 4 === 0;
      const stepNum = i + 1;
      const tick = document.createElement('div');
      tick.className = `step-tick ${isBeatStart ? 'beat-start' : ''}`;
      tick.id = `step-tick-${i}`;
      tick.textContent = stepNum;
      this.indicatorsEl.appendChild(tick);
    }
  }

  renderMatrix() {
    if (!this.matrixEl) return;
    this.matrixEl.innerHTML = '';

    this.trackMeta.forEach(track => {
      const row = document.createElement('div');
      row.className = 'seq-track-row';

      // Track Info Cell
      const infoCell = document.createElement('div');
      infoCell.className = 'track-info-cell';
      infoCell.innerHTML = `
        <div class="track-name-badge">
          <span class="track-dot ${track.id}"></span>
          <span>${track.name}</span>
        </div>
        <div class="track-mute-solo">
          <button class="btn-mute" data-track="${track.id}" title="Mute Track">M</button>
          <button class="btn-solo" data-track="${track.id}" title="Solo Track">S</button>
        </div>
      `;

      // Attach Mute & Solo events
      const btnMute = infoCell.querySelector('.btn-mute');
      const btnSolo = infoCell.querySelector('.btn-solo');

      btnMute.addEventListener('click', (e) => {
        e.stopPropagation();
        const isMuted = !btnMute.classList.contains('active');
        btnMute.classList.toggle('active', isMuted);
        window.studioContext.setStemMute(this.mapTrackToStem(track.id), isMuted);
      });

      btnSolo.addEventListener('click', (e) => {
        e.stopPropagation();
        const isSolo = !btnSolo.classList.contains('active');
        btnSolo.classList.toggle('active', isSolo);
        window.studioContext.setStemSolo(this.mapTrackToStem(track.id), isSolo);
      });

      row.appendChild(infoCell);

      // 16 Step Buttons
      const patternData = this.gen.pattern[track.id] || new Array(16).fill(0);
      for (let step = 0; step < 16; step++) {
        const stepBtn = document.createElement('button');
        stepBtn.className = `seq-step-btn ${track.id}`;
        stepBtn.id = `step-btn-${track.id}-${step}`;
        
        if (patternData[step]) {
          stepBtn.classList.add('active');
        }

        stepBtn.addEventListener('click', () => {
          const newState = stepBtn.classList.toggle('active');
          this.gen.pattern[track.id][step] = newState ? 1 : 0;
          if (this.onStepChange) this.onStepChange(track.id, step, newState);
        });

        row.appendChild(stepBtn);
      }

      this.matrixEl.appendChild(row);
    });
  }

  updatePlayhead(stepIndex) {
    // Remove previous playhead styling
    document.querySelectorAll('.step-tick.current-step').forEach(el => el.classList.remove('current-step'));
    document.querySelectorAll('.seq-step-btn.playing-now').forEach(el => el.classList.remove('playing-now'));

    // Highlight current tick
    const tick = document.getElementById(`step-tick-${stepIndex}`);
    if (tick) tick.classList.add('current-step');

    // Highlight active playing buttons
    this.trackMeta.forEach(track => {
      const btn = document.getElementById(`step-btn-${track.id}-${stepIndex}`);
      if (btn) btn.classList.add('playing-now');
    });

    this.currentStep = stepIndex;
  }

  mapTrackToStem(trackId) {
    if (trackId === 'kick' || trackId === 'snare' || trackId === 'hihat') return 'drums';
    if (trackId === 'bass') return 'bass';
    if (trackId === 'lead') return 'synth';
    if (trackId === 'chords') return 'chords';
    if (trackId === 'fx') return 'fx';
    return 'drums';
  }
}

window.SequencerUI = SequencerUI;
