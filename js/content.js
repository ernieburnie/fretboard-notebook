// Written content in both languages. Each entry has en / zh.
const Content = {
  modeFeel: [
    { en: 'Happy, settled, "home". Everything else gets compared to this.', zh: '開心、穩定、有「回家」的感覺。其他調式都拿它來比較。' },
    { en: 'Minor, but with a brighter 6. Cool and jazzy (think "Oye Como Va").', zh: '小調，但 6 比較亮。酷酷的、有點爵士味（像〈Oye Como Va〉）。' },
    { en: 'Minor with a ♭2. Dark, Spanish / flamenco / metal feel.', zh: '小調加上 ♭2。很暗，有西班牙、佛朗明哥、金屬的感覺。' },
    { en: 'Major with a ♯4. Dreamy and floaty, like movie music.', zh: '大調加上 ♯4。夢幻、飄飄的，很像電影配樂。' },
    { en: 'Major with a ♭7. Bluesy, classic rock sound.', zh: '大調加上 ♭7。藍調、經典搖滾的味道。' },
    { en: 'The normal minor scale. Sad, serious.', zh: '就是一般的小調。悲傷、嚴肅。' },
    { en: '♭2 and ♭5. Unstable, almost never used as "home".', zh: '有 ♭2 和 ♭5。很不穩，幾乎不會拿來當「家」。' },
  ],

  perspectives: [
    {
      tag: { en: 'Most guitar books & YouTube', zh: '大部分吉他書和 YouTube' },
      title: { en: 'The CAGED system', zh: 'CAGED 系統' },
      body: {
        en: `<p>Your 5 positions are the same 5 boxes the <b>CAGED</b> system uses. CAGED names each box after the open chord shape hidden inside it:</p>
        <table class="mini"><tr><th>Lesson</th><td>P1</td><td>P2</td><td>P3</td><td>P4</td><td>P5</td></tr>
        <tr><th>CAGED (major)</th><td>C</td><td>A</td><td>G</td><td>E</td><td>D</td></tr></table>
        <p>Turn on <b>Chord tones</b> on the Fretboard tab: in C major P1 you'll see the open C chord, in P4 the barre chord at fret 8. The big idea: <i>every scale box has a chord shape you already know inside it</i>. That's why your teacher drew the 1·Ⅲ·Ⅴ page right after the scale page.</p>`,
        zh: `<p>你的 5 個把位，就是 <b>CAGED</b> 系統的那 5 個框。CAGED 是用每個框裡面藏的開放和弦來取名：</p>
        <table class="mini"><tr><th>上課</th><td>P1</td><td>P2</td><td>P3</td><td>P4</td><td>P5</td></tr>
        <tr><th>CAGED（大調）</th><td>C</td><td>A</td><td>G</td><td>E</td><td>D</td></tr></table>
        <p>在「指板」打開<b>和弦音</b>：C 大調 P1 裡面就是開放 C 和弦，P4 裡面是第 8 格的封閉和弦。重點是：<i>每個音階把位裡面，都藏著一個你已經會按的和弦</i>。所以老師音階畫完，下一頁馬上畫 1·Ⅲ·Ⅴ。</p>`,
      },
    },
    {
      tag: { en: 'Rock / shred method', zh: '搖滾、速彈的教法' },
      title: { en: 'Your cells vs. "3 notes per string"', zh: '你的「型」vs.「一弦三音」' },
      body: {
        en: `<p>A lot of rock and shred lessons use <b>3 notes on every string (3NPS)</b>. That gives 7 patterns, all the same size, good for playing fast.</p>
        <p>Your teacher's way uses 3-note groups plus one 2-note string (Sol·La), so each box stays about 4 frets wide: one finger per fret, less stretching. Boxes are easier for chords and melodies; 3NPS is easier for speed. The 型 names make the boxes feel like Lego instead of 5 random shapes to memorize.</p>`,
        zh: `<p>很多搖滾、速彈的課用<b>一弦三音（3NPS）</b>：每條弦都彈 3 個音，總共 7 個指型，大小都一樣，適合彈快。</p>
        <p>老師的方法是 3 音一組，加上一條只彈 2 個音的弦（Sol·La），所以每個框大概 4 格寬：一指一格，不用撐太開。框框比較適合和弦跟旋律，一弦三音比較適合飆速度。用「型」來記，就像拼樂高，不用死背 5 個不同的形狀。</p>`,
      },
    },
    {
      tag: { en: 'Theory books', zh: '樂理書' },
      title: { en: 'Whole steps & half steps', zh: '全音和半音' },
      body: {
        en: `<p>Theory books say the major scale is <b>W W H W W W H</b> (W = whole step, H = half step). On guitar, half step = 1 fret, whole step = 2 frets.</p>
        <p>Link it to your cells: the two half steps, <b>Mi–Fa</b> and <b>Si–Do</b>, are always played with <b>fingers next to each other</b> (食→中 index→middle, or 無→小 ring→pinky). If you know where Mi–Fa and Si–Do are, you can rebuild any position yourself.</p>`,
        zh: `<p>樂理書說大調音階是<b>全 全 半 全 全 全 半</b>。在吉他上，半音 = 1 格，全音 = 2 格。</p>
        <p>對到「型」：兩個半音 <b>Mi–Fa</b> 和 <b>Si–Do</b>，永遠是用<b>相鄰的兩根手指</b>按（食→中，或無→小）。只要知道 Mi–Fa 和 Si–Do 在哪，任何把位都可以自己推出來。</p>`,
      },
    },
    {
      tag: { en: '固定調唱名 vs 首調唱名', zh: '固定調 vs 首調' },
      title: { en: 'Fixed-do vs. movable-do', zh: '固定調唱名 vs 首調唱名' },
      body: {
        en: `<p><b>Fixed-do</b> (固定調): Do is always C. Common in classical training (Taiwan, France, Italy…). Great for reading sheet music.</p>
        <p><b>Movable-do</b> (首調): Do is whatever key you're in. Used in jianpu (the number notes your teacher writes), Kodály, and a lot of ear training. Great for hearing what a note <i>does</i> in the song.</p>
        <p>Guitar really likes movable-do: shapes slide up and down the neck, so Sol is fingered the same in every key. Try it: pick "Movable-do" at the top and change the key. Fixed-do names change, movable-do names don't.</p>`,
        zh: `<p><b>固定調</b>：Do 永遠是 C。古典音樂訓練很常用（台灣、法國、義大利…），看五線譜很方便。</p>
        <p><b>首調</b>：Do 就是現在這首歌的調。簡譜（老師寫的數字）、高大宜教學法、很多聽力訓練都用這個。很適合聽出每個音在歌裡的「功能」。</p>
        <p>吉他特別適合首調：形狀可以在指板上滑來滑去，所以不管什麼調，Sol 的按法都一樣。試試看：上面選「首調唱名」再換調，固定調的名字會變，首調的不會。</p>`,
      },
    },
    {
      tag: { en: 'Kodály vs. jazz schools', zh: '高大宜 vs. 爵士派' },
      title: { en: 'La-based vs. Do-based minor', zh: 'La 小調 vs. Do 小調' },
      body: {
        en: `<p>The A/B thing in your notes is a real debate among music teachers:</p>
        <ul><li><b>La-based minor</b> (way B): minor = the relative major starting on La. Nothing new to learn, same shapes. Great for pop songs that go back and forth between relative keys.</li>
        <li><b>Do-based minor</b> (way A, most jazz and theory books): the root is always 1/Do, and the changed notes are ♭3 ♭6 ♭7 (Me, Le, Se). Easier to compare modes, and the numbers match chord names (i, iv, v).</li></ul>
        <p>Your teacher says "Se" for ♭7 because they use Si. Books that use "Ti" call it <b>Te</b>. Same note.</p>`,
        zh: `<p>筆記裡的 A/B 兩種方法，其實是音樂老師之間一直在討論的事：</p>
        <ul><li><b>La 小調</b>（B）：小調 = 關係大調從 La 開始。不用學新東西，形狀都一樣。很適合常在關係大小調之間換來換去的流行歌。</li>
        <li><b>Do 小調</b>（A，大部分爵士和樂理書）：主音永遠是 1/Do，變的音叫 ♭3 ♭6 ♭7（Me、Le、Se）。比較調式很方便，數字也跟和弦級數（i、iv、v）對得起來。</li></ul>
        <p>老師把 ♭7 叫「Se」，是因為用 Si；用「Ti」的書會叫它 <b>Te</b>，是同一個音。</p>`,
      },
    },
    {
      tag: { en: 'How modes get taught', zh: '調式的兩種教法' },
      title: { en: 'Modes: same notes vs. same root', zh: '調式：同一組音 vs. 同主音' },
      body: {
        en: `<p><b>Same notes</b> (way B, "major based on Do"): D Dorian = C major starting on D. Easy to <i>find</i> on the guitar (same shapes). Catch: if you just noodle C major shapes over a D minor chord and never land on D, it still sounds like C major.</p>
        <p><b>Same root</b> (way A): compare every mode to major from the same note. Dorian = major with ♭3 and ♭7. This tells you how each mode <i>sounds</i>. Lots of teachers start with B for fingering, then switch to A for sound. The bright → dark ladder on the Modes tab is way A in one picture.</p>`,
        zh: `<p><b>同一組音</b>（B，以 Do 為準）：D Dorian = C 大調從 D 開始。在吉他上很好<i>找</i>（形狀一樣）。但要注意：如果在 D 小和弦上亂彈 C 大調、從來不停在 D，聽起來還是像 C 大調。</p>
        <p><b>同主音</b>（A）：每個調式都跟同主音的大調比。Dorian = 大調把 3 和 7 降半音。這樣才知道每個調式<i>聽起來</i>怎樣。很多老師先用 B 學指法，再用 A 學聲音。「調式」頁的亮→暗階梯就是 A 的看法。</p>`,
      },
    },
    {
      tag: { en: 'The numbers in your notes', zh: '筆記裡的數字' },
      title: { en: 'Jianpu 簡譜', zh: '簡譜' },
      body: {
        en: `<p>The numbers your teacher writes (1 2 3… with dots and ♭) are <b>jianpu</b>, the number notation used all over Taiwan, China and East Asia. It's always movable-do: 1 = the key's Do.</p>
        <p>A dot <b>above</b> a number = one octave up, a dot <b>below</b> = one octave down. The Nashville Number System that studio musicians use in the US works almost the same way, so jianpu is a nice bridge to those charts.</p>`,
        zh: `<p>老師寫的數字（1 2 3…加上點和 ♭）就是<b>簡譜</b>，台灣、中國和東亞很多地方都在用。簡譜一定是首調：1 = 這個調的 Do。</p>
        <p>數字<b>上面</b>有點 = 高八度，<b>下面</b>有點 = 低八度。美國錄音室樂手用的 Nashville Number System 幾乎一樣，所以會簡譜也很容易看懂那種譜。</p>`,
      },
    },
  ],

  notes: [
    {
      img: 'notes/positions.jpg',
      title: { en: 'Page 1: C major on the whole neck + 5 positions', zh: '第 1 頁：C 大調整個指板 + 5 個把位' },
      points: {
        en: [
          'Top: every C major note on the neck, with the C notes circled. The 1 2 3 4 5 1 along the top shows where each position sits (P1 from the open strings to fret 3 … P5 around frets 10–13, then P1 again at 12).',
          '"C → Cm": learn C major first, then turn it into C minor.',
          'Middle: P1–P5 in C major. Filled dot ● = Do (the root). The pencil boxes group the strings into 2-string cells, labelled La / Si (see the Cells tab).',
          'Bottom (小調): P1–P5 in C minor. Same shapes, shifted, because C minor uses the same notes as E♭ major (C = La).',
        ],
        zh: [
          '最上面：整個指板上所有 C 大調的音，C 有圈起來。上面的 1 2 3 4 5 1 是每個把位的位置（P1 從空弦到第 3 格…P5 大概在 10–13 格，到第 12 格又回到 P1）。',
          '「C → Cm」：先學 C 大調，再把它變成 C 小調。',
          '中間：C 大調 P1–P5。實心點 ● = Do（主音）。鉛筆框把兩條弦框成一組，標著 La / Si（看「型」那頁）。',
          '最下面（小調）：C 小調 P1–P5。形狀一樣只是位置移了，因為 C 小調跟降 E 大調用同一組音（C = La）。',
        ],
      },
    },
    {
      img: 'notes/theory.jpg',
      title: { en: 'Page 2: Cells, major/minor, modes, solfège', zh: '第 2 頁：型、大小調、調式、唱名' },
      points: {
        en: [
          'Top: three 2-string cells: La型 (La Si Do / Re Mi Fa), Si型 (Si Do / Mi Fa Sol) and Mi型 (Mi Fa Sol / La Si Do). Fingers: 食 index, 中 middle, 無 ring, 小 pinky.',
          'Major: 1 2 3 4 5 6 7 1, with ^ marking the half steps (3–4 and 7–1).',
          'Minor way A: 1 2 ♭3 4 5 ♭6 ♭7 1 = Do Re Me Fa Sol Le Se Do. Way B: La Si Do… ("C minor → La").',
          'Example (B): 6 7 1 3 2 1 = 1 2 ♭3 5 4 ♭3. Try it in the translator.',
          'Modes 一–七: Ionian 1234567, Dorian 12♭3456♭7, Phrygian 1♭2♭345♭6♭7, Lydian 123♯4567, Mixolydian 123456♭7, Aeolian 12♭345♭6♭7 (= 6712345), Locrian 1♭2♭34♭5♭6♭7. "Major based on Do" = way B for modes.',
          'The stacked boxes: the chain of string groups (5 6 | 6 7 1 / 2 3 4 | 7 1 2 / 3 4 5 …) that every position is cut from.',
          '固定調唱名 fixed-do vs 首調唱名 movable-do.',
        ],
        zh: [
          '最上面：三個兩弦的型：La型（La Si Do / Re Mi Fa）、Si型（Si Do / Mi Fa Sol）、Mi型（Mi Fa Sol / La Si Do）。手指：食指、中指、無名指、小指。',
          '大調：1 2 3 4 5 6 7 1，^ 是半音的位置（3–4 和 7–1）。',
          '小調 A：1 2 ♭3 4 5 ♭6 ♭7 1 = Do Re Me Fa Sol Le Se Do。B：La Si Do…（「C 小調 → La」）。',
          '例子（B）：6 7 1 3 2 1 = 1 2 ♭3 5 4 ♭3。可以在轉換器試試看。',
          '調式一～七：Ionian 1234567、Dorian 12♭3456♭7、Phrygian 1♭2♭345♭6♭7、Lydian 123♯4567、Mixolydian 123456♭7、Aeolian 12♭345♭6♭7（= 6712345）、Locrian 1♭2♭34♭5♭6♭7。「Major based on Do」就是調式的 B 看法。',
          '那串疊起來的框：每條弦的音組（5 6 | 6 7 1 / 2 3 4 | 7 1 2 / 3 4 5 …），每個把位都是從這串切出來的。',
          '固定調唱名 vs 首調唱名。',
        ],
      },
    },
    {
      img: 'notes/triads.jpg',
      title: { en: 'Page 3: Chord tones in each position', zh: '第 3 頁：每個把位裡的和弦音' },
      points: {
        en: [
          'In each of P1–P5: the root (filled), Ⅲ (3rd) and Ⅴ (5th), connected with lines. This is the major chord hiding inside each scale box.',
          'P4 also has ♭3 written in: change that one note and the chord becomes minor.',
          'Turn on "Chord tones" on the Fretboard tab to see these in any key.',
        ],
        zh: [
          'P1–P5 每個把位裡：主音（實心）、Ⅲ（3 度）、Ⅴ（5 度），用線連起來。這就是藏在每個音階框裡的大三和弦。',
          'P4 還寫了 ♭3：只要改這一個音，和弦就變成小三和弦。',
          '在「指板」打開「和弦音」，任何調都看得到。',
        ],
      },
    },
    {
      img: 'notes/cells.jpg',
      title: { en: 'Page 4: Cell fingerings + the mode arrows', zh: '第 4 頁：型的指法 + 調式箭頭' },
      points: {
        en: [
          'Si型 uses 食 中 … 小 (index, middle, pinky); La型 uses 食 … 無 小 (index, ring, pinky); the 2-note string uses 食 無 (index, ring).',
          'The group chain again: 3 4 5 / 7 1 2, 5 6, 2 3 4 / 6 7 1…',
          'Bottom: arrows like 7→♭7, 3→♭3, 6→♭6, 4→♯4, 2→♭2: changing one note at a time to go from one mode to the next. That\'s the bright → dark ladder on the Modes tab.',
        ],
        zh: [
          'Si型用 食 中 … 小；La型用 食 … 無 小；只有 2 個音的那條弦用 食 無。',
          '音組的鏈又出現一次：3 4 5 / 7 1 2、5 6、2 3 4 / 6 7 1…',
          '最下面：7→♭7、3→♭3、6→♭6、4→♯4、2→♭2 這些箭頭，就是一次改一個音，從一個調式變到下一個。也就是「調式」頁的亮→暗階梯。',
        ],
      },
    },
  ],
};
