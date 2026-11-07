// Music theory engine: scales, modes, spelling, labels, and the 5 positions
// exactly as drawn in the lesson notes (P1–P5 built from string "groups").
const Theory = (() => {
  const MAJOR = [0, 2, 4, 5, 7, 9, 11];
  const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
  const FINGERS = { 1: '食', 2: '中', 3: '無', 4: '小' };
  const FINGER_EN = { 1: 'index', 2: 'middle', 3: 'ring', 4: 'pinky' };

  // Standard tuning, low E (string 0) to high E (string 5), as MIDI numbers.
  const OPEN = [40, 45, 50, 55, 59, 64];
  const STRING_NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];

  const TONICS = [
    ['C'], ['C♯', 'D♭'], ['D'], ['D♯', 'E♭'], ['E'], ['F'],
    ['F♯', 'G♭'], ['G'], ['G♯', 'A♭'], ['A'], ['A♯', 'B♭'], ['B'],
  ];

  const MODES = [
    { id: 'ionian', zh: '一', name: 'Ionian', alias: 'Major · 大調', feel: 'Bright, resolved, “home”. The reference everything else is compared to.' },
    { id: 'dorian', zh: '二', name: 'Dorian', alias: '', feel: 'Minor with a raised 6 — cool, jazzy, hopeful minor (So What, Oye Como Va).' },
    { id: 'phrygian', zh: '三', name: 'Phrygian', alias: '', feel: 'Minor with ♭2 — dark, Spanish / flamenco / metal tension.' },
    { id: 'lydian', zh: '四', name: 'Lydian', alias: '', feel: 'Major with ♯4 — floating, dreamy, film-score wonder.' },
    { id: 'mixolydian', zh: '五', name: 'Mixolydian', alias: '', feel: 'Major with ♭7 — bluesy, rock, “dominant” sound.' },
    { id: 'aeolian', zh: '六', name: 'Aeolian', alias: 'Natural minor · 小調', feel: 'The natural minor scale — sad, serious, the default minor.' },
    { id: 'locrian', zh: '七', name: 'Locrian', alias: '', feel: '♭2 and ♭5 — unstable, rarely a “home”; lives over m7♭5 chords.' },
  ];

  const mod = (n, m) => ((n % m) + m) % m;

  function modeIntervals(m) {
    return MAJOR.map((_, i) => mod(MAJOR[(m + i) % 7] - MAJOR[m], 12));
  }

  // Degree label relative to the major scale (parallel / "approach A").
  function parallelLabels(m) {
    return modeIntervals(m).map((iv, i) => accidental(iv - MAJOR[i]) + (i + 1));
  }

  function accidental(diff) {
    if (diff < 0) return '♭'.repeat(-diff);
    if (diff > 0) return '♯'.repeat(diff);
    return '';
  }

  // Movable-do syllables with chromatic alterations. The lesson notes use
  // "Si" (not "Ti"), so lowered 7 = "Se" following the same vowel rule as Me / Le.
  const SYL_ALT = { '♭2': 'Ra', '♭3': 'Me', '♯4': 'Fi', '♭5': 'Sol♭', '♭6': 'Le', '♭7': 'Se', '♯5': 'Si♭' };
  function parallelSyllable(label) {
    if (SYL_ALT[label]) return SYL_ALT[label];
    const n = parseInt(label.replace(/[♭♯]/g, ''), 10);
    return SOLFEGE[n - 1];
  }

  // Spell a 7-note scale so each letter appears once.
  function spellScale(tonicName, m) {
    const letter = LETTERS.indexOf(tonicName[0]);
    const tonicPc = mod(LETTER_PC[letter] + (tonicName.includes('♯') ? 1 : 0) - (tonicName.includes('♭') ? 1 : 0), 12);
    return modeIntervals(m).map((iv, i) => {
      const L = (letter + i) % 7;
      const target = mod(tonicPc + iv, 12);
      const diff = mod(target - LETTER_PC[L] + 6, 12) - 6;
      return { pc: target, letter: L, acc: diff, name: LETTERS[L] + accidental(diff) };
    });
  }

  function bestSpelling(tonicPc, m) {
    let best = null;
    for (const name of TONICS[tonicPc]) {
      const sp = spellScale(name, m);
      const cost = sp.reduce((a, n) => a + Math.abs(n.acc) * (Math.abs(n.acc) > 1 ? 10 : 1), 0);
      if (!best || cost < best.cost) best = { cost, sp, name };
    }
    return best;
  }

  function pcName(pc, preferFlats) {
    const sharp = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
    const flat = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
    return (preferFlats ? flat : sharp)[mod(pc, 12)];
  }

  function fixedDo(noteName) {
    const L = LETTERS.indexOf(noteName[0]);
    return SOLFEGE[L] + noteName.slice(1);
  }

  // Build a full key context: everything the UI needs to label notes.
  function keyContext(tonicPc, m) {
    const { sp, name } = bestSpelling(tonicPc, m);
    const ivs = modeIntervals(m);
    const par = parallelLabels(m);
    const parentPc = mod(tonicPc - MAJOR[m], 12);
    const preferFlats = sp.some(n => n.acc < 0);
    const byPc = {};
    sp.forEach((n, i) => {
      const parentDeg = ((m + i) % 7) + 1; // degree in the parent major ("Major based on Do")
      byPc[n.pc] = {
        pc: n.pc, name: n.name, step: i, interval: ivs[i],
        parallel: par[i], parentDeg,
        sylParallel: parallelSyllable(par[i]),
        sylRelative: SOLFEGE[parentDeg - 1],
        fixed: fixedDo(n.name),
      };
    });
    const triad = [0, 2, 4].map(i => sp[i].pc);
    return {
      tonicPc, mode: m, tonicName: name, spelled: sp, byPc, parentPc,
      parentName: bestSpelling(parentPc, 0).name, preferFlats, triad,
      isScale: pc => byPc[mod(pc, 12)] !== undefined,
    };
  }

  // Label for any pitch class under a label system.
  function label(ctx, pc, system) {
    const info = ctx.byPc[mod(pc, 12)];
    if (!info) {
      const nm = pcName(pc, ctx.preferFlats);
      if (system === 'fixed') return fixedDo(nm);
      if (system === 'names') return nm;
      return '';
    }
    switch (system) {
      case 'names': return info.name;
      case 'fixed': return info.fixed;
      case 'parallel': return info.parallel;
      case 'relative': return String(info.parentDeg);
      case 'sylParallel': return info.sylParallel;
      case 'sylRelative': return info.sylRelative;
      default: return info.name;
    }
  }

  // ---- Positions, the way the lesson draws them ---------------------------
  // Every position walks up the strings using this repeating cycle of
  // degree groups (in the parent major). 3+3+3+2+3 = 14 notes = 2 octaves.
  const GROUPS = [[3, 4, 5], [6, 7, 1], [2, 3, 4], [5, 6], [7, 1, 2]];
  // Which group sits on the low E string in each parent-major position.
  const POS_START = [0, 3, 1, 4, 2]; // P1 C-shape, P2 A-shape, P3 G-shape, P4 E-shape, P5 D-shape
  const CAGED = ['C', 'A', 'G', 'E', 'D'];

  function buildParentPosition(parentPc, p) {
    const start = POS_START[p];
    const scalePcs = MAJOR.map(iv => mod(parentPc + iv, 12));
    const firstDeg = GROUPS[start][0];
    let midi = OPEN[0] + mod(parentPc + MAJOR[firstDeg - 1] - 4, 12);
    const notes = [];
    let first = true;
    for (let s = 0; s < 6; s++) {
      const gi = (start + s) % 5;
      const group = GROUPS[gi];
      let groupBase = null;
      group.forEach((deg) => {
        if (!first) {
          do { midi++; } while (!scalePcs.includes(mod(midi, 12)));
        }
        first = false;
        const fret = midi - OPEN[s];
        if (groupBase === null) groupBase = fret;
        const off = fret - groupBase;
        notes.push({ s, fret, midi, pc: mod(midi, 12), parentDeg: deg, groupIdx: gi, finger: off + 1 });
      });
    }
    const min = Math.min(...notes.map(n => n.fret));
    if (min < 0) notes.forEach(n => { n.fret += 12; n.midi += 12; });
    return notes;
  }

  // Pair adjacent strings into the lesson's two-string "cells" (型).
  const CELL_NAMES = { '1+2': 'La型', '4+0': 'Si型', '0+1': 'Mi型' };
  function cellsFor(notes) {
    const byString = [0, 1, 2, 3, 4, 5].map(s => notes.filter(n => n.s === s));
    const g = byString.map(arr => arr[0].groupIdx);
    const used = new Array(6).fill(false);
    const cells = [];
    const tryPair = (keys) => {
      for (let s = 0; s < 5; s++) {
        if (used[s] || used[s + 1]) continue;
        const k = g[s] + '+' + g[s + 1];
        if (keys.includes(k)) { used[s] = used[s + 1] = true; cells.push({ s1: s, s2: s + 1, name: CELL_NAMES[k], crossesGB: s === 3 }); }
      }
    };
    tryPair(['1+2', '4+0']);
    tryPair(['0+1']);
    for (let s = 0; s < 6; s++) if (!used[s]) cells.push({ s1: s, s2: s, name: g[s] === 3 ? 'Sol·La' : '', crossesGB: false });
    return cells.map(c => {
      const ns = notes.filter(n => n.s >= c.s1 && n.s <= c.s2);
      return { ...c, f1: Math.min(...ns.map(n => n.fret)), f2: Math.max(...ns.map(n => n.fret)) };
    });
  }

  // ---- Anchors & hand shifts --------------------------------------------
  // Teacher's rule: the lowest note on every string is played by the index (食).
  // "home" = the fret the index sits on for most strings; strings whose lowest
  // note is somewhere else force a shift. Anchors = which finger lands on the root.
  function handInfo(notes, tonicPc) {
    const base = [0, 1, 2, 3, 4, 5].map(s => Math.min(...notes.filter(n => n.s === s).map(n => n.fret)));
    const count = {};
    base.forEach(b => { count[b] = (count[b] || 0) + 1; });
    let home = base[0];
    Object.keys(count).forEach(b => { if (count[b] > count[home] || (count[b] === count[home] && +b < home)) home = +b; });
    const shifts = base.map((b, s) => (s === 0 ? b - home : b - base[s - 1])); // relative to the string below
    notes.forEach(n => { n.fingerFixed = Math.min(4, Math.max(1, n.fret - home + 1)); });
    const anchors = notes.filter(n => n.pc === tonicPc).map(n => ({ s: n.s, fret: n.fret, finger: n.finger, fingerFixed: n.fingerFixed }));
    return { home, base, shifts, anchors };
  }

  // Positions for any mode: built from the parent major, then renumbered so
  // P1 is the shape whose A-string root sits at the top of the hand
  // (this reproduces the lesson's numbering for both major and minor).
  function positionsFor(ctx) {
    const parent = [0, 1, 2, 3, 4].map(p => buildParentPosition(ctx.parentPc, p));
    let bestK = 0, bestScore = Infinity;
    parent.forEach((notes, k) => {
      const minF = Math.min(...notes.map(n => n.fret));
      notes.filter(n => n.s === 1 && n.pc === ctx.tonicPc).forEach(n => {
        const score = minF - n.fret;
        if (score < bestScore) { bestScore = score; bestK = k; }
      });
    });
    return [0, 1, 2, 3, 4].map(i => {
      const k = (bestK + i) % 5;
      const notes = parent[k];
      return {
        num: i + 1, parentNum: k + 1, caged: CAGED[k], notes, cells: cellsFor(notes),
        minFret: Math.min(...notes.map(n => n.fret)), maxFret: Math.max(...notes.map(n => n.fret)),
        ...handInfo(notes, ctx.tonicPc),
      };
    });
  }

  // ---- Melody translation between approach A (1-based) and B (La-based) ---
  const PAR_FROM_IV = ['1', '♭2', '2', '♭3', '3', '4', '♯4', '5', '♭6', '6', '♭7', '7'];
  const MAJ_FROM_IV = ['1', '♯1', '2', '♭3', '3', '4', '♯4', '5', '♯5', '6', '♭7', '7'];

  function parseDegree(tok) {
    const t = tok.trim().replace(/b/g, '♭').replace(/#/g, '♯');
    const m = t.match(/^([♭♯]*)([1-7])$/);
    if (!m) return null;
    const acc = [...m[1]].reduce((a, c) => a + (c === '♯' ? 1 : -1), 0);
    return mod(MAJOR[+m[2] - 1] + acc, 12);
  }

  // dir: 'BtoA' (La-based → 1-based) or 'AtoB'
  function translate(text, dir) {
    return text.split(/[\s,]+/).filter(Boolean).map(tok => {
      const iv = parseDegree(tok);
      if (iv === null) return { in: tok, out: '?', iv: null };
      if (dir === 'BtoA') { const x = mod(iv - 9, 12); return { in: tok, out: PAR_FROM_IV[x], iv: x }; }
      const x = mod(iv + 9, 12);
      return { in: tok, out: MAJ_FROM_IV[x], iv };
    });
  }

  return {
    MAJOR, MODES, SOLFEGE, FINGERS, FINGER_EN, OPEN, STRING_NAMES, TONICS, GROUPS, CAGED,
    mod, modeIntervals, parallelLabels, keyContext, label, positionsFor, buildParentPosition,
    cellsFor, translate, parseDegree, pcName, bestSpelling, PAR_FROM_IV,
  };
})();
