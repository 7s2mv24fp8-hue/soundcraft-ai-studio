/**
 * SoundCraft AI - Procedural Album Cover Art Generator
 * Generates release-ready album artwork for streaming & social media
 */

class CoverArtGenerator {
  constructor() {
    this.canvas = document.getElementById('canvas-cover-art');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.title = 'Midnight Velocity';
    this.artist = 'Future Wave';
    this.theme = 'cyberpunk';
    this.showVinyl = true;
    this.showGlow = true;
    this.showBadge = true;
  }

  render() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Draw Background Theme
    this.drawThemeBackground(ctx, w, h);

    // 2. Vinyl Grooves Overlay
    if (this.showVinyl) {
      this.drawVinylGrooves(ctx, w, h);
    }

    // 3. Cyber Glow FX
    if (this.showGlow) {
      this.drawCyberGlow(ctx, w, h);
    }

    // 4. Typography (Title & Artist)
    this.drawTypography(ctx, w, h);

    // 5. Release Badge / Hi-Res Audio Stamp
    if (this.showBadge) {
      this.drawMasterBadge(ctx, w, h);
    }
  }

  drawThemeBackground(ctx, w, h) {
    if (this.theme === 'cyberpunk') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#0a0915');
      grad.addColorStop(0.5, '#190a2b');
      grad.addColorStop(1, '#051b2c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Neon horizon grid
      ctx.strokeStyle = 'rgba(0, 242, 254, 0.25)';
      ctx.lineWidth = 1.5;
      for (let y = h * 0.55; y < h; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Perspective vertical rays
      for (let x = -w * 0.2; x < w * 1.2; x += 55) {
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.55);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Synthwave Neon Sun
      const sunGrad = ctx.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, 110);
      sunGrad.addColorStop(0, '#f72585');
      sunGrad.addColorStop(0.7, '#ffb703');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.42, 110, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.theme === 'cosmic') {
      const grad = ctx.createRadialGradient(w * 0.4, h * 0.4, 20, w / 2, h / 2, w * 0.7);
      grad.addColorStop(0, '#4facfe');
      grad.addColorStop(0.4, '#6b11ff');
      grad.addColorStop(0.8, '#0b001a');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 80; i++) {
        const sx = (Math.sin(i * 99) * 0.5 + 0.5) * w;
        const sy = (Math.cos(i * 33) * 0.5 + 0.5) * h;
        const sr = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.theme === 'retro') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.4, '#451a03');
      grad.addColorStop(0.8, '#78350f');
      grad.addColorStop(1, '#1c1917');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Vintage Warm Tape Circles
      ['#ffb703', '#ea580c', '#dc2626'].forEach((c, idx) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.45, 90 + idx * 28, 0, Math.PI * 2);
        ctx.stroke();
      });

    } else if (this.theme === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#7928ca');
      grad.addColorStop(0.5, '#ff0080');
      grad.addColorStop(0.8, '#ff9900');
      grad.addColorStop(1, '#11052c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

    } else if (this.theme === 'gold') {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#1a1813');
      grad.addColorStop(0.5, '#3b321a');
      grad.addColorStop(1, '#0d0c09');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Gold Diagonal Accent
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2);
      ctx.lineTo(w, h * 0.8);
      ctx.stroke();

    } else {
      // Minimal Dark
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#18181b');
      grad.addColorStop(1, '#09090b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Minimal Geometric Monolith
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(w * 0.25, h * 0.2, w * 0.5, h * 0.45);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.25, h * 0.2, w * 0.5, h * 0.45);
    }
  }

  drawVinylGrooves(ctx, w, h) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let r = 40; r < w * 0.6; r += 16) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawCyberGlow(ctx, w, h) {
    ctx.save();
    const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, w * 0.6);
    grad.addColorStop(0, 'rgba(0, 242, 254, 0.15)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  drawTypography(ctx, w, h) {
    ctx.save();

    // Track Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 14;
    ctx.fillText(this.title.toUpperCase(), w / 2, h * 0.80);

    // Artist Name
    ctx.fillStyle = '#00f2fe';
    ctx.font = '700 20px Outfit, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.shadowBlur = 10;
    ctx.fillText(this.artist.toUpperCase(), w / 2, h * 0.86);

    ctx.restore();
  }

  drawMasterBadge(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(20, 20, 160, 28);
    ctx.strokeStyle = '#00f59b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, 160, 28);

    ctx.fillStyle = '#00f59b';
    ctx.font = '700 11px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ AI MASTERED 24-BIT', 28, 38);
    ctx.restore();
  }

  downloadImage() {
    if (!this.canvas) return;
    const link = document.createElement('a');
    link.download = `${this.artist}_-_${this.title}_Cover.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }
}

window.CoverArtGenerator = CoverArtGenerator;
