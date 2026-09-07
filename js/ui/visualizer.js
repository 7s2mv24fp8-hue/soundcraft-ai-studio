/**
 * SoundCraft AI - Real-time Audio Visualizers
 * Spectrum Analyzer, Vocal Waveform Display, and Social Media Reactive Canvas
 */

class StudioVisualizers {
  constructor(audioHub) {
    this.hub = audioHub;
    this.canvasSpectrum = document.getElementById('canvas-master-spectrum');
    this.specCtx = this.canvasSpectrum ? this.canvasSpectrum.getContext('2d') : null;

    this.canvasVocal = document.getElementById('canvas-vocal-waveform');
    this.vocalCtx = this.canvasVocal ? this.canvasVocal.getContext('2d') : null;

    this.canvasSocial = document.getElementById('canvas-social-visualizer');
    this.socialCtx = this.canvasSocial ? this.canvasSocial.getContext('2d') : null;

    this.animationId = null;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.renderLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  renderLoop() {
    if (!this.isRunning) return;

    this.drawMasterSpectrum();
    this.drawSocialVisualizer();
    this.updateHeaderVU();

    this.animationId = requestAnimationFrame(() => this.renderLoop());
  }

  drawMasterSpectrum() {
    if (!this.specCtx || !this.canvasSpectrum || !this.hub.analyser) return;
    const ctx = this.specCtx;
    const w = this.canvasSpectrum.width;
    const h = this.canvasSpectrum.height;

    const bufferLength = this.hub.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.hub.analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, w, h);

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const barCount = 64;
    const barWidth = (w / barCount) - 2;
    const step = Math.floor(bufferLength / (barCount * 1.5));

    for (let i = 0; i < barCount; i++) {
      const val = dataArray[i * step] || 0;
      const percent = val / 255;
      const barHeight = Math.max(3, percent * (h - 20));
      const x = i * (barWidth + 2);
      const y = h - barHeight;

      // Dynamic Gradient: Cyan -> Purple -> Neon Green
      const grad = ctx.createLinearGradient(0, h, 0, y);
      grad.addColorStop(0, '#00f2fe');
      grad.addColorStop(0.6, '#9b51e0');
      grad.addColorStop(1, '#00f59b');

      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
      ctx.shadowBlur = percent > 0.5 ? 8 : 0;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Top Peak Dot
      if (barHeight > 10) {
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y - 3, barWidth, 2);
      }
    }
  }

  drawSocialVisualizer() {
    if (!this.socialCtx || !this.canvasSocial || !this.hub.analyser) return;
    const ctx = this.socialCtx;
    const w = this.canvasSocial.width;
    const h = this.canvasSocial.height;
    const cx = w / 2;
    const cy = h / 2;

    const bufferLength = this.hub.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.hub.analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, w, h);

    // Audio reactive pulsing central circle
    let bassAvg = 0;
    for (let i = 0; i < 8; i++) bassAvg += dataArray[i];
    bassAvg /= 8;
    const bassScale = 1 + (bassAvg / 255) * 0.45;

    // Glowing Circular Waveform
    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, 35 * bassScale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 242, 254, 0.15)';
    ctx.shadowColor = '#00f2fe';
    ctx.shadowBlur = 25 * bassScale;
    ctx.fill();

    // Circular Frequency Rays
    const rays = 48;
    const radius = 45 * bassScale;
    for (let i = 0; i < rays; i++) {
      const angle = (i / rays) * Math.PI * 2;
      const val = dataArray[i * 2] || 0;
      const rayLen = (val / 255) * 45;

      const x1 = Math.cos(angle) * radius;
      const y1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle) * (radius + rayLen);
      const y2 = Math.sin(angle) * (radius + rayLen);

      ctx.strokeStyle = i % 2 === 0 ? '#ff3366' : '#00f59b';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawVocalBufferWaveform(audioBuffer) {
    if (!this.vocalCtx || !this.canvasVocal || !audioBuffer) return;
    const ctx = this.vocalCtx;
    const w = this.canvasVocal.width;
    const h = this.canvasVocal.height;
    const cy = h / 2;

    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / w);
    const amp = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Background Centerline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();

    // Waveform Bars
    for (let i = 0; i < w; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      const barHeight = Math.max(2, (max - min) * amp * 0.9);
      const y = cy - barHeight / 2;

      ctx.fillStyle = i % 2 === 0 ? '#ffb703' : '#ff9e00';
      ctx.shadowColor = 'rgba(255, 183, 3, 0.5)';
      ctx.shadowBlur = 4;
      ctx.fillRect(i, y, 1.5, barHeight);
    }
  }

  updateHeaderVU() {
    const peaks = this.hub.getPeakLevels();
    const meterL = document.getElementById('master-meter-l');
    const meterR = document.getElementById('master-meter-r');

    if (meterL) meterL.style.height = `${Math.min(100, Math.max(4, peaks.l * 120))}%`;
    if (meterR) meterR.style.height = `${Math.min(100, Math.max(4, peaks.r * 120))}%`;
  }
}

window.StudioVisualizers = StudioVisualizers;
