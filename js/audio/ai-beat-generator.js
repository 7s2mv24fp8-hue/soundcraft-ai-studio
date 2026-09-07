/**
 * SoundCraft AI - Beat & Rhythmic Composition Generator
 * Algorithmic music theory, harmonic progressions, and prompt-driven beat generation
 */

class AIBeatGenerator {
  constructor(synthEngine) {
    this.synth = synthEngine;
    this.bpm = 130;
    this.key = 'A minor';
    this.currentStyle = 'trap';
    this.density = 4; // 1 to 5
    this.swing = 30;  // 0 to 100%
    this.mood = 'dark';

    // 16-step active pattern matrix: { kick: [bool x 16], snare: [], hihat: [], bass: [], lead: [], chords: [], fx: [] }
    this.pattern = this.getDefaultPattern();
  }

  getDefaultPattern() {
    return {
      kick:   [1, 0, 0, 0,  0, 0, 1, 0,  0, 1, 0, 0,  0, 0, 0, 0],
      snare:  [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0],
      hihat:  [1, 0, 1, 0,  1, 0, 1, 1,  1, 0, 1, 0,  1, 1, 1, 1],
      bass:   [1, 0, 0, 0,  0, 0, 1, 0,  0, 1, 0, 0,  0, 0, 1, 0],
      lead:   [0, 0, 1, 0,  0, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 0],
      chords: [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0],
      fx:     [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0]
    };
  }

  // Generate pattern from natural language prompt or preset
  generateFromPrompt(promptText = '', style = 'trap') {
    const text = promptText.toLowerCase();

    // 1. Detect BPM if present in text (e.g. "140 bpm")
    const bpmMatch = text.match(/(\d{2,3})\s*(?:bpm)?/);
    if (bpmMatch && parseInt(bpmMatch[1], 10) >= 60 && parseInt(bpmMatch[1], 10) <= 180) {
      this.bpm = parseInt(bpmMatch[1], 10);
    } else {
      this.bpm = this.getStyleBpm(style);
    }

    // 2. Detect style if mentioned
    if (text.includes('lofi') || text.includes('chill') || text.includes('study') || text.includes('coffee')) {
      style = 'lofi';
    } else if (text.includes('drill') || text.includes('uk drill') || text.includes('ny drill')) {
      style = 'drill';
    } else if (text.includes('synthwave') || text.includes('80s') || text.includes('cyber') || text.includes('retro')) {
      style = 'synthwave';
    } else if (text.includes('house') || text.includes('edm') || text.includes('club') || text.includes('dance')) {
      style = 'house';
    } else if (text.includes('pop') || text.includes('r&b') || text.includes('rnb')) {
      style = 'pop';
    } else if (text.includes('acoustic') || text.includes('guitar') || text.includes('rock')) {
      style = 'acoustic';
    } else if (text.includes('trap') || text.includes('808') || text.includes('hip hop') || text.includes('rap')) {
      style = 'trap';
    }

    this.currentStyle = style;

    // 3. Detect key if mentioned
    const keyMatch = text.match(/\b([a-g][#b]?)\s*(minor|major|min|maj)?\b/i);
    if (keyMatch) {
      const root = keyMatch[1].toUpperCase();
      const type = (keyMatch[2] && keyMatch[2].toLowerCase().startsWith('maj')) ? 'major' : 'minor';
      this.key = `${root} ${type}`;
    }

    // 4. Generate pattern matrix based on style rules
    this.pattern = this.createStylePattern(style);

    return {
      style: this.currentStyle,
      bpm: this.bpm,
      key: this.key,
      pattern: this.pattern
    };
  }

  getStyleBpm(style) {
    switch (style) {
      case 'lofi': return 85;
      case 'drill': return 142;
      case 'synthwave': return 124;
      case 'house': return 128;
      case 'pop': return 118;
      case 'acoustic': return 95;
      case 'trap':
      default: return 140;
    }
  }

  createStylePattern(style) {
    const p = {
      kick:   new Array(16).fill(0),
      snare:  new Array(16).fill(0),
      hihat:  new Array(16).fill(0),
      bass:   new Array(16).fill(0),
      lead:   new Array(16).fill(0),
      chords: new Array(16).fill(0),
      fx:     new Array(16).fill(0)
    };

    if (style === 'trap') {
      p.kick   = [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0];
      p.snare  = [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.hihat  = [1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1]; // Rolling hats
      p.bass   = [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0]; // 808 slides
      p.lead   = [0, 0, 1, 0,  0, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 0];
      p.chords = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0];
      p.fx     = [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
    } else if (style === 'drill') {
      p.kick   = [1, 0, 0, 0,  0, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 0];
      p.snare  = [0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 1, 0]; // Syncopated drill snare
      p.hihat  = [1, 0, 1, 1,  0, 1, 1, 0,  1, 1, 0, 1,  1, 1, 1, 1]; // Drill triplet rolls
      p.bass   = [1, 0, 0, 0,  0, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 1]; // Heavy sliding 808
      p.lead   = [1, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 0,  1, 0, 0, 0];
      p.chords = [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.fx     = [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
    } else if (style === 'lofi') {
      p.kick   = [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0,  0, 1, 0, 0];
      p.snare  = [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.hihat  = [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0]; // Relaxed 8th notes
      p.bass   = [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0,  0, 1, 0, 0];
      p.lead   = [0, 0, 0, 0,  0, 0, 1, 0,  0, 0, 0, 0,  0, 0, 1, 0];
      p.chords = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0]; // Warm Rhodes chords
      p.fx     = [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]; // Vinyl crackle
    } else if (style === 'synthwave') {
      p.kick   = [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0]; // 4-on-the-floor
      p.snare  = [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.hihat  = [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0]; // Offbeat 80s hats
      p.bass   = [1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1,  1, 1, 1, 1]; // Driving 16th rolling bass
      p.lead   = [1, 0, 0, 1,  0, 1, 0, 0,  1, 0, 0, 1,  0, 1, 1, 0];
      p.chords = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0];
      p.fx     = [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
    } else if (style === 'house') {
      p.kick   = [1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0,  1, 0, 0, 0];
      p.snare  = [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.hihat  = [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0]; // Pumping open hats
      p.bass   = [0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0];
      p.lead   = [0, 0, 0, 0,  1, 0, 0, 1,  0, 0, 0, 0,  1, 0, 1, 0];
      p.chords = [1, 0, 0, 1,  0, 0, 1, 0,  1, 0, 0, 1,  0, 0, 1, 0];
      p.fx     = [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
    } else if (style === 'pop') {
      p.kick   = [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 1, 0, 0];
      p.snare  = [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.hihat  = [1, 0, 1, 0,  1, 0, 1, 1,  1, 0, 1, 0,  1, 0, 1, 1];
      p.bass   = [1, 0, 0, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 0, 0];
      p.lead   = [1, 0, 0, 1,  0, 0, 1, 0,  0, 1, 0, 0,  1, 0, 1, 0];
      p.chords = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0];
      p.fx     = [1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
    } else {
      // Acoustic
      p.kick   = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 1, 0];
      p.snare  = [0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0];
      p.hihat  = [1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0,  1, 0, 1, 0];
      p.bass   = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0];
      p.lead   = [0, 0, 1, 0,  0, 0, 0, 1,  0, 0, 1, 0,  0, 0, 0, 0];
      p.chords = [1, 0, 0, 0,  0, 0, 0, 0,  1, 0, 0, 0,  0, 0, 0, 0];
      p.fx     = [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0];
    }

    return p;
  }

  mutateFill() {
    // Add dynamic variation / drum fill at steps 12..15
    for (let step = 12; step < 16; step++) {
      this.pattern.snare[step] = Math.random() > 0.4 ? 1 : 0;
      this.pattern.hihat[step] = 1;
      this.pattern.kick[step] = Math.random() > 0.6 ? 1 : 0;
    }
    return this.pattern;
  }

  // Get notes for chords & melodies based on selected key
  getScaleNotes() {
    const scales = {
      'A minor': { root: 'A', bass: ['A1', 'F1', 'C2', 'G1'], chords: [['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4']], lead: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5'] },
      'C minor': { root: 'C', bass: ['C2', 'Ab1', 'Eb2', 'Bb1'], chords: [['C4', 'Eb4', 'G4'], ['Ab3', 'C4', 'Eb4'], ['Eb4', 'G4', 'Bb4'], ['Bb3', 'D4', 'F4']], lead: ['C5', 'Eb5', 'F5', 'G5', 'Bb5', 'C6'] },
      'D minor': { root: 'D', bass: ['D2', 'Bb1', 'F2', 'C2'], chords: [['D4', 'F4', 'A4'], ['Bb3', 'D4', 'F4'], ['F4', 'A4', 'C5'], ['C4', 'E4', 'G4']], lead: ['D5', 'F5', 'G5', 'A5', 'C6', 'D6'] },
      'E minor': { root: 'E', bass: ['E1', 'C2', 'G1', 'D2'], chords: [['E3', 'G3', 'B3'], ['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['D4', 'F#4', 'A4']], lead: ['E4', 'G4', 'A4', 'B4', 'D5', 'E5'] },
      'F minor': { root: 'F', bass: ['F1', 'Db2', 'Ab1', 'Eb2'], chords: [['F3', 'Ab3', 'C4'], ['Db4', 'F4', 'Ab4'], ['Ab3', 'C4', 'Eb4'], ['Eb4', 'G4', 'Bb4']], lead: ['F4', 'Ab4', 'Bb4', 'C5', 'Eb5', 'F5'] },
      'G minor': { root: 'G', bass: ['G1', 'Eb2', 'Bb1', 'F2'], chords: [['G3', 'Bb3', 'D4'], ['Eb4', 'G4', 'Bb4'], ['Bb3', 'D4', 'F4'], ['F4', 'A4', 'C5']], lead: ['G4', 'Bb4', 'C5', 'D5', 'F5', 'G5'] },
      'C major': { root: 'C', bass: ['C2', 'G1', 'A1', 'F1'], chords: [['C4', 'E4', 'G4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4']], lead: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'] }
    };
    return scales[this.key] || scales['A minor'];
  }
}

window.AIBeatGenerator = AIBeatGenerator;
