// Plucked-string synth (Karplus–Strong), rendered once per pitch and cached.
const Sound = (() => {
  let ctx = null, master = null;
  const cache = new Map();
  let timers = [];

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      const comp = ctx.createDynamicsCompressor();
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function buffer(midi) {
    if (cache.has(midi)) return cache.get(midi);
    const sr = ctx.sampleRate;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const len = Math.floor(sr * 1.4);
    const buf = ctx.createBuffer(1, len, sr);
    const out = buf.getChannelData(0);
    const period = Math.max(2, Math.round(sr / freq));
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    // soften the initial burst a little (pick closer to the neck = warmer)
    for (let k = 0; k < 2; k++) for (let i = 1; i < period; i++) ring[i] = 0.5 * (ring[i] + ring[i - 1]);
    const decay = midi > 64 ? 0.994 : 0.996;
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const next = (idx + 1) % period;
      const v = ring[idx];
      ring[idx] = decay * 0.5 * (v + ring[next]);
      out[i] = v;
      idx = next;
    }
    // short fade-in / fade-out to avoid clicks
    for (let i = 0; i < 64; i++) out[i] *= i / 64;
    for (let i = 0; i < 2000; i++) out[len - 1 - i] *= i / 2000;
    cache.set(midi, buf);
    return buf;
  }

  let live = [];

  // dur = how long the note rings before it is damped (seconds).
  function play(midi, when = 0, gain = 0.8, dur = 0.9) {
    ensure();
    const t0 = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = buffer(midi);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.setValueAtTime(gain, t0 + Math.max(0.02, dur - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // quick damp, like lifting the finger
    src.connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
    const node = { src, g };
    live.push(node);
    src.onended = () => { live = live.filter(n => n !== node); };
  }

  // Play a sequence of {midi, ...}: each note is damped right as the next starts.
  function sequence(items, bpm, onNote, onDone) {
    stop();
    ensure();
    const step = 60 / bpm;
    items.forEach((it, i) => {
      const t = i * step;
      const last = i === items.length - 1;
      if (Array.isArray(it.midi)) it.midi.forEach(m => play(m, t, 0.45, last ? 1.2 : step * 0.98));
      else play(it.midi, t, 0.8, last ? 0.9 : step * 0.98);
      timers.push(setTimeout(() => onNote && onNote(it, i), t * 1000));
    });
    timers.push(setTimeout(() => { onDone && onDone(); }, items.length * step * 1000 + 300));
  }

  // Stop highlighting AND silence anything already scheduled.
  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
    if (!ctx) return;
    const now = ctx.currentTime;
    live.forEach(({ src, g }) => {
      try {
        g.gain.cancelScheduledValues(now);
        g.gain.setValueAtTime(g.gain.value, now);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        src.stop(now + 0.05);
      } catch (e) { /* already stopped */ }
    });
    live = [];
  }

  return { play, sequence, stop, ensure };
})();
