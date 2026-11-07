// Fretboard Notebook: UI wiring.
(() => {
  const T = Theory;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mod = T.mod;

  // ---------- state ----------
  const DEFAULTS = { lang: 'en', tonic: 9, mode: 0, labels: 'parallel', pos: 1, cells: true, fingers: false, triad: false, ghost: true, chromatic: false, bpm: 110, tab: 'fretboard', quiz: 'find', quizPos: 0, modeView: 'A', relView: 1, cellGB: false, cyclePos: 1, anchors: false, fingering: 'teacher', anchorPos: 4, jamChord: -1, playMode: 'pos', link: false };
  let state = { ...DEFAULTS };
  try { Object.assign(state, JSON.parse(localStorage.getItem('fretnotebook') || '{}')); } catch (e) { /* storage unavailable */ }
  // URL overrides, e.g. ?tab=cells&lang=zh&tonic=0&mode=5
  new URLSearchParams(location.search).forEach((v, k) => {
    if (k in DEFAULTS) state[k] = typeof DEFAULTS[k] === 'number' ? +v : typeof DEFAULTS[k] === 'boolean' ? v === '1' : v;
  });
  const save = () => { try { localStorage.setItem('fretnotebook', JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const t = (en, zh) => (state.lang === 'zh' ? zh : en);
  const tx = o => (o && typeof o === 'object' && 'en' in o ? o[state.lang] : o);
  const ctx = () => T.keyContext(state.tonic, state.mode);
  const MAJ_CHROM = ['1', '♯1', '2', '♭3', '3', '4', '♯4', '5', '♯5', '6', '♭7', '7'];

  function lab(c, pc, system = state.labels) {
    if (c.isScale(pc)) return T.label(c, pc, system);
    if (system === 'names' || system === 'fixed') return T.label(c, pc, system);
    if (system === 'parallel' || system === 'sylParallel') return T.PAR_FROM_IV[mod(pc - c.tonicPc, 12)];
    return MAJ_CHROM[mod(pc - c.parentPc, 12)];
  }
  const isRelativeSystem = () => state.labels === 'relative' || state.labels === 'sylRelative';
  const modeName = m => (m === 0 ? t('major', '大調') : m === 5 ? t('minor', '小調') : T.MODES[m].name);
  const keyTitle = c => `${c.tonicName} ${modeName(c.mode)}`;
  const strName = s => t(`${T.STRING_NAMES[s]} string`, `${T.STRING_NAMES[s]} 弦`);
  const midiFor = (s, f) => T.OPEN[s] + f;

  // ---------- global controls ----------
  const keySel = $('#keySel'), modeSel = $('#modeSel'), labelSel = $('#labelSel');
  function fillKeySel() {
    keySel.innerHTML = '';
    for (let pc = 0; pc < 12; pc++) {
      const o = document.createElement('option');
      o.value = pc; o.textContent = T.bestSpelling(pc, state.mode).name;
      keySel.appendChild(o);
    }
    keySel.value = state.tonic;
  }
  const LABEL_OPTS = [
    ['names', 'Letters (C D E)', '音名 (C D E)'],
    ['fixed', 'Fixed-do (C is always Do)', '固定調唱名（C 永遠是 Do）'],
    ['parallel', 'Numbers, way A (1 2 ♭3)', '數字 A（1 2 ♭3）'],
    ['relative', 'Numbers, way B (6 7 1)', '數字 B（6 7 1）'],
    ['sylParallel', 'Movable-do, way A (Do Re Me)', '首調唱名 A（Do Re Me）'],
    ['sylRelative', 'Movable-do, way B (La Si Do)', '首調唱名 B（La Si Do）'],
  ];
  function fillStaticSelects() {
    modeSel.innerHTML = '';
    [0, 5, 1, 2, 3, 4, 6].forEach(i => {
      const m = T.MODES[i], o = document.createElement('option');
      o.value = i;
      o.textContent = i === 0 ? t('Major', '大調') : i === 5 ? t('Minor', '小調') : `${m.zh} ${m.name}`;
      modeSel.appendChild(o);
    });
    labelSel.innerHTML = LABEL_OPTS.map(([v, en, zh]) => `<option value="${v}">${t(en, zh)}</option>`).join('');
    $('#fingeringSel').innerHTML = `<option value="teacher">${t("Teacher's: every string starts on 食", '老師的：每條弦都從食指開始')}</option>
      <option value="fixed">${t('One finger per fret (hand stays still)', '一指一格（手不動）')}</option>`;
    $('#fingeringSel').value = state.fingering;
  }

  function syncControls() {
    document.body.className = 'lang-' + state.lang;
    document.documentElement.lang = state.lang === 'zh' ? 'zh-Hant' : 'en';
    $$('#langSwitch button').forEach(b => b.classList.toggle('on', b.dataset.lang === state.lang));
    fillStaticSelects();
    fillKeySel();
    modeSel.value = state.mode;
    labelSel.value = state.labels;
  }
  $$('#langSwitch button').forEach(b => b.onclick = () => { state.lang = b.dataset.lang; refresh(); });
  keySel.onchange = () => { state.tonic = +keySel.value; refresh(); };
  modeSel.onchange = () => { state.mode = +modeSel.value; refresh(); };
  labelSel.onchange = () => { state.labels = labelSel.value; refresh(); };

  // ---------- tabs ----------
  function showTab(t) {
    state.tab = t;
    document.body.dataset.tab = t;
    $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    $$('.tab').forEach(s => s.classList.toggle('on', s.id === 'tab-' + t));
    save();
    renderTab();
  }
  $$('#tabs button').forEach(b => b.onclick = () => showTab(b.dataset.tab));

  function seg(container, items, current, onPick) {
    container.innerHTML = '';
    items.forEach(it => {
      const b = document.createElement('button');
      b.textContent = it.label;
      if (it.title) b.title = it.title;
      b.classList.toggle('on', it.value === current);
      b.onclick = () => onPick(it.value);
      container.appendChild(b);
    });
  }

  // =====================================================================
  // FRETBOARD TAB
  // =====================================================================
  let noteEls = new Map();
  function fretEndFor(positions) {
    return Math.max(15, ...positions.map(p => p.maxFret));
  }

  function renderKeyline(c) {
    const parentNote = c.mode === 0 ? '' : ' <span class="muted">· ' + t(
      `same notes as <b>${c.parentName} major</b>, so ${c.tonicName} = <b>${T.SOLFEGE[c.mode]}</b>`,
      `跟 <b>${c.parentName} 大調</b>用同一組音，所以 ${c.tonicName} = <b>${T.SOLFEGE[c.mode]}</b>`) + '</span>';
    $('#fbTitle').textContent = keyTitle(c);
    $('#fbSub').innerHTML = c.mode === 0
      ? t('The 5 positions from your lessons', '上課學的 5 個把位')
      : parentNote.replace(' <span class="muted">· ', '<span>');
    $('#keyline').innerHTML = `<div class="kl-notes">${c.spelled.map(n => {
        const info = c.byPc[n.pc];
        return `<button class="kl-note${n.pc === c.tonicPc ? ' root' : ''}" data-pc="${n.pc}">
          <span>${info.name}</span><small>${lab(c, n.pc)}</small></button>`;
      }).join('')}</div>`;
    const base = 48 + c.tonicPc - (c.tonicPc > 7 ? 12 : 0);
    $$('#keyline .kl-note').forEach(b => b.onclick = () => Sound.play(base + mod(+b.dataset.pc - c.tonicPc, 12)));
  }

  const fingerOf = n => (state.fingering === 'teacher' ? n.finger : n.fingerFixed);

  // Index "home" line + shift labels, only meaningful for the teacher's fingering.
  function handMarks(pos) {
    const marks = [{ type: 'home', f: pos.home, text: t('食 home', '食指位置') }];
    if (state.fingering === 'teacher') pos.shifts.forEach((d, s) => {
      if (d) marks.push({ type: 'shift', s, f: pos.base[s], dir: d, text: (d > 0 ? '+' : '−') + Math.abs(d) });
    });
    return marks;
  }

  const FING_NAME = n => t(['', 'index', 'middle', 'ring', 'pinky'][n], ['', '食指', '中指', '無名指', '小指'][n]);
  function anchorSummary(pos) {
    const low = pos.anchors[0];
    const parts = [];
    pos.shifts.forEach((d, s) => { if (d && state.fingering === 'teacher') parts.push(`${T.STRING_NAMES[s]} ${d > 0 ? '+' : '−'}${Math.abs(d)}`); });
    const anchor = t(`<b>Anchor:</b> root on the ${T.STRING_NAMES[low.s]} string, fret ${low.fret}, under the ${FING_NAME(fingerOf(low))} (${T.FINGERS[fingerOf(low)]}).`,
      `<b>錨點：</b>主音在 ${T.STRING_NAMES[low.s]} 弦第 ${low.fret} 格，用${FING_NAME(fingerOf(low))}（${T.FINGERS[fingerOf(low)]}）。`);
    const home = t(` Index home: fret ${pos.home}.`, ` 食指位置：第 ${pos.home} 格。`);
    const shifts = parts.length ? t(` Shifts: ${parts.join(', ')}.`, ` 換把：${parts.join('、')}。`) : t(' No shifts.', ' 不用換把。');
    return anchor + home + (state.fingering === 'teacher' ? shifts : '');
  }

  function renderFretboard() {
    const c = ctx();
    renderKeyline(c);
    const positions = T.positionsFor(c);
    seg($('#posSeg'), [{ label: t('Whole neck', '整個指板'), value: 0 }, ...positions.map(p => ({ label: 'P' + p.num, value: p.num, title: t(`${p.caged}-shape, frets ${p.minFret}–${p.maxFret}`, `${p.caged} 型，第 ${p.minFret}–${p.maxFret} 格`) }))],
      state.pos, v => { state.pos = v; save(); renderTab(); });
    ['cells', 'anchors', 'fingers', 'triad', 'ghost', 'chromatic'].forEach(k => { $('#tg' + k[0].toUpperCase() + k.slice(1)).checked = state[k]; });

    const pos = state.pos ? positions[state.pos - 1] : null;
    const fretEnd0 = fretEndFor(positions);
    const inPos = new Map();
    if (pos) pos.notes.forEach(n => inPos.set(n.s + '-' + n.fret, n));
    const link = pos && state.link ? linkedPair(positions, pos) : null;
    const inB = new Map();
    if (link) link.bNotes.forEach(n => inB.set(n.s + '-' + n.fret, n));
    $$('#posSeg button').forEach(b => {
      b.classList.toggle('link-a', !!link && b.textContent === 'P' + link.A.num);
      b.classList.toggle('link-b', !!link && b.textContent === 'P' + link.B.num);
    });
    $('#linkBtn').hidden = !pos;
    $('#linkBtn').classList.toggle('on', !!link);
    $('#connLegend').innerHTML = link ? `<span><i class="lg pa"></i>P${link.A.num}</span><span><i class="lg shared"></i>${t('shared = bridge', '共用 = 橋')}</span><span><i class="lg pb"></i>P${link.B.num}</span>` : '';
    if (link) {
      const shared = link.bNotes.filter(n => inPos.has(n.s + '-' + n.fret));
      $('#linkInfo').innerHTML = t(
        `<b>P${link.A.num} → P${link.B.num}</b> share <b>${shared.length} notes</b> (orange). Play up P${link.A.num}; when you hit an orange note, keep going in P${link.B.num}'s shape. ▶ plays up P${link.A.num}, down P${link.B.num}.`,
        `<b>P${link.A.num} → P${link.B.num}</b> 共用 <b>${shared.length} 個音</b>（橘色）。從 P${link.A.num} 往上彈，碰到橘色的音就接著用 P${link.B.num} 的形狀彈。▶ 會 P${link.A.num} 往上、P${link.B.num} 往下。`);
    } else $('#linkInfo').innerHTML = '';
    const fretEnd = link ? Math.max(fretEnd0, link.B.maxFret + link.shift) : fretEnd0;

    const notes = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= fretEnd; f++) {
      const pc = mod(T.OPEN[s] + f, 12);
      const key = s + '-' + f;
      const scale = c.isScale(pc);
      const pn = inPos.get(key) || inB.get(key);
      const linkCls = link ? (inPos.has(key) && inB.has(key) ? 'shared' : inPos.has(key) ? 'pa' : inB.has(key) ? 'pb' : '') : '';
      if (!scale) {
        if (state.chromatic) notes.push({ s, f, cls: 'other', text: lab(c, pc) });
        continue;
      }
      if (pos && !pn && !state.ghost) continue;
      const cls = [];
      if (pc === c.tonicPc) cls.push('root');
      if (linkCls) cls.push(linkCls);
      if (pos && !pn) cls.push('ghost');
      const hl = jamChordPcs(c) || (state.triad ? c.triad : null);
      if (hl) cls.push(hl.includes(pc) ? 'chord' : 'faded');
      if (isRelativeSystem() && c.mode !== 0 && pc === c.parentPc) cls.push('pdo');
      const isAnchor = state.anchors && pn && pc === c.tonicPc;
      if (isAnchor) cls.push('anchor');
      const info = c.byPc[pc];
      notes.push({
        s, f, cls: cls.join(' '), text: lab(c, pc),
        sub: isAnchor ? T.FINGERS[fingerOf(pn)] : (state.fingers && pn ? String(fingerOf(pn)) : ''),
        title: `${info.name} · ${info.fixed} · ${info.parallel} · ${info.sylParallel}`,
      });
    }
    const boxes = (pos && state.cells && !link) ? pos.cells.map(cl => ({ ...cl, label: cl.name, cls: cl.crossesGB ? 'gb' : '' })) : [];
    Fretboard.render($('#mainBoard'), { fretEnd, notes, boxes, marks: pos && state.anchors && !link ? handMarks(pos) : [], onClick: onBoardClick });
    noteEls = new Map(notes.map(n => [n.s + '-' + n.f, n._el]));
    renderPosInfo(c, pos, positions);
  }

  // ---------- Connect: current position + the next one up the neck ----------
  function linkedPair(positions, pos) {
    const order = [...positions].sort((a, b) => a.minFret - b.minFret);
    const B = order[(order.indexOf(pos) + 1) % 5];
    // the top position wraps around: move its neighbour an octave so they sit side by side
    let shift = 0, best = Infinity;
    [0, 12, -12].forEach(k => {
      const lo = B.minFret + k, hi = B.maxFret + k;
      if (lo < 0 || hi > 22) return;
      const d = Math.abs(lo - pos.maxFret);
      if (d < best) { best = d; shift = k; }
    });
    return { A: pos, B, shift, bNotes: B.notes.map(n => ({ ...n, fret: n.fret + shift, midi: n.midi + shift })) };
  }

  function onBoardClick(s, f) {
    const c = ctx();
    const pc = mod(T.OPEN[s] + f, 12);
    Sound.play(midiFor(s, f));
    flash(s, f);
    const info = c.byPc[pc];
    const nm = T.pcName(pc, c.preferFlats);
    if (!info) {
      $('#noteInfo').innerHTML = `<h3>${nm} <span class="muted">· ${strName(s)}, ${t('fret', '第')} ${f}${t('', ' 格')}</span></h3>
        <p>${t(`Not in ${keyTitle(c)}. Compared to the root it's <b>${T.PAR_FROM_IV[mod(pc - c.tonicPc, 12)]}</b>.`,
               `不在 ${keyTitle(c)} 裡面。跟主音比是 <b>${T.PAR_FROM_IV[mod(pc - c.tonicPc, 12)]}</b>。`)}</p>`;
      return;
    }
    const roles = [
      t('the root, "home"', '主音，「家」'), t('2nd', '2 級'), t('the 3rd: decides major or minor', '3 度：決定是大調還是小調'),
      t('4th', '4 級'), t('the 5th: strong, wants to go back home', '5 度：很穩，想回到主音'), t('6th', '6 級'), t('7th', '7 級'),
    ];
    $('#noteInfo').innerHTML = `<h3>${info.name} <span class="muted">· ${strName(s)}, ${t('fret', '第')} ${f}${t('', ' 格')}</span></h3>
      <table class="names">
        <tr><th>${t('Letter', '音名')}</th><td>${info.name}</td></tr>
        <tr><th>${t('Fixed-do', '固定調唱名')}</th><td>${info.fixed}</td></tr>
        <tr><th>${t('Way A', 'A 數法')}</th><td>${info.parallel} · ${info.sylParallel}</td></tr>
        <tr><th>${t('Way B', 'B 數法')}</th><td>${info.parentDeg} · ${info.sylRelative}${c.mode ? ` <span class="muted">(${t(`in ${c.parentName} major`, `在 ${c.parentName} 大調裡`)})</span>` : ''}</td></tr>
        <tr><th>${t('Job in the key', '在調裡的角色')}</th><td>${roles[info.step]}</td></tr>
      </table>`;
  }

  function flash(s, f, cls = 'active', ms = 380) {
    const e = noteEls.get(s + '-' + f);
    if (!e) return;
    e.classList.add(cls);
    setTimeout(() => e.classList.remove(cls), ms);
  }

  function renderPosInfo(c, pos, positions) {
    const box = $('#posInfo');
    if (!pos) {
      box.innerHTML = `<h3>${t('Whole neck', '整個指板')} · ${keyTitle(c)}</h3>
        <p>${t(`Every ${keyTitle(c)} note from the open strings to fret ${fretEndFor(positions)}. Filled dots = the root${c.mode === 0 ? ' (Do)' : ''}.`,
               `${keyTitle(c)} 從空弦到第 ${fretEndFor(positions)} 格的所有音。實心點 = 主音${c.mode === 0 ? '（Do）' : ''}。`)}</p>
        <p class="muted">${t('The 5 positions overlap like roof tiles: the top of one is the bottom of the next. Click P1→P5 and watch them slide up the neck. After P5 it starts again from P1, 12 frets higher.',
               '5 個把位像屋瓦一樣疊在一起：上一個的頂端就是下一個的底部。從 P1 點到 P5，看它們往上滑。P5 之後又回到 P1，只是高 12 格。')}</p>`;
      return;
    }
    const rows = [5, 4, 3, 2, 1, 0].map(s => {
      const ns = pos.notes.filter(n => n.s === s);
      return `<tr><th>${T.STRING_NAMES[s]}</th><td>${ns.map(n => `<span class="chip${n.pc === c.tonicPc ? ' root' : ''}">${lab(c, n.pc)}</span>`).join('')}</td>
        <td class="muted">${ns.map(n => T.FINGERS[fingerOf(n)]).join(' ')}</td></tr>`;
    }).join('');
    const fromParent = c.mode !== 0 ? `<p class="muted">${t(
      `This is the same shape as <b>${c.parentName} major P${pos.parentNum}</b>. The filled dot just moves to ${c.tonicName}.`,
      `其實就是 <b>${c.parentName} 大調 P${pos.parentNum}</b> 的形狀，只是實心點換到 ${c.tonicName}。`)}</p>` : '';
    const cellList = pos.cells.filter(x => x.name).map(x => `<b>${x.name}</b> (${T.STRING_NAMES[x.s1]}${x.s2 !== x.s1 ? '–' + T.STRING_NAMES[x.s2] : ''})`).join(', ');
    box.innerHTML = `<h3>P${pos.num} · ${t(`frets ${pos.minFret}–${pos.maxFret}`, `第 ${pos.minFret}–${pos.maxFret} 格`)} <span class="pill">CAGED: ${pos.caged}</span></h3>
      ${fromParent}
      <p>${anchorSummary(pos)}</p>
      <table class="posrows">${rows}</table>
      <p class="muted">${t('Fingers: 食 index · 中 middle · 無 ring · 小 pinky.', '手指：食 食指 · 中 中指 · 無 無名指 · 小 小指。')} ${t('Cells', '型')}: ${cellList}</p>`;
  }

  ['cells', 'anchors', 'fingers', 'triad', 'ghost', 'chromatic'].forEach(k => {
    $('#tg' + k[0].toUpperCase() + k.slice(1)).onchange = e => { state[k] = e.target.checked; save(); renderFretboard(); };
  });

  function currentPos() {
    const positions = T.positionsFor(ctx());
    return positions[(state.pos || 1) - 1];
  }
  function playNotes(list) {
    Sound.sequence(list.map(n => ({ midi: n.midi, s: n.s, f: n.fret })), state.bpm,
      it => flash(it.s, it.f, 'active', Math.max(200, 60000 / state.bpm)));
  }
  // One play button; the segmented switch decides what it plays.
  function playSelection() {
    const c = ctx(), ns = currentPos().notes;
    let list = ns;
    if (state.link && state.playMode === 'pos' && state.pos) {
      const L = linkedPair(T.positionsFor(c), currentPos());
      const top = ns[ns.length - 1].midi;
      const down = [...L.bNotes].reverse();
      const start = down.findIndex(n => n.midi < top);
      return playNotes([...ns, ...down.slice(Math.max(0, start))]);
    }
    if (state.playMode === 'octave') {
      const i = ns.findIndex(n => n.pc === c.tonicPc);
      list = ns.slice(i, i + 8);
    } else if (state.playMode === 'triad') {
      const pcs = jamChordPcs(c) || c.triad; // follows the jam-track chord if one is lit
      list = ns.filter(n => pcs.includes(n.pc));
    }
    playNotes([...list, ...list.slice(0, -1).reverse()]);
  }
  $('#playPos').onclick = playSelection;
  $('#linkBtn').onclick = () => { state.link = !state.link; save(); renderTab(); };
  $('#stopBtn').onclick = () => Sound.stop();
  function renderPlayMode() {
    $$('#playMode button').forEach(b => b.classList.toggle('on', b.dataset.m === state.playMode));
  }
  $$('#playMode button').forEach(b => b.onclick = () => { state.playMode = b.dataset.m; save(); renderPlayMode(); });
  function setBpm(v) {
    state.bpm = Math.max(40, Math.min(240, v));
    $('#bpmVal').textContent = state.bpm;
    save();
  }
  $('#bpmDown').onclick = () => setBpm(state.bpm - 5);
  $('#bpmUp').onclick = () => setBpm(state.bpm + 5);

  $('#fingeringSel').onchange = e => { state.fingering = e.target.value; save(); renderTab(); };

  // =====================================================================
  // ANCHORS TAB
  // =====================================================================
  function renderAnchors() {
    const c = ctx();
    const positions = T.positionsFor(c);
    // string x finger -> position (lowest-string occurrence wins)
    const map = {};
    positions.forEach(p => p.anchors.forEach(a => {
      const k = a.s + '-' + fingerOf(a);
      if (!map[k]) map[k] = { pos: p, a };
    }));
    const fingers = [1, 2, 3, 4];
    $('#anchorGrid').innerHTML = `<table class="anchor-grid"><thead><tr><th></th>${fingers.map(f => `<th>${T.FINGERS[f]}<br><small>${FING_NAME(f)}</small></th>`).join('')}</tr></thead><tbody>
      ${[5, 4, 3, 2, 1, 0].map(s => `<tr><th class="s">${T.STRING_NAMES[s]}</th>${fingers.map(f => {
        const m = map[s + '-' + f];
        if (!m) return '<td><div class="empty"></div></td>';
        return `<td><button data-p="${m.pos.num}" class="${m.pos.num === state.anchorPos ? 'on' : ''}"><b>P${m.pos.num}</b><small>${t('fret', '第')} ${m.a.fret}${t('', ' 格')} · CAGED ${m.pos.caged}</small></button></td>`;
      }).join('')}</tr>`).join('')}
    </tbody></table>`;
    $$('#anchorGrid button').forEach(b => b.onclick = () => { state.anchorPos = +b.dataset.p; save(); renderAnchors(); });

    const used = [...new Set(Object.keys(map).map(k => +k.split('-')[1]))].sort();
    $('#anchorInsight').innerHTML = state.fingering === 'teacher'
      ? t(`In ${keyTitle(c)}, the root only ever lands under <b>${used.map(f => T.FINGERS[f] + ' ' + FING_NAME(f)).join('</b> or <b>')}</b>. ${c.mode === 0 ? 'Under 中 the root sits in a Si型 (Si–Do half step = index→middle); under 小 it is the top of a La型 (La Si Do).' : ''} So "changing the anchor" really just means: pick a string, pick one of these fingers.`,
          `在 ${keyTitle(c)}，主音只會落在<b>${used.map(f => T.FINGERS[f] + '（' + FING_NAME(f) + '）').join('</b>或<b>')}</b>。${c.mode === 0 ? '用中指時，主音在 Si型 裡（Si–Do 半音 = 食指→中指）；用小指時，主音是 La型 的最上面（La Si Do）。' : ''}所以「換錨點」其實就是：選一條弦，再選這幾根手指之一。`)
      : t('With one-finger-per-fret the hand never shifts, so the anchor finger is simply "root fret − index fret + 1".', '一指一格的話手不會換把，所以錨點手指就是「主音格數 − 食指格數 + 1」。');

    const pos = positions[state.anchorPos - 1];
    const low = pos.anchors[0];
    $('#anchorTitle').innerHTML = `P${pos.num} · CAGED ${pos.caged} <span class="muted">· ${t(`root on ${T.STRING_NAMES[low.s]} string under ${FING_NAME(fingerOf(low))}`, `主音在 ${T.STRING_NAMES[low.s]} 弦、用${FING_NAME(fingerOf(low))}`)}</span>`;
    const notes = pos.notes.map(n => {
      const root = n.pc === c.tonicPc;
      return { s: n.s, f: n.fret, text: lab(c, n.pc), cls: root ? 'root anchor' : '', sub: root ? T.FINGERS[fingerOf(n)] : String(fingerOf(n)) };
    });
    Fretboard.render($('#anchorBoard'), {
      fretStart: Math.max(0, pos.minFret - 2), fretEnd: pos.maxFret + 1, notes, marks: handMarks(pos),
      onClick: (s, f) => Sound.play(midiFor(s, f)),
    });
    // step-by-step walk across the strings
    const steps = [0, 1, 2, 3, 4, 5].map(s => {
      const ns = pos.notes.filter(n => n.s === s);
      const d = pos.shifts[s];
      const move = state.fingering !== 'teacher' || !d ? '' : (d > 0 ? t(` → slide up ${d}`, ` → 往上移 ${d} 格`) : t(` → slide back ${-d}`, ` → 往回移 ${-d} 格`));
      return `<tr><th>${T.STRING_NAMES[s]}</th><td>${ns.map(n => `<span class="chip${n.pc === c.tonicPc ? ' root' : ''}">${lab(c, n.pc)}</span>`).join('')}</td>
        <td class="muted">${ns.map(n => T.FINGERS[fingerOf(n)]).join(' ')}</td><td><b>${move}</b></td></tr>`;
    }).join('');
    $('#anchorSteps').innerHTML = `<p style="margin-top:10px">${anchorSummary(pos)}</p><table class="posrows">${steps}</table>`;
    $('#anchorPlay').onclick = () => {
      noteEls = new Map(notes.map(n => [n.s + '-' + n.f, n._el]));
      playNotes([...pos.notes, ...pos.notes.slice(0, -1).reverse()]);
    };
    $('#anchorOpen').onclick = () => { state.pos = pos.num; state.anchors = true; save(); showTab('fretboard'); };
  }

  // =====================================================================
  // CELLS TAB
  // =====================================================================
  const CELLS = [
    { name: 'La型', lower: [[0, 6], [2, 7], [3, 1]], upper: [[0, 2], [2, 3], [3, 4]], fingers: '食 · 無 小',
      desc: { en: 'Lower string La Si Do, upper string Re Mi Fa. Same fingers on both strings: index, ring, pinky.', zh: '低音弦 La Si Do，高音弦 Re Mi Fa。兩條弦手指都一樣：食指、無名指、小指。' } },
    { name: 'Si型', lower: [[0, 7], [1, 1], [3, 2]], upper: [[0, 3], [1, 4], [3, 5]], fingers: '食 中 · 小',
      desc: { en: 'Lower string Si Do Re, upper string Mi Fa Sol. Index, middle, pinky. Both half steps (Si–Do, Mi–Fa) are index→middle.', zh: '低音弦 Si Do Re，高音弦 Mi Fa Sol。食指、中指、小指。兩個半音（Si–Do、Mi–Fa）都是食指→中指。' } },
    { name: 'Mi型', lower: [[0, 3], [1, 4], [3, 5]], upper: [[0, 6], [2, 7], [3, 1]], fingers: '食 中 · 小 / 食 · 無 小',
      desc: { en: 'Lower string Mi Fa Sol, upper string La Si Do. It links the others: its top string is the bottom of a La型.', zh: '低音弦 Mi Fa Sol，高音弦 La Si Do。它是連接用的：上面那條弦剛好是 La型 的下半部。' } },
    { name: 'Sol·La', lower: [[0, 5], [2, 6]], upper: [], fingers: '食 · 無',
      desc: { en: 'The string with only 2 notes. Every position has exactly one, which keeps the box about 4 frets wide.', zh: '只有 2 個音的那條弦。每個把位剛好有一條，所以框框大概維持 4 格寬。' } },
  ];
  const SYL = T.SOLFEGE;

  function cellSVG(cell, gb) {
    const W = 200, H = cell.upper.length ? 96 : 60, x0 = 18, fw = 42, y0 = 26, sg = 36;
    const shift = gb ? 1 : 0;
    const strings = cell.upper.length ? 2 : 1;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="cellsvg">`;
    for (let i = 0; i <= 4; i++) s += `<line x1="${x0 + i * fw}" y1="${y0 - 12}" x2="${x0 + i * fw}" y2="${y0 + (strings - 1) * sg + 12}" class="fb-fret"/>`;
    for (let r = 0; r < strings; r++) s += `<line x1="${x0}" y1="${y0 + r * sg}" x2="${x0 + 4 * fw + (gb ? fw : 0)}" y2="${y0 + r * sg}" class="fb-string" stroke-width="1.4"/>`;
    if (gb) s = s.replace(`viewBox="0 0 ${W}`, `viewBox="0 0 ${W + fw}`) + `<line x1="${x0 + 5 * fw}" y1="${y0 - 12}" x2="${x0 + 5 * fw}" y2="${y0 + sg + 12}" class="fb-fret"/>`;
    const dot = (off, deg, row, rowShift) => {
      const x = x0 + (off + rowShift) * fw + fw / 2, y = y0 + row * sg;
      return `<g class="fb-note${deg === 1 ? ' root' : ''}" transform="translate(${x},${y})"><circle r="14" class="dot"/><text y="4" class="lbl small">${SYL[deg - 1]}</text></g>`;
    };
    if (cell.upper.length) {
      cell.upper.forEach(([o, d]) => s += dot(o, d, 0, shift));
      cell.lower.forEach(([o, d]) => s += dot(o, d, 1, 0));
    } else cell.lower.forEach(([o, d]) => s += dot(o, d, 0, 0));
    return s + '</svg>';
  }

  function playCell(cell) {
    const c = ctx();
    const first = cell.lower[0][1];
    let midi = 45 + mod(c.parentPc + T.MAJOR[first - 1] - 45, 12);
    const seq = [...cell.lower, ...cell.upper].map((_, i) => {
      if (i > 0) do { midi++; } while (!c.isScale(midi));
      return { midi };
    });
    Sound.sequence(seq, state.bpm);
  }

  function renderCells() {
    const c = ctx();
    const gb = state.cellGB;
    $('#cellCards').innerHTML = `<label class="gbtoggle"><input type="checkbox" id="cellGB" ${gb ? 'checked' : ''}> ${t('Show what it looks like when it crosses G→B', '顯示跨過 G→B 弦時的樣子')}</label>` +
      CELLS.map((cell, i) => `<div class="box cellcard">
        <h3>${cell.name}</h3>
        ${cellSVG(cell, gb && cell.upper.length)}
        <p class="fing">${cell.fingers}</p>
        <p class="muted">${tx(cell.desc)}</p>
        <button class="btn" data-cell="${i}">▶ ${t(`Hear it in ${c.parentName} major`, `用 ${c.parentName} 大調聽`)}</button>
      </div>`).join('');
    $('#cellGB').onchange = e => { state.cellGB = e.target.checked; save(); renderCells(); };
    $$('[data-cell]').forEach(b => b.onclick = () => playCell(CELLS[+b.dataset.cell]));

    // cycle strip
    const groups = [...T.GROUPS, ...T.GROUPS, ...T.GROUPS.slice(0, 2)];
    const positions = T.positionsFor(c);
    const pos = positions[state.cyclePos - 1];
    const startGi = pos.notes[0].groupIdx;
    // find first occurrence of startGi; highlight 6 from there
    const startIdx = groups.findIndex((_, i) => i % 5 === startGi);
    $('#cycleStrip').innerHTML = groups.map((g, i) => `<div class="grp${i >= startIdx && i < startIdx + 6 ? ' on' : ''}">
        <b>${g.join(' ')}</b><small>${g.map(d => SYL[d - 1]).join(' ')}</small></div>`).join('');
    seg($('#cycleSeg'), positions.map(p => ({ label: 'P' + p.num, value: p.num })), state.cyclePos, v => { state.cyclePos = v; save(); renderCells(); });

    const cellOf = s => pos.cells.find(x => s >= x.s1 && s <= x.s2);
    $('#cycleStack').innerHTML = `<table class="stack">${[5, 4, 3, 2, 1, 0].map(s => {
      const ns = pos.notes.filter(n => n.s === s);
      const cl = cellOf(s);
      const showName = cl && cl.name && s === cl.s2;
      return `<tr><th>${T.STRING_NAMES[s]}</th><td>${ns.map(n => `<span class="chip${n.pc === c.tonicPc ? ' root' : ''}">${n.parentDeg}</span>`).join('')}</td><td class="cellname">${showName ? cl.name : ''}</td></tr>`;
    }).join('')}</table>`;
    const notes = pos.notes.map(n => ({ s: n.s, f: n.fret, text: String(n.parentDeg), cls: n.pc === c.tonicPc ? 'root' : '' }));
    Fretboard.render($('#cycleBoard'), {
      fretStart: Math.max(0, pos.minFret - 1), fretEnd: pos.maxFret + 1, compact: true, notes,
      boxes: pos.cells.map(cl => ({ ...cl, label: cl.name, cls: cl.crossesGB ? 'gb' : '' })),
      onClick: (s, f) => Sound.play(midiFor(s, f)),
    });
  }

  // =====================================================================
  // MAJOR ↔ MINOR TAB
  // =====================================================================
  function formulaHTML(nums, syls, names, ivs) {
    let h = '<div class="fx">';
    nums.forEach((n, i) => {
      if (i > 0) {
        const step = mod(ivs[i] - ivs[i - 1], 12) || 12;
        h += `<span class="step ${step === 1 ? 'h' : 'w'}">${step === 1 ? 'H' : 'W'}</span>`;
      }
      const alt = /[♭♯]/.test(n);
      h += `<span class="fnote${alt ? ' alt' : ''}${i === 0 || i === nums.length - 1 ? ' root' : ''}"><b>${n}</b><small>${syls[i]}</small><em>${names[i]}</em></span>`;
    });
    return h + '</div>';
  }

  function renderMinor() {
    const tonic = state.tonic;
    const maj = T.keyContext(tonic, 0), min = T.keyContext(tonic, 5);
    const rel = T.keyContext(mod(tonic + 3, 12), 0);
    const majIv = [...T.MAJOR, 12];
    const minIv = [...T.modeIntervals(5), 12];
    const nm = c => [...c.spelled.map(n => n.name), c.spelled[0].name];
    $('#fMajor').innerHTML = formulaHTML(['1', '2', '3', '4', '5', '6', '7', '1'], [...SYL, 'Do'], nm(maj), majIv);
    $('#fMinorA').innerHTML = formulaHTML(['1', '2', '♭3', '4', '5', '♭6', '♭7', '1'], ['Do', 'Re', 'Me', 'Fa', 'Sol', 'Le', 'Se', 'Do'], nm(min), minIv);
    $('#fMinorB').innerHTML = formulaHTML(['6', '7', '1', '2', '3', '4', '5', '6'], ['La', 'Si', 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La'], nm(min), minIv);
    $('#relCard').innerHTML = `<h3>${t(`${min.tonicName} minor → La`, `${min.tonicName} 小調 → La`)}</h3>
      <p>${t(`In way B, <b>${min.tonicName}</b> is La, so Do is 3 frets higher: <b>${rel.tonicName}</b>.`,
             `用 B 的想法，<b>${min.tonicName}</b> 是 La，所以 Do 在高 3 格的地方：<b>${rel.tonicName}</b>。`)}</p>
      <table class="names">
        <tr><th>${t('Relative major (same notes)', '關係大調（同一組音）')}</th><td><b>${rel.tonicName} ${t('major', '大調')}</b>: ${rel.spelled.map(n => n.name).join(' ')}</td></tr>
        <tr><th>${t('Parallel major (same root)', '同主音大調')}</th><td><b>${maj.tonicName} ${t('major', '大調')}</b>: ${maj.spelled.map(n => n.name).join(' ')}</td></tr>
        <tr><th>${t('Notes that change', '有變的音')}</th><td>${[2, 5, 6].map(i => `${maj.spelled[i].name} → <b>${min.spelled[i].name}</b>`).join(', ')}</td></tr>
      </table>
      <p class="muted">${t('Guitar shortcut: from a major root on the 6th or 5th string, go <b>down 3 frets</b> to get its relative minor (C → A). From a minor root, go up 3 to get the relative major.',
             '吉他小撇步：在第 6 或第 5 弦上，大調主音<b>往下 3 格</b>就是它的關係小調（C → A）。反過來，小調主音往上 3 格就是關係大調。')}</p>`;

    // relative / parallel board
    const opts = [
      { label: t(`${maj.tonicName} major (same root)`, `${maj.tonicName} 大調（同主音）`), value: 0, c: maj },
      { label: t(`${min.tonicName} minor`, `${min.tonicName} 小調`), value: 1, c: min },
      { label: t(`${rel.tonicName} major (same notes)`, `${rel.tonicName} 大調（關係大調）`), value: 2, c: rel },
    ];
    seg($('#relSeg'), opts, state.relView, v => { state.relView = v; save(); renderMinor(); });
    const c = opts[state.relView].c;
    const notes = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= 15; f++) {
      const pc = mod(T.OPEN[s] + f, 12);
      if (!c.isScale(pc)) continue;
      const changed = state.relView === 0 ? false : !maj.isScale(pc);
      notes.push({ s, f, text: lab(c, pc), cls: (pc === c.tonicPc ? 'root ' : '') + (changed && state.relView === 1 ? 'alt' : '') });
    }
    Fretboard.render($('#relBoard'), { fretEnd: 15, notes, onClick: (s, f) => Sound.play(midiFor(s, f)) });
    renderTranslator();
  }

  let trDir = 'BtoA';
  function renderTranslator() {
    const min = T.keyContext(state.tonic, 5);
    const res = T.translate($('#trIn').value, trDir);
    $('#trOut').innerHTML = res.map(r => {
      const name = r.iv === null ? '' : T.pcName(min.tonicPc + r.iv, min.preferFlats);
      const n = r.iv === null ? null : min.byPc[mod(min.tonicPc + r.iv, 12)];
      return `<span class="tr-tok${r.iv === null ? ' bad' : ''}"><small>${r.in}</small><b>${r.out}</b><em>${n ? n.name : name}</em></span>`;
    }).join('');
  }
  $$('#trDir button').forEach(b => b.onclick = () => {
    trDir = b.dataset.dir;
    $$('#trDir button').forEach(x => x.classList.toggle('on', x === b));
    $('#trIn').value = trDir === 'BtoA' ? '6 7 1 3 2 1' : '1 2 b3 5 4 b3';
    renderTranslator();
  });
  $('#trIn').oninput = renderTranslator;
  $('#trPlay').onclick = () => {
    const min = T.keyContext(state.tonic, 5);
    const res = T.translate($('#trIn').value, trDir).filter(r => r.iv !== null);
    const base = 52 + mod(min.tonicPc - 52, 12); // tonic between E3 and D#4
    let prev = null;
    const seq = res.map(r => {
      const m = prev === null ? base + r.iv : prev + mod(base + r.iv - prev + 6, 12) - 6;
      prev = m;
      return { midi: m };
    });
    Sound.sequence(seq, state.bpm);
  };

  // =====================================================================
  // MODES TAB
  // =====================================================================
  const LADDER = [
    { m: 3, change: { en: 'brightest (♯4)', zh: '最亮（♯4）' } },
    { m: 0, change: '♯4 → 4' },
    { m: 4, change: '7 → ♭7' },
    { m: 1, change: '3 → ♭3' },
    { m: 5, change: '6 → ♭6' },
    { m: 2, change: '2 → ♭2' },
    { m: 6, change: '5 → ♭5' },
  ];

  function modeSeq(tonicPc, m) {
    const base = 48 + mod(tonicPc, 12);
    const ivs = [...T.modeIntervals(m), 12];
    return [...ivs, ...ivs.slice(0, -1).reverse()].map(iv => ({ midi: base + iv }));
  }

  function renderModes() {
    $$('#modeView button').forEach(b => b.classList.toggle('on', b.dataset.v === state.modeView));
    const rows = T.MODES.map((md, m) => {
      const tonicPc = state.modeView === 'A' ? state.tonic : mod(state.tonic + T.MAJOR[m], 12);
      const c = T.keyContext(tonicPc, m);
      const par = T.parallelLabels(m);
      const formula = state.modeView === 'A'
        ? par.map(l => `<span class="${/[♭♯]/.test(l) ? 'alt' : ''}">${l}</span>`).join(' ')
        : [...Array(7)].map((_, i) => ((m + i) % 7) + 1).map(d => `<span>${d}</span>`).join(' ');
      const parentMaj = state.modeView === 'A' ? c.parentName : T.bestSpelling(state.tonic, 0).name;
      const how = m === 0 ? t('just the major scale', '就是大調本身')
        : t(`= ${parentMaj} major starting on ${SYL[m]} (${m + 1})`, `= ${parentMaj} 大調從 ${SYL[m]}（${m + 1}）開始`);
      const alias = m === 0 ? t('Major', '大調') : m === 5 ? t('Natural minor', '小調') : '';
      return `<tr>
        <td class="num">${md.zh}</td>
        <td><b>${c.tonicName} ${md.name}</b>${alias ? `<br><small class="muted">${alias}</small>` : ''}</td>
        <td class="formula-cell">${formula}</td>
        <td class="notes-cell">${c.spelled.map(n => n.name).join(' ')}<br><small class="muted">${how}</small></td>
        <td class="feel muted">${tx(Content.modeFeel[m])}</td>
        <td class="acts"><button class="btn small" data-play="${m}" data-pc="${tonicPc}">▶</button>
          <button class="btn small ghost" data-show="${m}" data-pc="${tonicPc}">${t('See on neck →', '看指板 →')}</button></td>
      </tr>`;
    }).join('');
    $('#modeTable').innerHTML = `<div class="table-scroll"><table class="modes"><thead><tr><th></th><th>${t('Mode', '調式')}</th><th>${state.modeView === 'A' ? t('Compared to major', '跟大調比') : t('Which major notes', '大調的哪幾個音')}</th><th>${t('Notes', '音')}</th><th>${t('Sounds like', '聽起來')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
    $$('[data-play]').forEach(b => b.onclick = () => Sound.sequence(modeSeq(+b.dataset.pc, +b.dataset.play), state.bpm * 1.4));
    $$('[data-show]').forEach(b => b.onclick = () => { state.mode = +b.dataset.show; state.tonic = +b.dataset.pc; syncControls(); showTab('fretboard'); });

    $('#ladder').innerHTML = LADDER.map((r, i) => {
      const par = T.parallelLabels(r.m);
      const prev = i > 0 ? T.parallelLabels(LADDER[i - 1].m) : null;
      return `<button class="rung" data-m="${r.m}" style="--d:${i}">
        <span class="rname">${T.MODES[r.m].zh} ${T.MODES[r.m].name}</span>
        <span class="rform">${par.map((l, k) => `<span class="${prev && prev[k] !== l ? 'chg' : ''} ${/[♭♯]/.test(l) ? 'alt' : ''}">${l}</span>`).join('')}</span>
        <span class="rchg">${tx(r.change)}</span></button>`;
    }).join('');
    $$('#ladder .rung').forEach(b => b.onclick = () => Sound.sequence(modeSeq(state.tonic, +b.dataset.m), state.bpm * 1.4));
  }
  $$('#modeView button').forEach(b => b.onclick = () => { state.modeView = b.dataset.v; save(); renderModes(); });

  // =====================================================================
  // PRACTICE TAB
  // =====================================================================
  const score = { right: 0, total: 0, streak: 0 };
  let q = null;

  function pool() {
    const c = ctx();
    if (state.quizPos) return T.positionsFor(c)[state.quizPos - 1].notes.map(n => ({ s: n.s, f: n.fret, pc: n.pc }));
    const out = [];
    for (let s = 0; s < 6; s++) for (let f = 0; f <= 12; f++) {
      const pc = mod(T.OPEN[s] + f, 12);
      if (c.isScale(pc)) out.push({ s, f, pc });
    }
    return out;
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function newQuestion() {
    const c = ctx(), p = pool();
    const target = pick(p.filter(n => !q || n.pc !== q.target.pc || n.s !== q.target.s));
    q = { target, answered: false, c };
    $('#qFeedback').textContent = '';
    $('#qFeedback').className = 'feedback';
    if (state.quiz === 'find') {
      const where = state.quizPos ? ` (P${state.quizPos})` : '';
      $('#qPrompt').innerHTML = t(`Find <b class="big">${lab(c, target.pc)}</b> on the <b>${T.STRING_NAMES[target.s]}</b> string${where}`,
        `在 <b>${T.STRING_NAMES[target.s]}</b> 弦上找到 <b class="big">${lab(c, target.pc)}</b>${where}`);
      $('#qAnswers').innerHTML = '';
    } else if (state.quiz === 'name') {
      $('#qPrompt').innerHTML = t('What is the <span class="qmark">?</span> note?', '<span class="qmark">?</span> 是哪個音？');
      answerButtons(c);
    } else {
      $('#qPrompt').innerHTML = t(`Listen: first the ${c.tonicName} chord, then a mystery note. Which one is it?`, `聽：先聽 ${c.tonicName} 和弦，再聽一個神秘音。是哪一個？`) +
        ` <button class="btn small" id="qReplay">↻ ${t('Again', '再聽一次')}</button>`;
      answerButtons(c);
      $('#qReplay').onclick = playEar;
      playEar();
    }
    drawQuizBoard();
  }

  function playEar() {
    const c = q.c;
    const root = 48 + mod(c.tonicPc - 48, 12);
    const iv = mod(q.target.pc - c.tonicPc, 12);
    const chord = c.triad.map(pc => root + mod(pc - c.tonicPc, 12));
    Sound.sequence([{ midi: chord }, { midi: root + iv }], 70);
  }

  function answerButtons(c) {
    $('#qAnswers').innerHTML = c.spelled.map(n => `<button class="btn" data-pc="${n.pc}">${lab(c, n.pc)}</button>`).join('');
    $$('#qAnswers button').forEach(b => b.onclick = () => answer(+b.dataset.pc === q.target.pc, b));
  }

  function drawQuizBoard(extra = []) {
    const c = q.c;
    const notes = [];
    const p = pool();
    p.filter(n => n.pc === c.tonicPc).forEach(n => notes.push({ s: n.s, f: n.f, cls: 'root faint', text: '' }));
    if (state.quiz === 'name') notes.push({ s: q.target.s, f: q.target.f, cls: 'target', text: '?' });
    extra.forEach(e => notes.push(e));
    const positions = T.positionsFor(c);
    const pos = state.quizPos ? positions[state.quizPos - 1] : null;
    Fretboard.render($('#quizBoard'), {
      fretStart: pos ? Math.max(0, pos.minFret - 1) : 0,
      fretEnd: pos ? pos.maxFret + 1 : 12,
      notes,
      onClick: state.quiz === 'find' ? onFind : (s, f) => Sound.play(midiFor(s, f)),
    });
  }

  function onFind(s, f) {
    if (!q || q.answered) return;
    const c = q.c;
    const pc = mod(T.OPEN[s] + f, 12);
    Sound.play(midiFor(s, f));
    const ok = s === q.target.s && pc === q.target.pc;
    const reveal = pool().filter(n => n.s === q.target.s && n.pc === q.target.pc).map(n => ({ s: n.s, f: n.f, cls: 'correct', text: lab(c, n.pc) }));
    if (!ok) reveal.push({ s, f, cls: 'wrong', text: lab(c, pc) });
    drawQuizBoard(reveal);
    answer(ok);
  }

  function answer(ok, btn) {
    if (q.answered) return;
    q.answered = true;
    score.total++;
    if (ok) { score.right++; score.streak++; } else score.streak = 0;
    const c = q.c, info = c.byPc[q.target.pc];
    if (state.quiz !== 'find') {
      Sound.play(midiFor(q.target.s, q.target.f));
      $$('#qAnswers button').forEach(b => {
        if (+b.dataset.pc === q.target.pc) b.classList.add('right');
        else if (b === btn) b.classList.add('wrongb');
      });
      drawQuizBoard([{ s: q.target.s, f: q.target.f, cls: ok ? 'correct' : 'wrong', text: lab(c, q.target.pc) }]);
    }
    $('#qFeedback').className = 'feedback ' + (ok ? 'ok' : 'no');
    $('#qFeedback').innerHTML = (ok ? t('✓ Nice! ', '✓ 答對！') : t('✗ Not quite. ', '✗ 差一點。')) + t(
      `It's <b>${info.name}</b>: ${info.parallel} (${info.sylParallel}) in way A, ${info.parentDeg} (${info.sylRelative}) in way B.`,
      `答案是 <b>${info.name}</b>：A 數法是 ${info.parallel}（${info.sylParallel}），B 數法是 ${info.parentDeg}（${info.sylRelative}）。`);
    renderScore();
  }
  function renderScore() {
    $('#score').innerHTML = t(`<b>${score.right}</b>/${score.total} right · streak <b>${score.streak}</b>`, `答對 <b>${score.right}</b>/${score.total} · 連續 <b>${score.streak}</b> 題`) + (score.streak >= 5 ? ' 🔥' : '');
  }
  $('#qNext').onclick = newQuestion;

  function renderPractice() {
    $$('#quizSeg button').forEach(b => b.classList.toggle('on', b.dataset.q === state.quiz));
    const c = ctx();
    seg($('#quizPos'), [{ label: t('Frets 0–12', '第 0–12 格'), value: 0 }, ...T.positionsFor(c).map(p => ({ label: 'P' + p.num, value: p.num }))], state.quizPos,
      v => { state.quizPos = v; save(); renderPractice(); });
    renderScore();
    newQuestion();
  }
  $$('#quizSeg button').forEach(b => b.onclick = () => { state.quiz = b.dataset.q; save(); renderPractice(); });

  // =====================================================================
  // PERSPECTIVES + NOTES
  // =====================================================================
  function renderPerspectives() {
    $('#persp').innerHTML = Content.perspectives.map(p => `<article class="box"><span class="tagline">${tx(p.tag)}</span><h3>${tx(p.title)}</h3>${tx(p.body)}</article>`).join('');
  }
  function renderNotes() {
    $('#notesList').innerHTML = Content.notes.map(n => `<article class="box note-card">
      <img src="${n.img}" alt="${tx(n.title)}" loading="lazy">
      <div><h3>${tx(n.title)}</h3><ul>${tx(n.points).map(p => `<li>${p}</li>`).join('')}</ul></div></article>`).join('');
    $$('#notesList img').forEach(img => img.onclick = () => {
      $('#lbImg').src = img.src; $('#lightbox').classList.remove('zoomed'); $('#lightbox').hidden = false;
    });
  }
  // Photo viewer: click photo = toggle fit / full size, drag or scroll to pan, ✕ / Esc / backdrop = close.
  const lb = $('#lightbox'), lbScroll = $('#lbScroll');
  const closeLb = () => { lb.hidden = true; lb.classList.remove('zoomed'); };
  let drag = null, dragged = false;
  $('#lbImg').onclick = e => {
    if (dragged) return;
    const zoomIn = !lb.classList.contains('zoomed');
    const r = e.target.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
    lb.classList.toggle('zoomed', zoomIn);
    if (zoomIn) { // keep the clicked spot under the cursor
      lbScroll.scrollLeft = fx * lbScroll.scrollWidth - e.clientX;
      lbScroll.scrollTop = fy * lbScroll.scrollHeight - e.clientY;
    }
  };
  lbScroll.onclick = e => { if (e.target === lbScroll && !dragged) closeLb(); };
  $('#lbClose').onclick = closeLb;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
  lbScroll.addEventListener('mousedown', e => {
    if (!lb.classList.contains('zoomed')) return;
    drag = { x: e.clientX, y: e.clientY, l: lbScroll.scrollLeft, t: lbScroll.scrollTop }; dragged = false;
    e.preventDefault();
  });
  window.addEventListener('mousemove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
    lbScroll.scrollLeft = drag.l - dx; lbScroll.scrollTop = drag.t - dy;
  });
  window.addEventListener('mouseup', () => { drag = null; setTimeout(() => { dragged = false; }, 0); });

  // ---------- refresh ----------
  // ---------- GP-style chrome: LCD, title bar, positions "track" panel ----------
  const TRACK_COLORS = ['var(--track1)', 'var(--track2)', 'var(--track3)', 'var(--track4)', 'var(--track5)'];

  // ---------- jam track: I – V – ii – IV (A E Bm D in A major) ----------
  const JAM_DEGREES = [0, 4, 1, 3];
  const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
  function diatonicChord(c, step) {
    const sp = c.spelled;
    const pcs = [0, 2, 4].map(k => sp[(step + k) % 7].pc);
    const third = mod(pcs[1] - pcs[0], 12), fifth = mod(pcs[2] - pcs[0], 12);
    const q = third === 4 ? '' : fifth === 6 ? '°' : 'm';
    return { pcs, name: sp[step].name + q };
  }
  function jamChordPcs(c) {
    if (state.jamChord < 0 || state.mode !== 0) return null;
    return diatonicChord(c, JAM_DEGREES[state.jamChord]).pcs;
  }
  function renderJam() {
    const c = ctx();
    const isMajor = state.mode === 0;
    $('#jamChords').innerHTML = JAM_DEGREES.map((d, i) => {
      const ch = isMajor ? diatonicChord(c, d) : null;
      return `<button data-i="${i}" class="${state.jamChord === i ? 'on' : ''}" ${isMajor ? '' : 'disabled'}><b>${ch ? ch.name : '–'}</b><small>${ROMAN[d]}</small></button>`;
    }).join('');
    $$('#jamChords button').forEach(b => b.onclick = () => {
      state.jamChord = state.jamChord === +b.dataset.i ? -1 : +b.dataset.i;
      save();
      if (state.tab !== 'fretboard') showTab('fretboard'); else renderTab();
    });
    const inA = state.tonic === 9 && isMajor;
    $('#jamTip').className = 'muted jam-tip' + (inA ? '' : ' jam-warn');
    $('#jamTip').innerHTML = inA
      ? t('Tap the chord that is playing: its notes light up on the neck. Aim for those notes and your solo will "fit" the chord. Tap again to turn off.',
          '點正在播的和弦，它的音會在指板上亮起來。即興時瞄準這些音，聽起來就會跟和弦很搭。再點一次關掉。')
      : t('This track is in A major. <button class="mini-btn" id="jamToA">Switch to A major</button>',
          '這首伴奏是 A 大調。<button class="mini-btn" id="jamToA">切換到 A 大調</button>');
    const toA = $('#jamToA');
    if (toA) toA.onclick = () => { state.tonic = 9; state.mode = 0; refresh(); };
  }
  $('#jamTempo').onclick = () => setBpm(80);

  // YouTube refuses to play embeds on pages opened as a local file (Error 153).
  if (location.protocol === 'file:') {
    $('.video').innerHTML = `<div class="video-off">
      <p><b>${t('The video can\'t play when this page is opened as a file.', '用檔案直接打開這個頁面時，影片沒辦法播放。')}</b></p>
      <p>${t('Double-click <code>start.command</code> in the guitar-lessons folder instead. It opens the app at a local web address where YouTube works.', '請改成在 guitar-lessons 資料夾裡雙擊 <code>start.command</code>，它會用本機網址打開這個 App，這樣 YouTube 就能播。')}</p></div>`;
  }

  function renderChrome() {
    renderJam();
    const c = ctx();
    const positions = T.positionsFor(c);
    const pos = positions[(state.pos || 1) - 1];
    const L = state.link && state.pos ? linkedPair(positions, pos) : null;
    $('#lcdTitle').textContent = `♫ ${keyTitle(c)} · P${pos.num}${L ? ' → P' + L.B.num : ''}`;
    $('#lcdSub').textContent = t(`frets ${pos.minFret}–${pos.maxFret} · CAGED ${pos.caged}`, `第 ${pos.minFret}–${pos.maxFret} 格 · CAGED ${pos.caged}`);

  }


  function renderTab() {
    ({ fretboard: renderFretboard, anchors: renderAnchors, cells: renderCells, minor: renderMinor, modes: renderModes, practice: renderPractice, perspectives: renderPerspectives, notes: renderNotes })[state.tab]();
    renderChrome();
  }
  function refresh() { save(); syncControls(); renderTab(); }

  $('#bpmVal').textContent = state.bpm;
  renderPlayMode();
  syncControls();
  showTab(state.tab);
})();
