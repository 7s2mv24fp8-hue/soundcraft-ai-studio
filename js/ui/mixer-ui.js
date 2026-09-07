/**
 * SoundCraft AI - Pro Mixer & FX Rack UI
 * Channel strips, vertical faders, interactive 5-band EQ canvas, and compressor GR meter
 */

class MixerUI {
  constructor(audioHub, effectsChain) {
    this.hub = audioHub;
    this.fx = effectsChain;
    this.container = document.getElementById('mixer-channel-strips');
    this.canvasEQ = document.getElementById('canvas-eq-curve');
    this.eqCtx = this.canvasEQ ? this.canvasEQ.getContext('2d') : null;

    this.channels = [
      { id: 'drums', name: 'Drums', color: '#ff3366', vol: 0.85, pan: 0 },
      { id: 'bass', name: '808 Bass', color: '#9b51e0', vol: 0.90, pan: 0 },
      { id: 'synth', name: 'Lead Synth', color: '#00f59b', vol: 0.75, pan: 0.15 },
      { id: 'chords', name: 'Chords', color: '#4facfe', vol: 0.70, pan: -0.15 },
      { id: 'vocal', name: 'Lead Vocal', color: '#ffb703', vol: 1.00, pan: 0 },
      { id: 'fx', name: 'Atmosphere', color: '#f72585', vol: 0.65, pan: 0 }
    ];

    this.eqBands = {
      low: -2,
      lowmid: -1,
      mid: 2,
      highmid: 3,
      high: 4
    };
  }

  render() {
    this.renderChannelStrips();
    this.initEQCanvas();
    this.initFXTabSwitches();
  }

  renderChannelStrips() {
    if (!this.container) return;
    this.container.innerHTML = '';

    this.channels.forEach(ch => {
      const strip = document.createElement('div');
      strip.className = 'channel-strip';
      strip.id = `strip-${ch.id}`;

      strip.innerHTML = `
        <div class="strip-name" style="color:${ch.color}">${ch.name}</div>
        
        <div class="strip-pan-control">
          <label>PAN</label>
          <input type="range" class="slider-styled pan-slider" min="-1" max="1" step="0.05" value="${ch.pan}" id="pan-${ch.id}">
        </div>

        <div class="strip-fader-assembly">
          <div class="vertical-fader-track">
            <input type="range" class="vertical-fader" min="0" max="1.2" step="0.01" value="${ch.vol}" id="vol-${ch.id}">
          </div>
          <div class="strip-meter">
            <div class="strip-meter-bar" id="meter-${ch.id}"></div>
          </div>
        </div>

        <div class="strip-val" id="val-${ch.id}">${Math.round(ch.vol * 100)}%</div>

        <div class="strip-buttons">
          <button class="btn-mute" id="mute-strip-${ch.id}">M</button>
          <button class="btn-solo" id="solo-strip-${ch.id}">S</button>
        </div>
      `;

      // Event listeners
      const volSlider = strip.querySelector(`#vol-${ch.id}`);
      const valDisplay = strip.querySelector(`#val-${ch.id}`);
      const panSlider = strip.querySelector(`#pan-${ch.id}`);
      const btnMute = strip.querySelector(`#mute-strip-${ch.id}`);
      const btnSolo = strip.querySelector(`#solo-strip-${ch.id}`);

      volSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valDisplay.textContent = `${Math.round(val * 100)}%`;
        this.hub.setStemVolume(ch.id, val);
      });

      panSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.hub.setStemPan(ch.id, val);
      });

      btnMute.addEventListener('click', () => {
        const isMuted = btnMute.classList.toggle('active');
        this.hub.setStemMute(ch.id, isMuted);
      });

      btnSolo.addEventListener('click', () => {
        const isSolo = btnSolo.classList.toggle('active');
        this.hub.setStemSolo(ch.id, isSolo);
      });

      this.container.appendChild(strip);
    });
  }

  initEQCanvas() {
    if (!this.canvasEQ || !this.eqCtx) return;
    this.drawEQCurve();

    // Attach listeners to EQ sliders
    ['low', 'lowmid', 'mid', 'highmid', 'high'].forEach(band => {
      const slider = document.getElementById(`eq-${band}`);
      const label = document.getElementById(`eq-${band}-val`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          this.eqBands[band] = val;
          if (label) label.textContent = `${val >= 0 ? '+' : ''}${val} dB`;
          
          if (band === 'low') this.fx.setEQBand('low', val);
          if (band === 'lowmid') this.fx.setEQBand('lowMid', val);
          if (band === 'mid') this.fx.setEQBand('mid', val);
          if (band === 'highmid') this.fx.setEQBand('highMid', val);
          if (band === 'high') this.fx.setEQBand('high', val);

          this.drawEQCurve();
        });
      }
    });
  }

  drawEQCurve() {
    if (!this.eqCtx || !this.canvasEQ) return;
    const ctx = this.eqCtx;
    const w = this.canvasEQ.width;
    const h = this.canvasEQ.height;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Grid lines (dB levels)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    [0.2, 0.5, 0.8].forEach(factor => {
      ctx.beginPath();
      ctx.moveTo(0, h * factor);
      ctx.lineTo(w, h * factor);
      ctx.stroke();
    });

    // Zero dB center line
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Draw Parametric Response Curve
    ctx.beginPath();
    ctx.moveTo(0, cy);

    const points = [
      { x: 0, y: cy - (this.eqBands.low * 2.8) },
      { x: w * 0.2, y: cy - (this.eqBands.low * 3.5) },
      { x: w * 0.4, y: cy - (this.eqBands.lowmid * 3.5) },
      { x: w * 0.6, y: cy - (this.eqBands.mid * 3.5) },
      { x: w * 0.8, y: cy - (this.eqBands.highmid * 3.5) },
      { x: w, y: cy - (this.eqBands.high * 3.5) }
    ];

    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);

    // Glowing Curve Stroke
    ctx.strokeStyle = '#00f2fe';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0, 242, 254, 0.8)';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.25)');
    grad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
    ctx.fillStyle = grad;
    ctx.shadowBlur = 0;
    ctx.fill();
  }

  initFXTabSwitches() {
    const fxTabBtns = document.querySelectorAll('.fx-tab-btn');
    fxTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        fxTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const fxKey = btn.getAttribute('data-fx');
        document.querySelectorAll('.fx-panel-section').forEach(sec => {
          sec.classList.remove('active');
        });

        const targetPanel = document.getElementById(`fx-panel-${fxKey}`);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      });
    });
  }
}

window.MixerUI = MixerUI;
