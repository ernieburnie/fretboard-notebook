// SVG fretboard renderer. High e on top, frets left→right (same as the lesson charts).
const Fretboard = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  function render(container, opts) {
    const o = Object.assign({ fretStart: 0, fretEnd: 15, notes: [], boxes: [], compact: false, onClick: null, stringLabels: true }, opts);
    const FW = o.compact ? 40 : 54;
    const SG = o.compact ? 26 : 34;
    const R = o.compact ? 10.5 : 13.5;
    const top = (o.marks && o.marks.length) ? 36 : 28; // room above the high e for boxes, finger labels and the "home" tag
    const left = o.stringLabels ? 22 : 8;
    const openW = o.fretStart === 0 ? (o.compact ? 30 : 38) : 0;
    const lineX = f => left + openW + (f - o.fretStart + (o.fretStart === 0 ? 0 : 1)) * FW;
    const cx = f => (f === 0 && o.fretStart === 0) ? left + openW / 2 : lineX(f) - FW / 2;
    const cy = s => top + (5 - s) * SG;
    const width = lineX(o.fretEnd) + 12;
    const height = top + 5 * SG + 30;

    container.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${width} ${height}`, class: 'fb' + (o.compact ? ' compact' : ''), role: 'img' });
    svg.style.minWidth = (o.compact ? width * 0.8 : Math.min(width, 980)) + 'px';
    svg.style.maxWidth = (width * 1.35) + 'px';
    container.appendChild(svg);

    // board
    const x0 = o.fretStart === 0 ? lineX(0) : lineX(o.fretStart - 1);
    el('rect', { x: x0, y: cy(5) - 6, width: lineX(o.fretEnd) - x0, height: 5 * SG + 12, class: 'fb-wood', rx: 3 }, svg);

    // inlay markers
    const inlays = [3, 5, 7, 9, 15, 17, 19, 21];
    for (let f = Math.max(1, o.fretStart); f <= o.fretEnd; f++) {
      const x = cx(f), midY = (cy(0) + cy(5)) / 2;
      if (inlays.includes(f)) el('circle', { cx: x, cy: midY, r: o.compact ? 4 : 5, class: 'fb-inlay' }, svg);
      if (f === 12) {
        el('circle', { cx: x, cy: cy(1) + SG / 2 - SG, r: 5, class: 'fb-inlay' }, svg);
        el('circle', { cx: x, cy: cy(3) + SG / 2 + SG, r: 5, class: 'fb-inlay' }, svg);
      }
    }

    // frets
    const fFirst = o.fretStart === 0 ? 0 : o.fretStart - 1;
    for (let f = fFirst; f <= o.fretEnd; f++) {
      el('line', { x1: lineX(f), y1: cy(5) - 6, x2: lineX(f), y2: cy(0) + 6, class: (f === 0 ? 'fb-nut' : 'fb-fret') }, svg);
    }
    // fret numbers
    for (let f = Math.max(o.fretStart, 0); f <= o.fretEnd; f++) {
      if (f === 0) continue;
      const t = el('text', { x: cx(f), y: cy(0) + 24, class: 'fb-num' + ([3, 5, 7, 9, 12, 15, 17].includes(f) ? ' strong' : '') }, svg);
      t.textContent = f;
    }
    // strings
    for (let s = 0; s < 6; s++) {
      el('line', { x1: x0 - (o.fretStart === 0 ? openW : 0), y1: cy(s), x2: lineX(o.fretEnd), y2: cy(s), class: 'fb-string', 'stroke-width': (2.3 - s * 0.3).toFixed(2) }, svg);
      if (o.stringLabels) {
        const t = el('text', { x: 8, y: cy(s) + 4, class: 'fb-sname' }, svg);
        t.textContent = Theory.STRING_NAMES[s];
      }
    }

    // boxes (cells)
    o.boxes.forEach(b => {
      const pad = R + 5;
      const x1 = cx(b.f1) - pad, x2 = cx(b.f2) + pad;
      const y1 = cy(b.s2) - pad + 2, y2 = cy(b.s1) + pad - 2;
      el('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, rx: 10, class: 'fb-box ' + (b.cls || '') }, svg);
      if (b.label) {
        const t = el('text', { x: x2 + 4, y: (y1 + y2) / 2 + 4, class: 'fb-box-label ' + (b.cls || '') }, svg);
        t.textContent = b.label;
      }
    });

    // hand marks: index "home" line and per-string shift labels
    (o.marks || []).forEach(m => {
      if (m.type === 'home') {
        const x = cx(m.f) - FW / 2 + 3;
        el('line', { x1: x, y1: cy(5) - 16, x2: x, y2: cy(0) + 16, class: 'fb-home' }, svg);
        const t = el('text', { x: x + 4, y: cy(5) - 18, class: 'fb-home-label' }, svg);
        t.textContent = m.text;
      } else if (m.type === 'shift') {
        const x = cx(m.f) - R - 5;
        const g = el('g', { class: 'fb-shift ' + (m.dir > 0 ? 'up' : 'down') }, svg);
        el('rect', { x: x - 26, y: cy(m.s) - 9, width: 26, height: 18, rx: 4 }, g);
        const t = el('text', { x: x - 13, y: cy(m.s) + 4 }, g);
        t.textContent = m.text;
      }
    });

    // click targets
    if (o.onClick) {
      for (let s = 0; s < 6; s++) for (let f = o.fretStart; f <= o.fretEnd; f++) {
        const w = (f === 0 && o.fretStart === 0) ? openW : FW;
        const r = el('rect', { x: cx(f) - w / 2, y: cy(s) - SG / 2, width: w, height: SG, class: 'fb-hit' }, svg);
        r.addEventListener('click', () => o.onClick(s, f));
      }
    }

    // notes
    o.notes.forEach(n => {
      const g = el('g', { class: 'fb-note ' + (n.cls || ''), transform: `translate(${cx(n.f)},${cy(n.s)})` }, svg);
      el('circle', { r: R, class: 'dot' }, g);
      if (n.text) {
        const t = el('text', { y: 4, class: 'lbl' + (n.text.length > 3 ? ' tiny' : n.text.length > 2 ? ' small' : '') }, g);
        t.textContent = n.text;
      }
      if (n.sub) {
        const t = el('text', { x: R - 1, y: -R + 3, class: 'sub' }, g);
        t.textContent = n.sub;
      }
      if (n.title) { const ti = el('title', {}, g); ti.textContent = n.title; }
      if (o.onClick) g.addEventListener('click', () => o.onClick(n.s, n.f));
      n._el = g;
    });
    return { svg, cx, cy };
  }

  return { render };
})();
