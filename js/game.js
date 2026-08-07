/* game.js — the little world: room, props, particles, care actions, growth,
   and a shelf of pets you can switch between. */
(function () {
  'use strict';

  var C = PX.C;
  var SAVE_KEY = 'pixelpals.save.v2';
  var OLD_KEY = 'pixelpals.save.v1';
  var MAX_OFFLINE = 3 * 3600;   // cap on decay while you are away (seconds)
  var MAX_PETS = 6;
  var MAX_MESS = 4;            // how much mess can pile up before the pet stops

  var STAT_KEYS = ['food', 'water', 'fun', 'clean', 'groom'];
  var DECAY = {
    food: 100 / 420, water: 100 / 360, fun: 100 / 330,
    clean: 100 / 700, groom: 100 / 900
  };
  var IDLE_RATE = 0.35;         // pets you are not looking after right now

  // one dirt spot is worth this much Clean; one tuft this much Brush
  var DIRT_PER = 12, TUFT_PER = 14;
  var BATH_MIN_DIRT = 7;      // a proper bath is always a decent scrub

  /* Bath time is scrub, then rinse, then dry — each step turns what you
     cleared in the last one into the next thing to deal with. */
  var BATH_STEPS = [
    { key: 'scrub', target: 'dirt', tool: 'soap', grab: 'Step 1 of 3 · Grab the soap!', text: 'Step 1 of 3 · Scrub off the mud!' },
    { key: 'rinse', target: 'foam', tool: 'shower', grab: 'Step 2 of 3 · Grab the shower!', text: 'Step 2 of 3 · Rinse the soap off!' },
    { key: 'dry', target: 'drip', tool: 'towel', grab: 'Step 3 of 3 · Grab the towel!', text: 'Step 3 of 3 · Rub your pet dry!' }
  ];
  var STEP_SECONDS = 3;       // how long a step takes with the tool on the pet

  var STARVING = 15;          // a stat this low starts making the pet unwell
  var SICK_AFTER = 80;        // seconds of going without before it gets sick
  var SICK_DECAY = 1.4;       // everything drains faster while poorly

  var ACTIONS = {
    feed: { stat: 'food', kind: 'anim', dur: 4.6, gain: 38, done: 'Yum yum!', full: "I'm so full!" },
    water: { stat: 'water', kind: 'anim', dur: 4.0, gain: 42, done: 'Glug glug!', full: 'Not thirsty!' },
    play: { stat: 'fun', kind: 'games', full: 'Played out!' },
    bath: { stat: 'clean', kind: 'tool', done: 'Squeaky clean!', full: "I'm already clean!" },
    brush: { stat: 'groom', kind: 'tool', done: 'So fluffy!', full: 'My fur is perfect!' },
    medicine: { stat: null, kind: 'anim', dur: 4.4, gain: 0, done: 'All better!', full: '' }
  };

  /* Six things to eat. Proper food fills you up; treats fill you up less but
     are a lot more fun. */
  var FOODS = {
    // meals fill the Food ring right up; treats barely dent it but are fun
    meal:  { label: 'Meal',     gain: 75, fun: 0,  say: 'Yum yum!' },
    fish:  { label: 'Fish',     gain: 75, fun: 5,  say: 'Tasty!' },
    steak: { label: 'Steak',    gain: 75, fun: 4,  say: 'Delicious!' },
    donut: { label: 'Donut',    gain: 25, fun: 15, say: 'So sweet!' },
    bone:  { label: 'Bone',     gain: 25, fun: 18, say: 'Crunch crunch!' },
    lolly: { label: 'Lollipop', gain: 25, fun: 20, say: 'Slurp!' },
    ice:   { label: 'Ice Cream', gain: 25, fun: 22, say: 'Brrr! Yummy!' }
  };

  /* Three things to drink. Milk and juice are a treat, but milk twice in a
     row gives your pet a tummy ache. */
  var DRINKS = {
    water: { label: 'Water',  icon: 'drinkWater', gain: 45, fun: 0,  fill: '#7fd8ff', say: 'Glug glug!' },
    milk:  { label: 'Milk',   icon: 'drinkMilk',  gain: 40, fun: 8,  fill: '#fbf7ea', say: 'Mmm, creamy!' },
    juice: { label: 'Juice',  icon: 'drinkJuice', gain: 38, fun: 14, fill: '#ffa53d', say: 'Yummy juice!' }
  };
  var MILK_LIMIT = 2;         // milks in a row before a poorly tummy

  // what each animal says when it is thoroughly pleased with you
  var HAPPY_SAY ={ dog: 'Woof woof!', fox: 'Yip yip!', cat: 'Purrrrr!', blackcat: 'Purrrrr!' };

  /* Prizes live in the toy box in the corner, and belong to the pet that won
     them — every pet fills its own toy box from scratch. */
  var PRIZES = [
    { id: 'party', kind: 'hat', label: 'Party Hat', icon: 'hatParty' },
    { id: 'crown', kind: 'hat', label: 'Crown', icon: 'hatCrown' },
    { id: 'witch', kind: 'hat', label: 'Witch Hat', icon: 'hatWitch' },
    { id: 'bow', kind: 'hat', label: 'Bow', icon: 'hatBow' },
    { id: 'wand', kind: 'toy', label: 'Cat Wand', icon: 'toyWand', game: 'wand' },
    { id: 'frisbee', kind: 'toy', label: 'Frisbee', icon: 'toyFrisbee', game: 'frisbee' },
    { id: 'skull', kind: 'picture', label: 'Skull Picture', icon: 'picSkull' },
    { id: 'pumpkin', kind: 'wallpaper', label: 'Pumpkin Wallpaper', icon: 'wallPumpkin' },
    { id: 'cactus', kind: 'plant', label: 'Cactus', icon: 'plantCactus' },
    { id: 'skullbanner', kind: 'banner', label: 'Skull Banner', icon: 'bannerSkull' }
  ];

  /* Wallpaper the room can be redecorated with. `rose` is what a room starts
     out with; the rest come out of the toy box. */
  var WALLPAPERS = {
    rose: { wall: '#ffe6f2', low: '#ffd0e6', trim: '#f2a8cc' },
    pumpkin: { wall: '#6b4b8f', low: '#523571', trim: '#ff9f3d', motif: 'lantern' }
  };

  // a little jack-o'-lantern, repeated across the Halloween wallpaper
  function drawLantern(L, x, y) {
    var ink = C('#241a33');
    L.rect(x - 0.5, y - 4.6, 1.5, 2, C('#4e8f3a'));
    L.ellipse(x, y, 3.6, 3, C('#ff8a2b'));
    L.ellipse(x, y, 1.8, 3, C('#ffb055'));
    L.tri(x - 2.2, y - 0.4, x - 0.8, y - 0.4, x - 1.5, y - 1.8, ink);
    L.tri(x + 0.8, y - 0.4, x + 2.2, y - 0.4, x + 1.5, y - 1.8, ink);
    L.rect(x - 1.6, y + 1.2, 3.5, 1, ink);
  }

  /* The cactus that can take the houseplant's place in the pot. Same pot and
     the same growth, but it puts out arms instead of leaves and flowers
     instead of straggly shoots when it wants a trim. */
  function drawCactus(b, bx, by, top, stem, lv, wild, sway) {
    var skin = C('#63c93f'), lit = C('#8ee86a'), dark = C('#3f8f2c'), spine = C('#e8f5c8');
    var w = 2.6 + lv * 1.1;                       // half-width of the trunk
    var base = by - 3;                            // where it goes into the pot
    var h = base - top;
    b.rect(bx - w, top + 1, w * 2, h, skin);
    b.ellipse(bx, top + 1, w, w * 0.85, skin);    // domed top
    b.rect(bx - w + 0.6, top + 1, 1.2, h - 1, lit);
    b.rect(bx + w - 1.6, top + 3, 1, h - 3, dark);

    // arms, which sprout as it grows and there is room for them
    var armL = lv > 0.3 && h > 8, armR = lv > 0.55 && h > 10;
    if (armL) {
      var ay = top + 6;
      b.rect(bx - w - 2.6, ay, 3, 2, skin);
      b.rect(bx - w - 2.6, ay - 3.4, 2, 4, skin);
      b.ellipse(bx - w - 1.6, ay - 3.4, 1, 0.9, lit);
    }
    if (armR) {
      var ry = top + 8;
      b.rect(bx + w - 0.4, ry, 3, 2, skin);
      b.rect(bx + w + 1.6, ry - 3.6, 2, 4.2, skin);
      b.ellipse(bx + w + 2.6, ry - 3.6, 1, 0.9, lit);
    }

    // spines
    for (var s = 0; s < 5; s++) {
      var sy = top + 4 + s * 3;
      if (sy > base - 2) break;
      b.set(bx - w + 0.4, sy, spine);
      b.set(bx + w - 1.4, sy + 1.5, spine);
    }

    if (wild) {
      // it flowers when it is due a tidy up
      var fx1 = bx + sway * 0.4;
      b.disc(fx1, top - 1.4, 2.1, C('#ff5f8f'));
      b.disc(fx1, top - 1.4, 1, C('#ffd93d'));
      if (armL) {
        b.disc(bx - w - 1.6, top + 1.6, 1.7, C('#ff8fb0'));
        b.disc(bx - w - 1.6, top + 1.6, 0.8, C('#ffe07a'));
      }
      if (armR) {
        b.disc(bx + w + 2.6, top + 4, 1.7, C('#ff8fb0'));
        b.disc(bx + w + 2.6, top + 4, 0.8, C('#ffe07a'));
      }
    }
    // the pot rim goes back on top, so the cactus is planted in it
    b.rect(bx - 5, by - 5, 11, 3, C('#f2a682'));
  }

  /* A hanging skull for the Halloween banner. */
  function drawBannerSkull(L, x, y) {
    L.ellipse(x, y + 2, 2.6, 2.4, C('#f4efe6'));
    L.rect(x - 1.6, y + 4, 3.5, 1.6, C('#f4efe6'));
    L.set(x - 1, y + 2, C('#3a2b40'));
    L.set(x + 1, y + 2, C('#3a2b40'));
    L.set(x, y + 3.4, C('#3a2b40'));
    L.set(x - 1, y + 5, C('#3a2b40'));
    L.set(x + 1, y + 5, C('#3a2b40'));
  }

  // prizes that have been renamed since an earlier version
  var PRIZE_ALIAS = { cap: 'witch', mouse: 'wand', rainbow: 'skull', mint: 'pumpkin' };

  var PRIZE_LEVEL = 85;       // a meter counts as topped up at this much

  function prizeById(id) {
    id = PRIZE_ALIAS[id] || id;
    for (var i = 0; i < PRIZES.length; i++) if (PRIZES[i].id === id) return PRIZES[i];
    return null;
  }

  function hasPrize(id) { return !!pet && pet.prizes.indexOf(id) >= 0; }

  var HINTS = {
    food: 'Your pet is hungry — tap Feed!',
    water: 'Your pet is thirsty — tap Water!',
    fun: 'Your pet is bored — tap Play!',
    clean: 'Your pet is dirty — tap Bath!',
    groom: 'Your pet is scruffy — tap Brush!'
  };

  /* ------------------------------------------------------------------ */
  /* sound                                                               */
  /* ------------------------------------------------------------------ */
  var Sfx = {
    ctx: null, on: true, lastPurr: 0, lastScrub: 0,
    init: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone: function (freq, dur, type, vol, delay, slideTo) {
      if (!this.on || !this.ctx) return;
      var t0 = this.ctx.currentTime + (delay || 0);
      var osc = this.ctx.createOscillator();
      var gain = this.ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },
    click: function () { this.tone(520, 0.07, 'square', 0.05); },
    chomp: function () { this.tone(180, 0.09, 'square', 0.06, 0, 110); },
    sip: function () { this.tone(680, 0.1, 'sine', 0.05, 0, 900); },
    boing: function () { this.tone(320, 0.16, 'triangle', 0.06, 0, 640); },
    splash: function () {
      for (var i = 0; i < 4; i++) this.tone(700 + i * 180, 0.09, 'sine', 0.035, i * 0.05);
    },
    squeak: function () {
      var now = Date.now();
      if (now - this.lastScrub < 150) return;
      this.lastScrub = now;
      this.tone(900 + Math.random() * 300, 0.07, 'sine', 0.03, 0, 1500);
    },
    swish: function () {
      var now = Date.now();
      if (now - this.lastScrub < 150) return;
      this.lastScrub = now;
      this.tone(320 + Math.random() * 120, 0.08, 'triangle', 0.03, 0, 210);
    },
    purr: function () {
      var now = Date.now();
      if (now - this.lastPurr < 260) return;
      this.lastPurr = now;
      this.tone(150, 0.18, 'triangle', 0.05, 0, 130);
    },
    ding: function () {
      this.tone(880, 0.12, 'sine', 0.05);
      this.tone(1320, 0.18, 'sine', 0.04, 0.08);
    },
    grow: function () {
      var notes = [523, 659, 784, 1046];
      for (var i = 0; i < notes.length; i++) this.tone(notes[i], 0.22, 'square', 0.055, i * 0.12);
    },
    sad: function () { this.tone(330, 0.25, 'sine', 0.045, 0, 200); },
    growl: function () {
      this.tone(120, 0.35, 'sawtooth', 0.05, 0, 80);
      this.tone(90, 0.3, 'square', 0.03, 0.08, 70);
    },
    yawn: function () { this.tone(280, 0.5, 'sine', 0.04, 0, 480); },
    snore: function () { this.tone(90, 0.5, 'triangle', 0.025, 0, 70); },
    plop: function () { this.tone(200, 0.12, 'triangle', 0.05, 0, 90); },
    pop: function () { this.tone(1100, 0.06, 'sine', 0.05, 0, 1700); },
    whoosh: function () { this.tone(500, 0.14, 'sine', 0.03, 0, 260); },
    stepDone: function () {
      var notes = [784, 988, 1319];
      for (var i = 0; i < notes.length; i++) this.tone(notes[i], 0.16, 'sine', 0.055, i * 0.1);
    },
    pickup: function () { this.tone(760, 0.08, 'triangle', 0.045, 0, 1020); },
    snip: function () {
      this.tone(1400, 0.05, 'square', 0.035);
      this.tone(1200, 0.05, 'square', 0.035, 0.09);
    },
    /* A little voice box: two detuned oscillators swept along a pitch path,
       through a lowpass, with optional wobble. Animal calls glide and waver
       rather than stepping between notes, which is what makes them read as a
       creature instead of a chime. */
    voice: function (o) {
      if (!this.on || !this.ctx) return;
      var ctx = this.ctx;
      var t0 = ctx.currentTime + (o.delay || 0);
      var dur = o.dur;
      var osc = ctx.createOscillator();
      var osc2 = ctx.createOscillator();
      var filt = ctx.createBiquadFilter();
      var gain = ctx.createGain();

      osc.type = o.type || 'sawtooth';
      osc2.type = o.type || 'sawtooth';
      osc2.detune.value = o.detune === undefined ? 9 : o.detune;

      filt.type = 'lowpass';
      filt.Q.value = o.q || 4;
      filt.frequency.setValueAtTime(o.cutoff || 1800, t0);
      if (o.cutoffEnd) filt.frequency.linearRampToValueAtTime(o.cutoffEnd, t0 + dur);

      var pts = o.freq;
      osc.frequency.setValueAtTime(pts[0][1], t0);
      osc2.frequency.setValueAtTime(pts[0][1], t0);
      for (var i = 1; i < pts.length; i++) {
        osc.frequency.exponentialRampToValueAtTime(pts[i][1], t0 + pts[i][0] * dur);
        osc2.frequency.exponentialRampToValueAtTime(pts[i][1], t0 + pts[i][0] * dur);
      }

      if (o.vibHz) {                       // the waver in a trill or a purr
        var lfo = ctx.createOscillator();
        var lfoGain = ctx.createGain();
        lfo.frequency.value = o.vibHz;
        lfoGain.gain.value = o.vibDepth || 20;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfoGain.connect(osc2.frequency);
        lfo.start(t0);
        lfo.stop(t0 + dur + 0.05);
      }

      var vol = o.vol || 0.05;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(vol, t0 + (o.attack || 0.02));
      gain.gain.setValueAtTime(vol, t0 + dur * (o.hold || 0.45));
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(filt);
      osc2.connect(filt);
      filt.connect(gain).connect(ctx.destination);
      osc.start(t0); osc.stop(t0 + dur + 0.06);
      osc2.start(t0); osc2.stop(t0 + dur + 0.06);
    },

    happyMeow: function () {               // "mrrrow!" then a little chirrup
      this.voice({
        dur: 0.44, type: 'sawtooth', vol: 0.055, cutoff: 1500, cutoffEnd: 850, q: 6,
        vibHz: 25, vibDepth: 28, attack: 0.035, hold: 0.5,
        freq: [[0, 430], [0.25, 790], [0.6, 850], [1, 500]]
      });
      this.voice({
        dur: 0.3, delay: 0.46, type: 'sawtooth', vol: 0.042, cutoff: 1300, q: 6,
        vibHz: 30, vibDepth: 22, attack: 0.02, hold: 0.4,
        freq: [[0, 600], [0.4, 920], [1, 660]]
      });
    },

    happyBark: function () {               // "woof woof!" and a happy whine
      for (var i = 0; i < 2; i++) {
        this.voice({
          dur: 0.13, delay: i * 0.2, type: 'sawtooth', vol: 0.06,
          cutoff: 1500, cutoffEnd: 600, q: 3, attack: 0.008, hold: 0.25,
          freq: [[0, 430], [0.18, 330], [1, 165]]
        });
      }
      this.voice({
        dur: 0.28, delay: 0.44, type: 'triangle', vol: 0.038, cutoff: 2200, q: 2,
        vibHz: 17, vibDepth: 20, attack: 0.02, hold: 0.4,
        freq: [[0, 520], [0.5, 780], [1, 620]]
      });
    },

    happyYip: function () {                // a fox's excited "yip yip!"
      for (var i = 0; i < 2; i++) {
        this.voice({
          dur: 0.12, delay: i * 0.17, type: 'sawtooth', vol: 0.05,
          cutoff: 2600, cutoffEnd: 1600, q: 5, attack: 0.01, hold: 0.3,
          freq: [[0, 700], [0.25, 1280], [1, 880]]
        });
      }
      this.voice({
        dur: 0.24, delay: 0.38, type: 'sawtooth', vol: 0.04, cutoff: 2400, q: 5,
        vibHz: 23, vibDepth: 32, attack: 0.015, hold: 0.4,
        freq: [[0, 940], [0.5, 1420], [1, 1020]]
      });
    },

    delight: function (species) {          // the happy noise after lots of fuss
      if (species === 'dog') this.happyBark();
      else if (species === 'fox') this.happyYip();
      else this.happyMeow();
    },
    unwrap: function () {
      this.tone(300, 0.1, 'triangle', 0.04, 0, 520);
      this.tone(520, 0.12, 'triangle', 0.04, 0.1, 780);
    }
  };

  /* ------------------------------------------------------------------ */
  /* save data — a shelf of pets                                         */
  /* ------------------------------------------------------------------ */
  var db = { v: 2, activeId: '', pets: [], plant: 20 };
  var GROWTH_V = 2;           // bumped whenever the growth scale changes
  var PLANT_FULL = 900;       // seconds from a fresh trim to fully overgrown
  var PLANT_WILD = 70;        // needs a trim above this
  var pet = null;               // the pet currently on screen

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function uid() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

  function newPet(species, name) {
    return {
      id: uid(), species: species, name: name,
      growth: 0, stage: 'baby',
      stats: { food: 75, water: 75, fun: 75, clean: 95, groom: 92 },
      love: 40, born: Date.now(), saved: Date.now(), cuddles: 0,
      messes: [], sick: false, sickT: 0, milkRun: 0,
      hat: null, picture: null, wallpaper: null, plantStyle: null, banner: null,
      // a new pet arrives spotless, so it starts with the two-full-meters
      // prize already claimed — one has to be earned by looking after it
      prizeArmed: true, gv: GROWTH_V,
      prizes: [], prizeNew: 0, best: {}
    };
  }

  function normalise(p) {
    p.stats = p.stats || {};
    for (var i = 0; i < STAT_KEYS.length; i++) {
      var k = STAT_KEYS[i];
      if (typeof p.stats[k] !== 'number' || isNaN(p.stats[k])) p.stats[k] = 65;
      p.stats[k] = clamp(p.stats[k], 0, 100);
    }
    if (typeof p.growth !== 'number') p.growth = 0;
    // growing up was stretched out; carry an older save's progress across so
    // nobody's adult wakes up a baby
    if (p.gv !== GROWTH_V) {
      p.growth *= Pets.GROWTH_SCALE;
      p.gv = GROWTH_V;
    }
    if (typeof p.love !== 'number') p.love = 40;
    if (!p.id) p.id = uid();
    if (!Pets.SPECIES[p.species]) p.species = 'cat';
    p.sick = !!p.sick;
    if (!Array.isArray(p.prizes)) p.prizes = [];
    p.prizes = p.prizes.map(function (id) { return PRIZE_ALIAS[id] || id; })
      .filter(function (id, i, all) { return prizeById(id) && all.indexOf(id) === i; });
    if (typeof p.prizeNew !== 'number') p.prizeNew = 0;
    if (!p.best || typeof p.best !== 'object') p.best = {};
    if (p.best.mouse !== undefined && p.best.wand === undefined) p.best.wand = p.best.mouse;
    delete p.best.mouse;
    if (p.hat) p.hat = PRIZE_ALIAS[p.hat] || p.hat;
    if (p.hat && p.prizes.indexOf(p.hat) < 0) p.hat = null;
    // decorations only stay up while the pet still owns the prize
    ['picture', 'wallpaper', 'plantStyle', 'banner'].forEach(function (slot) {
      if (p[slot] && p.prizes.indexOf(PRIZE_ALIAS[p[slot]] || p[slot]) < 0) p[slot] = null;
      else if (p[slot]) p[slot] = PRIZE_ALIAS[p[slot]] || p[slot];
    });
    if (p.wallpaper && !WALLPAPERS[p.wallpaper]) p.wallpaper = null;
    if (typeof p.sickT !== 'number') p.sickT = 0;
    if (typeof p.milkRun !== 'number') p.milkRun = 0;
    if (!Array.isArray(p.messes)) p.messes = [];
    p.messes = p.messes.slice(0, MAX_MESS);
    p.stage = Pets.stageFor(p.growth).key;
    return p;
  }

  function save() {
    db.pets.forEach(function (p) { p.saved = Date.now(); });
    db.plantSaved = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(db)); } catch (e) { /* private mode */ }
  }

  /* Prizes and best scores used to be shared by every pet. They now belong to
     the pet that won them, so an older save hands its collection to the pet
     that was being played and the rest start their own. */
  function adoptSharedPrizes(d) {
    if (!Array.isArray(d.prizes) && !d.best) return;
    var act = null, i;
    for (i = 0; i < d.pets.length; i++) if (d.pets[i] && d.pets[i].id === d.activeId) act = d.pets[i];
    if (!act) act = d.pets[0];
    if (!act) return;
    if (Array.isArray(d.prizes) && !Array.isArray(act.prizes)) act.prizes = d.prizes.slice();
    if (d.best && typeof d.best === 'object' && !act.best) act.best = d.best;
    if (typeof act.prizeNew !== 'number') act.prizeNew = d.prizeNew || 0;
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    if (raw) {
      try {
        var d = JSON.parse(raw);
        if (d && d.pets && d.pets.length) {
          adoptSharedPrizes(d);
          db = {
            v: 2, activeId: d.activeId, pets: d.pets.map(normalise),
            plant: typeof d.plant === 'number' ? d.plant : 20,
            plantSaved: d.plantSaved || Date.now()
          };
          // the plant keeps growing while you are away
          var grew = Math.min(MAX_OFFLINE, (Date.now() - db.plantSaved) / 1000);
          db.plant = clamp(db.plant + grew / PLANT_FULL * 100, 0, 100);
          if (!byId(db.activeId)) db.activeId = db.pets[0].id;
          return true;
        }
      } catch (e) { /* fall through */ }
    }
    // migrate a single pet saved by the first version
    try {
      var old = localStorage.getItem(OLD_KEY);
      if (old) {
        var o = JSON.parse(old);
        if (o && o.species) {
          var p = normalise({
            id: uid(), species: o.species, name: o.name || 'Pixel',
            growth: o.growth || 0, stats: o.stats || {}, love: o.love || 40,
            born: o.born || Date.now(), saved: o.saved || Date.now()
          });
          if (typeof p.stats.groom !== 'number') p.stats.groom = 70;
          db = { v: 2, activeId: p.id, pets: [p], plant: 20, plantSaved: Date.now() };
          save();
          return true;
        }
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function byId(id) {
    for (var i = 0; i < db.pets.length; i++) if (db.pets[i].id === id) return db.pets[i];
    return null;
  }

  /* Decay that happened while the tab was closed, at a gentle rate. */
  function applyAway(p) {
    var away = Math.max(0, (Date.now() - (p.saved || Date.now())) / 1000);
    var used = Math.min(away, MAX_OFFLINE);
    if (used < 20) return 0;
    for (var i = 0; i < STAT_KEYS.length; i++) {
      var k = STAT_KEYS[i];
      p.stats[k] = clamp(p.stats[k] - DECAY[k] * used * 0.5, 8, 100);
    }
    p.love = clamp((p.love || 0) - used * 0.02, 0, 100);
    // a pet left alone for a while will have had an accident or two
    var owed = Math.min(2, Math.floor(used / 900));
    for (var m = 0; m < owed; m++) addMess(p);
    if (!p.sick && used > 1800 && (p.stats.food < 20 || p.stats.water < 20)) p.sick = true;
    p.saved = Date.now();
    return away;
  }

  function avgStats(p) {
    var t = 0;
    for (var i = 0; i < STAT_KEYS.length; i++) t += p.stats[STAT_KEYS[i]];
    return t / STAT_KEYS.length;
  }

  function happiness(p) {
    var h = avgStats(p) * 0.75 + (p.love || 0) * 0.25;
    if (p.sick) h *= 0.55;
    return clamp(h, 0, 100);
  }

  function heartCount(p) { return Math.round(happiness(p) / 20); }

  /* ------------------------------------------------------------------ */
  /* runtime state                                                       */
  /* ------------------------------------------------------------------ */
  var rt = {
    t: 0, blinkAt: 2, blinking: 0,
    lean: 0, leanTarget: 0, bobPhase: 0,
    activity: null,             // feed / water / play
    tool: null,                 // bath / brush
    dose: null,                 // the medicine timing game
    props: {}, particles: [],
    spots: [], foam: [], drips: [],
    petting: false, lastHeart: 0,
    shine: 0, growthFlash: 0,
    sleep: null, angry: 0, lastWake: -60,
    pooping: null, messTimer: 40 + Math.random() * 50, messAge: {},
    intro: null, petStreak: 0, lastDelight: -60
  };

  /* ------------------------------------------------------------------ */
  /* screen sizing — the room fills the whole viewport                   */
  /* ------------------------------------------------------------------ */
  var W = 88, H = 64, scale = 6, screen = null;
  var petLayer = new PX.Layer(Pets.SIZE, Pets.SIZE);
  var fx = new PX.Layer(44, 44);
  var fxBig = new PX.Layer(80, 80);       // for stamps too tall for the small one
  var room = { floorY: 36, groundY: 48 };

  function sizeScene() {
    var vw = Math.max(240, window.innerWidth);
    var vh = Math.max(360, window.innerHeight);
    var s = Math.max(Math.round(vh / 128), Math.round(vw / 190), 3);
    s = Math.min(s, 14);
    var w = Math.ceil(vw / s), h = Math.ceil(vh / s);
    if (!screen || w !== W || h !== H) {
      W = w; H = h;
      screen = new PX.Screen(el.scene, W, H);
    }
    scale = s;
    el.scene.style.width = (W * s) + 'px';
    el.scene.style.height = (H * s) + 'px';
    room.floorY = Math.round(H * 0.52);
    room.groundY = Math.round(H * 0.70);
  }

  /* ------------------------------------------------------------------ */
  /* outlined stamps                                                     */
  /* ------------------------------------------------------------------ */
  /* outline() only fills empty pixels, and the room covers the whole scene,
     so anything needing its own black edge is drawn on a scratch layer. The
     scratch layer is what limits how far a stamp may reach from its anchor —
     pass `big` for anything taller than 22 pixels, or it gets clipped. */
  function stampOutlined(L, x, y, draw, big) {
    var b = big ? fxBig : fx, half = big ? 40 : 22;
    b.clear();
    draw(b, half, half);
    b.outline(C('#141014'));
    L.blit(b, Math.round(x) - half, Math.round(y) - half);
  }

  /* ------------------------------------------------------------------ */
  /* particles                                                           */
  /* ------------------------------------------------------------------ */
  function spawn(kind, x, y, opts) {
    opts = opts || {};
    rt.particles.push({
      kind: kind, x: x, y: y,
      vx: opts.vx !== undefined ? opts.vx : (Math.random() - 0.5) * 8,
      vy: opts.vy !== undefined ? opts.vy : -(8 + Math.random() * 8),
      g: opts.g || 0, life: 0, max: opts.max || 1.1,
      wob: Math.random() * 6, color: opts.color || null
    });
  }

  var CONFETTI_COLORS = ['#ff5f8f', '#ffd93d', '#5fc8ff', '#7ed957', '#b78bff', '#ff9f3d'];

  function confettiBurst(x, y, n) {
    for (var i = 0; i < n; i++) {
      spawn('confetti', x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 8, {
        vx: (Math.random() - 0.5) * 46, vy: -(18 + Math.random() * 34), g: 58,
        max: 1.5 + Math.random() * 0.8,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
      });
    }
  }

  var PARTICLE_ART = {
    heart: { rows: Pets.HEART, color: '#ff5f8f' },
    sparkle: { rows: ['.#.', '###', '.#.'], color: '#fff3a8' },
    bubble: { rows: ['.##.', '####', '####', '.##.'], color: '#d6f2ff' },
    crumb: { rows: ['##', '##'], color: '#c98a4b' },
    drop: { rows: ['.#.', '###', '.#.'], color: '#7fd8ff' },
    note: { rows: ['..#', '..#', '###', '.##'], color: '#5f4bb6' },
    fluff: { rows: ['.#.', '###', '.#.'], color: '#ffffff' },
    zzz: { rows: ['###', '..#', '.#.', '###'], color: '#8f9bd6' },
    anger: { rows: ['.#.#.', '.###.', '#####', '.###.', '.#.#.'], color: '#ff3b3b' },
    poof: { rows: ['.##.', '####', '####', '.##.'], color: '#e6ded4' },
    star: { rows: ['..#..', '.###.', '#####', '.###.', '..#..'], color: '#ffd93d' },
    sick: { rows: ['.##.', '#..#', '#..#', '.##.'], color: '#8fd66a' },
    leaf: { rows: ['.##', '###', '##.'], color: '#7ed957' },
    confetti: { rows: ['##', '##'], color: '#ff5f8f' }
  };

  // confetti tumbles as it falls: edge-on one moment, flat the next
  var CONFETTI_FLAT = ['##', '##'], CONFETTI_EDGE = ['#', '#'];

  function updateParticles(dt) {
    for (var i = rt.particles.length - 1; i >= 0; i--) {
      var p = rt.particles[i];
      p.life += dt;
      if (p.life >= p.max) { rt.particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt + Math.sin((p.life + p.wob) * 6) * 0.12;
      p.y += p.vy * dt;
    }
  }

  function drawParticles(L) {
    for (var i = 0; i < rt.particles.length; i++) {
      var p = rt.particles[i];
      var art = PARTICLE_ART[p.kind];
      if (!art) continue;
      if (p.life > p.max * 0.75 && Math.floor(p.life * 14) % 2 === 0) continue;
      var col = p.color || art.color;
      if (p.kind === 'fluff' && pet) col = Pets.SPECIES[pet.species].furLight;
      var rows = art.rows;
      if (p.kind === 'confetti') {
        rows = Math.sin((p.life + p.wob) * 9) > 0 ? CONFETTI_FLAT : CONFETTI_EDGE;
      }
      L.stamp(rows, { '#': C(col) }, Math.round(p.x), Math.round(p.y));
    }
  }

  /* ------------------------------------------------------------------ */
  /* time of day — the room follows the real clock                       */
  /* ------------------------------------------------------------------ */
  /* Keyframes around the 24 hour dial. Sunrise runs 7-9am and sunset
     7-9pm, as asked; everything between is interpolated so the room shifts
     gradually rather than snapping. */
  /* How dark the room is through the day. Sunrise 7-9am lifts it, sunset
     7-9pm brings it back down. This only dims the room — the sky colour in
     the window still changes, and the pet keeps its own colours. */
  var SKY_KEYS = [
    { h: 0, dark: 1, sky: '#161d44', stars: 1 },
    { h: 6, dark: 1, sky: '#161d44', stars: 1 },
    { h: 7, dark: 0.85, sky: '#5c4478', stars: 0.45 },
    { h: 8, dark: 0.42, sky: '#ff9e6b', stars: 0 },
    { h: 9, dark: 0, sky: '#a8e0ff', stars: 0 },
    { h: 18.5, dark: 0, sky: '#b6e4ff', stars: 0 },
    { h: 19, dark: 0.14, sky: '#ffb07a', stars: 0 },
    { h: 20, dark: 0.5, sky: '#ff7a5c', stars: 0.15 },
    { h: 21, dark: 1, sky: '#161d44', stars: 1 },
    { h: 24, dark: 1, sky: '#161d44', stars: 1 }
  ];

  var DIM = [20, 26, 58];       // the colour the room fades toward
  var DIM_MAX = 0.38;           // how dark it ever gets

  function hexRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* Quantised, so gradual blending does not mint hundreds of palette entries. */
  function mixHex(a, b, k) {
    var ca = hexRgb(a), cb = hexRgb(b), out = '#';
    for (var i = 0; i < 3; i++) {
      var v = clamp(Math.round((ca[i] + (cb[i] - ca[i]) * k) / 4) * 4, 0, 255);
      out += (v < 16 ? '0' : '') + v.toString(16);
    }
    return out;
  }

  var sky = { tint: [DIM[0], DIM[1], DIM[2], 0], sky: '#a8e0ff', stars: 0, hour: 12, night: 0 };

  function updateSky() {
    var d = new Date();
    var h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
    var a = SKY_KEYS[0], b = SKY_KEYS[SKY_KEYS.length - 1];
    for (var i = 0; i < SKY_KEYS.length - 1; i++) {
      if (h >= SKY_KEYS[i].h && h <= SKY_KEYS[i + 1].h) { a = SKY_KEYS[i]; b = SKY_KEYS[i + 1]; break; }
    }
    var k = b.h === a.h ? 0 : (h - a.h) / (b.h - a.h);
    sky.tint[3] = (a.dark + (b.dark - a.dark) * k) * DIM_MAX;
    sky.sky = mixHex(a.sky, b.sky, k);
    sky.stars = a.stars + (b.stars - a.stars) * k;
    sky.hour = h;
    sky.night = a.dark + (b.dark - a.dark) * k;
  }

  function greeting() {
    var h = sky.hour;
    if (h < 5) return 'Sweet dreams!';
    if (h < 9) return 'Good morning!';
    if (h < 12) return 'Morning!';
    if (h < 18) return 'Good afternoon!';
    if (h < 21) return 'Good evening!';
    return 'Time for bed soon!';
  }

  // fixed star field inside the window, each twinkling on its own clock
  var STARS = [[3, 3], [8, 6], [14, 2], [17, 8], [6, 12], [12, 10], [19, 4], [10, 15], [2, 9], [16, 14]];

  /* ------------------------------------------------------------------ */
  /* the room                                                            */
  /* ------------------------------------------------------------------ */
  function drawRoom(L, t) {
    var paper = WALLPAPERS[(pet && pet.wallpaper) || 'rose'] || WALLPAPERS.rose;
    var wall = C(paper.wall), wallLow = C(paper.low), trim = C(paper.trim);
    var floor = C('#f6cf95'), plank = C('#e0b273'), floorEdge = C('#c99a5f');
    var fy = room.floorY;

    L.rect(0, 0, W, fy, wall);
    if (paper.motif === 'lantern') {
      // rows of little pumpkins, offset every other row
      for (var my = 8; my < fy - 14; my += 13) {
        for (var mx = 6 + ((my / 13) % 2 ? 8 : 0); mx < W - 2; mx += 16) {
          drawLantern(L, mx, my);
        }
      }
    }
    L.rect(0, fy - 13, W, 13, wallLow);
    L.rect(0, fy - 14, W, 1, trim);
    L.rect(0, fy, W, 1, floorEdge);
    L.rect(0, fy + 1, W, H - fy, floor);
    for (var x = 3; x < W; x += 12) L.rect(x, fy + 1, 1, H - fy, plank);
    L.rect(0, fy + 8, W, 1, plank);
    L.rect(0, fy + 20, W, 1, plank);

    // rug under the pet
    var rugY = room.groundY + 2;
    var rugR = Math.min(Math.round(W * 0.36), 34);
    L.ellipse(W / 2, rugY, rugR, Math.max(4, rugR * 0.22), C('#bfe9ff'));
    L.ellipse(W / 2, rugY, rugR * 0.68, Math.max(3, rugR * 0.15), C('#9adcf8'));
    L.ellipse(W / 2, rugY, rugR * 0.34, Math.max(2, rugR * 0.08), C('#bfe9ff'));

    // bunting, hung below the status card — skulls if that prize is up
    var by = Math.round(H * 0.1);
    var spooky = !!(pet && pet.banner === 'skullbanner');
    var cols = ['#ff8fb0', '#ffd93d', '#8ee86a', '#9ad0ff'];
    var n = Math.max(3, Math.floor((W - 6) / (spooky ? 11 : 9)));
    var string = C(spooky ? '#4a2f6e' : '#e8629a');
    for (var sxp = 3; sxp <= W - 3; sxp++) {
      L.set(sxp, by + Math.sin(Math.PI * (sxp - 3) / (W - 6)) * 3, string);
    }
    for (var i = 0; i < n; i++) {
      var bx = 3 + (W - 6) * (i / n);
      var sag = Math.sin(Math.PI * (i / n)) * 3;
      if (spooky) drawBannerSkull(L, bx + 2.5, by + sag);
      else L.tri(bx, by + sag + 1, bx + 5, by + sag + 1, bx + 2.5, by + sag + 6, C(cols[i % cols.length]));
    }

    // window — the sky outside follows the real time of day
    var wx = 4, wy = Math.round(H * 0.2);
    L.rect(wx + 2, wy + 2, 20, 18, C(sky.sky));

    if (sky.stars > 0.25) {
      for (var st = 0; st < STARS.length; st++) {
        var tw = 0.55 + 0.45 * Math.sin(t * 1.6 + st * 1.7);
        if (tw * sky.stars < 0.4) continue;
        L.set(wx + 2 + STARS[st][0], wy + 2 + STARS[st][1], C(tw > 0.85 ? '#ffffff' : '#cfd8ff'));
      }
    }

    // sun by day, moon by night, both riding an arc across the panes
    if (sky.hour >= 6.5 && sky.hour <= 20.5) {
      var sp2 = (sky.hour - 6.5) / 14;
      L.disc(wx + 3 + sp2 * 18, wy + 17 - Math.sin(sp2 * Math.PI) * 12, 3.5,
        C(sky.stars > 0.1 ? '#ffb066' : '#ffe98a'));
    } else {
      var mp = (sky.hour > 20.5 ? sky.hour - 20.5 : sky.hour + 3.5) / 10;
      var mx2 = wx + 3 + mp * 18, my2 = wy + 17 - Math.sin(mp * Math.PI) * 12;
      L.disc(mx2, my2, 3.2, C('#f4f2ff'));
      L.disc(mx2 + 1.6, my2 - 1.2, 2.4, C(sky.sky));
    }

    var cloudCol = sky.stars > 0.5 ? '#3a4272' : sky.stars > 0.1 ? '#ffd0b0' : '#ffffff';
    var c1 = wx + 5 + ((t * 2) % 15);
    L.ellipse(c1, wy + 13, 4, 2, C(cloudCol));
    L.ellipse(c1 + 2, wy + 12, 2.5, 1.5, C(cloudCol));
    var c2 = wx + 5 + ((t * 1.3 + 8) % 15);
    L.ellipse(c2, wy + 5, 3, 1.4, C(cloudCol));
    var frame = C('#ffffff');
    L.rect(wx, wy, 24, 2, frame);
    L.rect(wx, wy + 20, 24, 2, frame);
    L.rect(wx, wy, 2, 22, frame);
    L.rect(wx + 22, wy, 2, 22, frame);
    L.rect(wx + 11, wy + 2, 1, 18, frame);
    L.rect(wx + 2, wy + 10, 20, 1, frame);

    // the picture on the wall, which a prize can swap out
    var py2 = pictureY();
    var px2 = W - 19;
    if (pet && pet.picture === 'skull') {
      L.rect(px2, py2, 13, 12, C('#4a2f6e'));
      L.rect(px2 + 2, py2 + 2, 9, 8, C('#2b1f3d'));
      L.ellipse(px2 + 6.5, py2 + 5.4, 3.4, 2.8, C('#f4efe6'));
      L.rect(px2 + 5, py2 + 7.4, 4, 2.2, C('#f4efe6'));
      L.rect(px2 + 4.5, py2 + 4.4, 1.6, 1.6, C('#2b1f3d'));
      L.rect(px2 + 7.5, py2 + 4.4, 1.6, 1.6, C('#2b1f3d'));
      L.set(px2 + 6.5, py2 + 6.4, C('#2b1f3d'));
      L.set(px2 + 5.5, py2 + 8.4, C('#2b1f3d'));
      L.set(px2 + 7.5, py2 + 8.4, C('#2b1f3d'));
    } else {
      L.rect(px2, py2, 13, 12, C('#f7b955'));
      L.rect(px2 + 2, py2 + 2, 9, 8, C('#fff6e0'));
      L.stamp(Pets.HEART, { '#': C('#ff6f9c') }, px2 + 4, py2 + 3);
    }

    // wall shelf with a jar and a book, filling the middle of the wall
    var sy = fy - 20, sx = W - 40;
    if (sy > py2 + 15) {
      L.rect(sx, sy, 15, 2, C('#d9954f'));
      L.rect(sx + 3, sy - 6, 5, 6, C('#8ee86a'));
      L.rect(sx + 2, sy - 8, 7, 2, C('#63c93f'));
      L.rect(sx + 9, sy - 7, 3, 7, C('#ff8fb0'));
      L.rect(sx + 12, sy - 6, 3, 6, C('#9ad0ff'));
    }

    // potted plant — it keeps growing until you give it a trim
    var pl = plantShape();
    var lv = pl.lv, wild = pl.wild;
    var sway = Math.sin(t * 1.3) * (0.4 + lv);
    var cactus = !!(pet && pet.plantStyle === 'cactus');
    stampOutlined(L, pl.cx, pl.baseY, function (b, bx, by) {
      b.rect(bx - 4, by - 3, 9, 9, C('#e58f6a'));
      b.rect(bx - 5, by - 5, 11, 3, C('#f2a682'));
      var stem = pl.stem;
      var top = by - 4 - stem;
      if (cactus) { drawCactus(b, bx, by, top, stem, lv, wild, sway); return; }
      b.rect(bx - 0.5, top, 1.5, stem, C('#4ea832'));
      var r = 2.6 + lv * 2.2;
      b.disc(bx + sway * 0.3, top, r, C('#7ed957'));
      b.disc(bx - 3 - lv * 1.6, top + 2.5, r * 0.8, C('#63c93f'));
      b.disc(bx + 3 + lv * 1.6, top + 2.5, r * 0.8, C('#63c93f'));
      b.disc(bx + sway * 0.5, top - 3 - lv * 2, r * 0.7, C('#8ee86a'));
      if (lv > 0.45) {
        b.disc(bx - 4.5 - lv * 2, top - 1, r * 0.6, C('#8ee86a'));
        b.disc(bx + 4.5 + lv * 2, top - 1, r * 0.6, C('#7ed957'));
      }
      if (wild) {
        // straggly shoots poking well clear of the leaves: time for a trim
        b.line(bx - 2, top + 1, bx - 11 + sway, top - 7, C('#4ea832'), 1);
        b.ellipse(bx - 11 + sway, top - 7.5, 2.2, 1.4, C('#8ee86a'));
        b.line(bx + 2, top, bx + 11 - sway, top - 8, C('#4ea832'), 1);
        b.ellipse(bx + 11 - sway, top - 8.5, 2.2, 1.4, C('#63c93f'));
        b.line(bx, top - 2, bx + 2 + sway, top - 11, C('#4ea832'), 1);
        b.ellipse(bx + 2 + sway, top - 11.5, 1.8, 1.3, C('#8ee86a'));
        b.line(bx - 1, top + 4, bx - 9, top + 9, C('#4ea832'), 1);
        b.ellipse(bx - 9.5, top + 9, 2, 1.3, C('#63c93f'));
      }
    }, true);

    // toy box, where the prizes are kept. With something new inside it
    // rattles and its colours brighten — the glow around it is drawn later,
    // with the lights on.
    var boxNew = !!pet && pet.prizeNew > 0;
    var lid = boxNew ? Math.sin(t * 3) * 1.2 - 1.5 : 0;
    stampOutlined(L, 8, fy - 3, function (b, bx, by) {
      b.rect(bx - 6, by - 4, 13, 9, C(boxNew ? '#bfe4ff' : '#9ad0ff'));
      b.rect(bx - 6, by - 4 + lid, 13, 2, C(boxNew ? '#9ad0ff' : '#77b8f0'));
      b.disc(bx - 2, by + 1, 1.7, C('#ff8fb0'));
      b.disc(bx + 3, by + 1, 1.7, C('#ffe07a'));
    });

    // pet bed cushion on the floor
    stampOutlined(L, 12, fy + 13, function (b, bx, by) {
      b.ellipse(bx, by, 9, 4, C('#ff8fb0'));
      b.ellipse(bx, by - 1, 6.5, 2.6, C('#ffd0dd'));
    });

    // a little night light comes on once it gets dark
    if (sky.night > 0.3) {
      var nx = W - 13, ny = fy + 9;
      L.ellipse(nx, ny, 7, 4, C('#fff3c8'));
      stampOutlined(L, nx, ny, function (b, bx, by) {
        b.rect(bx - 1, by - 2, 3, 3, C('#e6dfd6'));
        b.disc(bx, by - 4, 3, C('#fffbe6'));
        b.disc(bx - 1, by - 5, 1.2, C('#ffffff'));
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* props                                                               */
  /* ------------------------------------------------------------------ */
  function drawBowl(L, x, y, fill, level) {
    stampOutlined(L, x, y, function (b, bx, by) {
      var rim = C('#ff8a5c'), body = C('#e56b40');
      b.ellipse(bx, by, 7, 3, body);
      b.rect(bx - 7, by - 2, 14, 2, body);
      b.ellipse(bx, by + 2, 6, 1.6, C('#c4552f'));
      b.ellipse(bx, by - 2, 8, 2.6, rim);
      b.ellipse(bx, by - 2.4, 6.4, 1.8, C('#c4552f'));
      if (level > 0) {
        if (fill === '#c98a4b') {
          var k = C(fill), kl = C('#e0a566');
          for (var i = 0; i < 5; i++) {
            b.disc(bx - 4.4 + i * 2.2, by - 3 - (i % 2) * 1.1 - level * 1.1, 1.5, i % 2 ? k : kl);
          }
        } else {
          b.ellipse(bx, by - 2.6, 6.2 * level, 1.7 * level, C(fill));
          b.ellipse(bx - 2, by - 3, 1.6 * level, 0.7 * level, C('#d6f2ff'));
        }
      }
    });
  }

  function drawBottle(L, x, y) {
    stampOutlined(L, x, y - 5, function (b, bx, by) {
      b.rect(bx - 1, by - 9, 3, 2, C('#b9c2d0'));
      b.rect(bx - 3, by - 7, 7, 2, C('#d8dee8'));
      b.rect(bx - 4, by - 5, 9, 9, C('#7fd8a8'));
      b.rect(bx - 4, by - 2, 9, 4, C('#ffffff'));
      b.rect(bx - 0.5, by - 1, 2, 3, C('#ff5f5f'));
      b.rect(bx - 2, by, 5, 1, C('#ff5f5f'));
    });
    // spoon
    stampOutlined(L, x - 9, y - 9, function (b, bx, by) {
      b.ellipse(bx, by, 2.6, 1.8, C('#dfe6ee'));
      b.line(bx + 2, by, bx + 6, by - 2, C('#b9c2d0'), 1.6);
    });
  }

  /* One dish per food, shrinking as it gets eaten. */
  function drawDish(L, x, y, kind, left) {
    var k = 0.35 + 0.65 * clamp(left, 0, 1);
    if (left <= 0.02) return;
    stampOutlined(L, x, y, function (b, bx, by) {
      if (kind === 'steak') {
        b.ellipse(bx, by, 7 * k, 5 * k, C('#c4553f'));
        b.ellipse(bx - 1 * k, by - 1 * k, 4.4 * k, 3 * k, C('#e0705c'));
        b.disc(bx - 6 * k, by - 3 * k, 2.2 * k, C('#f4efe6'));
        b.disc(bx - 4 * k, by - 4.6 * k, 2 * k, C('#f4efe6'));
      } else if (kind === 'bone') {
        b.rect(bx - 5 * k, by - 1.5 * k, 10 * k, 3 * k, C('#f4efe6'));
        b.disc(bx - 5 * k, by - 2.4 * k, 2.2 * k, C('#f4efe6'));
        b.disc(bx - 5 * k, by + 1.4 * k, 2.2 * k, C('#f4efe6'));
        b.disc(bx + 5 * k, by - 2.4 * k, 2.2 * k, C('#f4efe6'));
        b.disc(bx + 5 * k, by + 1.4 * k, 2.2 * k, C('#f4efe6'));
      } else if (kind === 'donut') {
        b.disc(bx, by + 0.6 * k, 6.4 * k, C('#d9954f'));
        b.disc(bx, by - 0.4 * k, 6 * k, C('#ff9ec4'));
        b.disc(bx, by, 2.2 * k, C('#d9954f'));
        b.set(bx - 3 * k, by - 3 * k, C('#8ee86a'));
        b.set(bx + 2 * k, by - 3.4 * k, C('#ffe07a'));
        b.set(bx + 3.4 * k, by + 1 * k, C('#7fd8ff'));
      } else if (kind === 'fish') {
        b.ellipse(bx + 0.5 * k, by, 5.6 * k, 3.4 * k, C('#7fd8ff'));
        b.ellipse(bx - 0.5 * k, by - 1 * k, 3.4 * k, 1.8 * k, C('#c8f0ff'));
        b.tri(bx - 4.6 * k, by, bx - 8 * k, by - 3.6 * k, bx - 8 * k, by + 3.6 * k, C('#5fc8ff'));
        b.tri(bx + 1 * k, by - 3.2 * k, bx + 4 * k, by - 6.4 * k, bx + 4.6 * k, by - 2.6 * k, C('#5fc8ff'));
        b.set(bx + 3 * k, by - 1.4 * k, C('#141014'));
      } else if (kind === 'ice') {
        b.tri(bx - 3.4 * k, by - 1 * k, bx + 3.4 * k, by - 1 * k, bx, by + 7 * k, C('#e0a45e'));
        b.tri(bx - 2.4 * k, by - 0.6 * k, bx + 2.4 * k, by - 0.6 * k, bx, by + 5.6 * k, C('#f0bd7c'));
        b.disc(bx - 2 * k, by - 2 * k, 3 * k, C('#ffc3dd'));
        b.disc(bx + 2 * k, by - 2.4 * k, 3 * k, C('#c8f0ff'));
        b.disc(bx, by - 4.6 * k, 3 * k, C('#fff3a8'));
        b.set(bx, by - 7 * k, C('#ff5f8f'));
      } else {  // lollipop
        b.rect(bx - 0.5, by + 1, 1.5, 7 * k, C('#f4efe6'));
        b.disc(bx, by - 1 * k, 5 * k, C('#ff5f8f'));
        b.disc(bx, by - 1 * k, 3.4 * k, C('#ffffff'));
        b.disc(bx, by - 1 * k, 1.8 * k, C('#ff5f8f'));
      }
    });
  }

  function drawTub(L, x, y, backOnly, t) {
    var shell = C('#ffffff'), shellShade = C('#dfe9f5'), water = C('#8fd8ff');
    if (backOnly) {
      stampOutlined(L, x, y, function (b, bx, by) {
        b.rect(bx - 17, by - 8, 34, 9, shell);
        b.ellipse(bx, by - 8, 17, 4, shellShade);
        b.ellipse(bx, by - 8, 15, 3, water);
      });
    } else {
      stampOutlined(L, x, y, function (b, bx, by) {
        b.rect(bx - 17, by - 3, 34, 6, shell);
        b.ellipse(bx, by + 3, 17, 4, shell);
        b.ellipse(bx, by - 3, 16, 2.6, water);
      });
      for (var i = 0; i < 6; i++) {
        var bx2 = x - 13 + i * 5 + Math.sin(t * 2 + i) * 1.2;
        L.disc(bx2, y - 4, 2.2, C('#ffffff'));
        L.set(bx2 - 1, y - 5, C('#eaf9ff'));
      }
      var dx = x + 12 + Math.sin(t * 1.6) * 1.5, dy = y - 7;
      stampOutlined(L, dx, dy, function (b, bx, by) {
        b.ellipse(bx, by, 3, 2.2, C('#ffd83d'));
        b.disc(bx + 2, by - 2.5, 2, C('#ffd83d'));
        b.rect(bx + 4, by - 2.5, 2, 1, C('#ff8a3d'));
        b.set(bx + 3, by - 3, C('#141014'));
      });
    }
  }

  function drawBall(L, x, y, spin) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.disc(bx, by, 4, C('#ff5f8f'));
      b.disc(bx - 1, by - 1, 2, C('#ff8fb0'));
      b.line(bx - Math.cos(spin) * 4, by - Math.sin(spin) * 4,
        bx + Math.cos(spin) * 4, by + Math.sin(spin) * 4, C('#ffffff'), 1);
    });
  }

  function drawSoap(L, x, y, tilt) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.ellipse(bx, by + 1, 5.5, 3, C('#5fc8ff'));
      b.ellipse(bx, by - 0.4, 5, 2.2, C('#b6e6ff'));
      b.ellipse(bx - 1.6, by - 0.8, 1.8, 0.9, C('#eaf9ff'));
      b.disc(bx + 5, by - 4 + tilt, 1.6, C('#ffffff'));
      b.disc(bx - 5, by - 5 - tilt, 1.2, C('#ffffff'));
    });
  }

  function drawShower(L, x, y, tilt, running) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.line(bx + 2, by - 2, bx + 7 + tilt, by - 8, C('#b9c2d0'), 2.4);
      b.ellipse(bx - 1, by, 4.6, 2.6, C('#d8dee8'));
      b.ellipse(bx - 1, by - 1, 4, 1.7, C('#eef2f8'));
    });
    if (running) {
      for (var i = 0; i < 4; i++) {
        var jx = x - 4 + i * 2.2;
        L.rect(jx, y + 3, 1, 3 + (i % 2) * 2, C('#7fd8ff'));
        L.set(jx, y + 7 + (i % 2) * 2, C('#d6f2ff'));
      }
    }
  }

  function drawTowel(L, x, y, tilt) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.rect(bx - 5, by - 3 + tilt * 0.3, 10, 7, C('#ffd0e6'));
      b.rect(bx - 5, by - 3 + tilt * 0.3, 10, 2, C('#ff8fb8'));
      b.rect(bx - 5, by + 0.5, 10, 1, C('#ffb3d0'));
      for (var i = 0; i < 3; i++) b.rect(bx - 4 + i * 3, by + 4 + tilt * 0.3, 2, 2, C('#ffe4f0'));
    });
  }

  function drawBrush(L, x, y, tilt) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.line(bx + 3, by - 1, bx + 8 + tilt, by - 7, C('#d9954f'), 2.6);
      b.ellipse(bx - 1, by, 5, 3, C('#d9954f'));
      b.ellipse(bx - 1, by - 1, 4.4, 2, C('#eab275'));
      for (var i = -4; i <= 3; i += 2) b.rect(bx + i, by + 2, 1, 3, C('#fbf3e6'));
    });
  }

  /* ------------------------------------------------------------------ */
  /* accidents on the floor                                              */
  /* ------------------------------------------------------------------ */
  function randomMess() {
    return {
      k: Math.random() < 0.62 ? 'poop' : 'pee',
      nx: (0.4 + Math.random() * 0.6) * (Math.random() < 0.5 ? -1 : 1),
      ny: Math.random()
    };
  }

  /* Finds a free patch of floor so accidents do not land on top of each other. */
  function addMess(p) {
    if (p.messes.length >= MAX_MESS) return null;
    var best = null;
    for (var tries = 0; tries < 10; tries++) {
      var cand = randomMess();
      var ok = true;
      for (var i = 0; i < p.messes.length; i++) {
        var o = p.messes[i];
        if (Math.abs(o.nx - cand.nx) < 0.34 && Math.abs(o.ny - cand.ny) < 0.5) { ok = false; break; }
      }
      if (ok) { best = cand; break; }
    }
    if (!best) return null;
    p.messes.push(best);
    return best;
  }

  function messPos(m) {
    return {
      x: W / 2 + m.nx * (W * 0.3),
      y: room.groundY + 2 + m.ny * 5
    };
  }

  function drawMess(L, m, t, age) {
    var p = messPos(m);
    if (m.k === 'poop') {
      stampOutlined(L, p.x, p.y, function (b, bx, by) {
        b.ellipse(bx, by, 5, 2, C('#6d5233'));
        b.ellipse(bx, by - 2, 4, 2, C('#8a6a45'));
        b.ellipse(bx + 0.5, by - 4, 2.6, 1.8, C('#8a6a45'));
        b.ellipse(bx - 1, by - 2.6, 1.6, 0.8, C('#a3835a'));
        b.disc(bx + 1, by - 5.4, 1, C('#a3835a'));
      });
    } else {
      stampOutlined(L, p.x, p.y, function (b, bx, by) {
        b.ellipse(bx, by, 6.5, 2.6, C('#ffd83d'));
        b.ellipse(bx - 1, by - 0.5, 3.4, 1.2, C('#ffeb9a'));
      });
    }
    // a fly turns up once the mess has been sitting a while
    if (age > 18) {
      var fx2 = p.x + Math.cos(t * 3 + m.nx * 4) * 6;
      var fy2 = p.y - 7 + Math.sin(t * 4.5 + m.nx * 4) * 3;
      L.set(fx2, fy2, C('#3a2b40'));
      L.set(fx2 - 1, fy2 - 1, C('#8f9bd6'));
      L.set(fx2 + 1, fy2 - 1, C('#8f9bd6'));
    }
  }

  function messKey(m) { return m.k + Math.round(m.nx * 100) + '_' + Math.round(m.ny * 100); }

  function cleanMessAt(x, y) {
    if (!pet.messes) return false;
    for (var i = 0; i < pet.messes.length; i++) {
      var p = messPos(pet.messes[i]);
      if (Math.abs(x - p.x) < 8 && Math.abs(y - p.y) < 7) {
        delete rt.messAge[messKey(pet.messes[i])];
        pet.messes.splice(i, 1);
        for (var k = 0; k < 6; k++) {
          spawn('poof', p.x + (Math.random() - 0.5) * 10, p.y - 3,
            { vx: (Math.random() - 0.5) * 18, vy: -10 - Math.random() * 10, max: 0.8 });
        }
        spawn('sparkle', p.x, p.y - 6, { vy: -12, max: 0.8 });
        pet.stats.clean = clamp(pet.stats.clean + 6, 0, 100);
        bumpLove(3);
        addGrowth(0.8);
        Sfx.pop();
        if (!pet.messes.length) say('All tidy!', 1600);
        save();
        return true;
      }
    }
    return false;
  }

  /* The pet quietly excuses itself now and then. */
  function updateMesses(dt) {
    var i;
    for (i = 0; i < pet.messes.length; i++) {
      var key = messKey(pet.messes[i]);
      rt.messAge[key] = (rt.messAge[key] || 0) + dt;
    }
    if (rt.activity || rt.tool || rt.sleep || rt.pooping || rt.angry > 0 || rt.intro) return;
    if (pet.messes.length >= MAX_MESS) return;

    rt.messTimer -= dt;
    if (rt.messTimer <= 0) {
      rt.messTimer = 55 + Math.random() * 70;
      rt.pooping = { t: 0, dur: 2.4, dropped: false };
    }
  }

  function updatePooping(dt) {
    var pp = rt.pooping;
    if (!pp) return;
    pp.t += dt;
    if (!pp.dropped && pp.t > 1) {
      pp.dropped = true;
      var made = addMess(pet);
      if (made) {
        rt.messAge[messKey(made)] = 0;
        Sfx.plop();
        say(made.k === 'poop' ? 'Oops!' : 'Uh oh…', 1600);
        save();
      }
    }
    if (pp.t >= pp.dur) rt.pooping = null;
  }

  /* ------------------------------------------------------------------ */
  /* prizes                                                              */
  /* ------------------------------------------------------------------ */
  function fullMeters(p) {
    var n = 0;
    for (var i = 0; i < STAT_KEYS.length; i++) if (p.stats[STAT_KEYS[i]] >= PRIZE_LEVEL) n++;
    return n;
  }

  var prizePopTimer = null;

  /* Hands out one prize the player has not got yet: "New Prize!" pops up over
     your pet in a shower of confetti, the prize itself flies across the room
     into the toy box, and the box lights up until you go and look. Nothing
     covers the screen, so play is never interrupted. */
  function awardPrize() {
    var left = PRIZES.filter(function (p) { return !hasPrize(p.id); });
    if (!left.length) return null;
    var won = left[Math.floor(Math.random() * left.length)];
    pet.prizes.push(won.id);
    pet.prizeNew++;

    Sfx.grow();
    rt.prizeFly = { t: 0, icon: won.icon };
    confettiBurst(W / 2, room.groundY - 40, 26);
    for (var i = 0; i < 8; i++) {
      spawn('sparkle', W / 2 + (Math.random() - 0.5) * 24, room.groundY - 30,
        { vx: (Math.random() - 0.5) * 26, vy: -20 - Math.random() * 16, g: 30, max: 1.2 });
    }
    el.prizePop.classList.add('show');
    clearTimeout(prizePopTimer);
    prizePopTimer = setTimeout(function () { el.prizePop.classList.remove('show'); }, 2400);
    save();
    return won;
  }

  /* Two meters topped up at once wins a prize. It only fires on the way up,
     so a single pair cannot pay out twice. */
  function checkPrize() {
    var n = fullMeters(pet);
    if (n < 2) { pet.prizeArmed = false; return; }
    if (pet.prizeArmed) return;
    // wait until nothing is going on, so a prize never lands mid-bath or
    // mid-game and steals the moment
    if (rt.activity || rt.tool || rt.dose || rt.intro || pickerOpen()) return;
    pet.prizeArmed = true;
    say('All topped up!', 2000);
    awardPrize();
  }

  /* The light spilling out of the toy box when a prize is waiting inside.
     Drawn with the room objects rather than as part of the room, so the glow
     stays bright after dark instead of being dimmed along with the walls. */
  function drawToyBoxGlow(L, t) {
    if (!pet || pet.prizeNew <= 0) return;
    var fy = room.floorY, cx = 8, cy = fy - 2;
    var pulse = 0.5 + 0.5 * Math.sin(t * 3.4);
    var reach = 5 + pulse * 2.5;
    var lit = C('#fff3c8'), warm = C('#ffe98a');
    var shim = Math.floor(t * 6);
    // measured out from the sides of the box rather than from its middle, so
    // the light hugs the box in a halo instead of pooling behind it
    for (var y = Math.floor(cy - 7 - reach); y <= Math.ceil(cy + 7 + reach); y++) {
      for (var x = Math.floor(cx - 9 - reach); x <= Math.ceil(cx + 9 + reach); x++) {
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        if (x <= 17 && y >= fy - 9 && y <= fy + 4) continue;   // the box itself
        var ex = Math.max(0, Math.abs(x - cx) - 8.5);
        var ey = Math.max(0, Math.abs(y - cy) - 6);
        var d = Math.sqrt(ex * ex + ey * ey);
        if (d > reach) continue;
        // solid right against the box, thinning to a shimmer further out
        if (d >= 2 && (x + y + shim) % (d < 3.6 ? 2 : 3) !== 0) continue;
        L.set(x, y, d < 2.6 ? lit : warm);
      }
    }
    var tw = Math.sin(t * 4);
    if (tw > -0.3) {
      L.stamp(['..#..', '.###.', '#####', '.###.', '..#..'], { '#': C('#fffbe6') },
        13, fy - 15 + Math.round(tw));
    }
    if (tw < 0.4) L.stamp(['.#.', '###', '.#.'], { '#': C('#fff6d0') }, 2, fy - 13 - Math.round(tw * 2));
  }

  /* Once you have won a picture you can swap the two over by tapping the
     frame on the wall — no need to go through the toy box. */
  function pictureBounds() {
    var py = pictureY();
    return { x0: W - 20, x1: W - 5, y0: py - 1, y1: py + 13 };
  }

  function tapPicture(x, y) {
    var pic = null;
    for (var i = 0; i < PRIZES.length; i++) {
      if (PRIZES[i].kind === 'picture' && hasPrize(PRIZES[i].id)) pic = PRIZES[i];
    }
    if (!pic) return false;
    var bb = pictureBounds();
    if (x < bb.x0 || x > bb.x1 || y < bb.y0 || y > bb.y1) return false;
    var on = pet.picture === pic.id;
    pet.picture = on ? null : pic.id;
    Sfx.click();
    say(on ? PUT_AWAY.picture : PUT_UP.picture, 1800);
    for (var s = 0; s < 5; s++) {
      spawn('sparkle', (W - 13) + (Math.random() - 0.5) * 12, bb.y0 + Math.random() * 12,
        { vx: (Math.random() - 0.5) * 12, vy: -10, g: 20, max: 0.8 });
    }
    save();
    return true;
  }

  function toyBoxBounds() {
    return { x0: 1, x1: 16, y0: room.floorY - 9, y1: room.floorY + 4 };
  }

  function tapToyBox(x, y) {
    var bb = toyBoxBounds();
    if (x < bb.x0 || x > bb.x1 || y < bb.y0 || y > bb.y1) return false;
    Sfx.click();
    openPrizes();
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* the houseplant                                                      */
  /* ------------------------------------------------------------------ */
  /* The framed heart on the wall, which the plant has to grow up towards but
     never into. Kept clear of the bunting above it. */
  function pictureY() {
    return Math.max(Math.round(H * 0.18), Math.round(H * 0.1) + 10);
  }

  /* How big the houseplant has got. The drawing and the tap target both come
     from here, so they can never drift apart, and the stem is capped so the
     whole plant — leaves, straggly shoots and all — still fits on the wall
     below the picture instead of being cut off at the top. */
  function plantShape() {
    var lv = clamp(db.plant / 100, 0, 1);
    var wild = db.plant >= PLANT_WILD;
    var crown = wild ? 14 : 9;          // how far the leaves reach above the stem
    var baseY = room.floorY - 4;        // the rim of the pot
    var cap = Math.max(3, (baseY - 4) - (pictureY() + 13) - crown);
    var stem = Math.min(5 + lv * 9, cap);
    return {
      // far enough in from the wall that the straggly shoots stay on screen
      lv: lv, wild: wild, crown: crown, cx: W - 15,
      baseY: baseY, stem: stem, top: baseY - 4 - stem
    };
  }

  function plantBounds() {
    var s = plantShape();
    return {
      x0: s.cx - 15, x1: s.cx + 15,
      y0: s.top - s.crown - 2, y1: room.floorY + 3
    };
  }

  function trimPlant(x, y) {
    if (db.plant < PLANT_WILD) return false;
    var bb = plantBounds();
    if (x < bb.x0 || x > bb.x1 || y < bb.y0 || y > bb.y1) return false;
    db.plant = 18;
    Sfx.snip();
    for (var i = 0; i < 10; i++) {
      spawn('leaf', plantShape().cx + (Math.random() - 0.5) * 14, bb.y0 + Math.random() * 10,
        { vx: (Math.random() - 0.5) * 20, vy: -6 - Math.random() * 8, g: 40, max: 1.4 });
    }
    say('Nice and tidy!', 1800);
    bumpLove(4);
    addGrowth(1.5);
    save();
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* falling ill                                                         */
  /* ------------------------------------------------------------------ */
  /* Going hungry or thirsty for long enough makes a pet poorly. It never
     gets worse than this and medicine always works, but everything drains
     faster and it is too under the weather to play. */
  function updateSickness(p, dt, rate) {
    if (p.sick) return;
    var hungry = p.stats.food < STARVING || p.stats.water < STARVING;
    if (hungry) {
      p.sickT = (p.sickT || 0) + dt * rate;
      if (p.sickT >= SICK_AFTER) {
        p.sickT = 0;
        p.sick = true;
        if (p === pet) {
          say("I don't feel well…", 2600);
          Sfx.sad();
          save();
        }
      }
    } else {
      p.sickT = Math.max(0, (p.sickT || 0) - dt * 0.8);
    }
  }

  /* Milk twice in a row is one milk too many. Returns true if this drink was
     the one that did it. */
  function countMilk(kind) {
    if (kind !== 'milk') { pet.milkRun = 0; return false; }
    pet.milkRun = (pet.milkRun || 0) + 1;
    if (pet.milkRun < MILK_LIMIT || pet.sick) return false;
    pet.milkRun = 0;
    pet.sick = true;
    pet.sickT = 0;
    say('Ooh… my tummy!', 2800);
    Sfx.sad();
    for (var i = 0; i < 6; i++) {
      spawn('sick', W / 2 + (Math.random() - 0.5) * 18, room.groundY - 30,
        { vx: (Math.random() - 0.5) * 12, vy: -10, max: 1.3 });
    }
    save();
    return true;
  }

  function cure() {
    pet.sick = false;
    pet.sickT = 0;
    pet.milkRun = 0;      // a clean slate on the milk after a dose of medicine
    rt.shine = 1.4;
    for (var i = 0; i < 14; i++) {
      spawn('sparkle', W / 2 + (Math.random() - 0.5) * 26, room.groundY - 32 + Math.random() * 16,
        { vx: (Math.random() - 0.5) * 20, vy: -16 - Math.random() * 12, g: 26, max: 1.2 });
    }
    save();
  }

  /* ------------------------------------------------------------------ */
  /* giving the medicine — a little timing game                          */
  /* ------------------------------------------------------------------ */
  /* A marker sweeps back and forth along a meter. Stop it in the green
     middle twice and the spoonful goes down properly. Miss and you simply
     go again — there is no way to fail, only to keep trying. */
  var DOSE_HITS = 2;          // good stops needed
  var DOSE_ZONE = 0.16;       // half-width of the green middle, 0..1 of the meter

  function doseMeter() {
    var w = Math.min(46, W - 26);
    return { w: w, x0: Math.round(W / 2 - w / 2), y: Math.max(14, room.groundY - 44) };
  }

  function startDose() {
    if (rt.dose) return;
    rt.dose = { pos: 0.06, dir: 1, speed: 0.82, hits: 0, flash: 0, good: false };
    rt.props = {};
    el.dock.classList.add('hide');
    el.toolBar.classList.add('show');
    doseText();
    setHint('');
    refreshDock();
  }

  function doseText() {
    if (!rt.dose) return;
    el.toolText.textContent = 'Stop it in the middle!  ' + rt.dose.hits + ' / ' + DOSE_HITS;
  }

  function updateDose(dt) {
    var d = rt.dose;
    if (!d) return;
    if (d.flash > 0) d.flash = Math.max(0, d.flash - dt);
    d.pos += d.dir * d.speed * dt;
    if (d.pos > 1) { d.pos = 1; d.dir = -1; }
    if (d.pos < 0) { d.pos = 0; d.dir = 1; }
  }

  function tapDose() {
    var d = rt.dose;
    if (!d) return;
    d.good = Math.abs(d.pos - 0.5) <= DOSE_ZONE;
    d.flash = 0.45;
    if (d.good) {
      d.hits++;
      Sfx.ding();
      spawn('sparkle', W / 2, room.groundY - 46, { vy: -12, max: 0.7 });
      if (d.hits >= DOSE_HITS) {
        rt.dose = null;
        el.dock.classList.remove('hide');
        el.toolBar.classList.remove('show');
        say('Down the hatch!', 1800);
        rt.activity = { kind: 'medicine', t: 0, dur: ACTIONS.medicine.dur, given: 0, beat: 0 };
        rt.props = {};
        refreshDock();
        return;
      }
      say('Good one!', 1000);
      d.speed += 0.16;                        // a touch quicker for the second
    } else {
      Sfx.sad();
      say('Ooh, missed!', 1000);
    }
    doseText();
  }

  function cancelDose() {
    if (!rt.dose) return;
    rt.dose = null;
    el.dock.classList.remove('hide');
    el.toolBar.classList.remove('show');
    say('Maybe later…', 1400);
    refreshDock();
  }

  function drawDoseMeter(L) {
    var d = rt.dose;
    if (!d) return;
    var m = doseMeter();
    var mid = Math.round(m.w * DOSE_ZONE * 2);
    stampOutlined(L, W / 2, m.y, function (b, bx, by) {
      var x0 = bx - m.w / 2;
      b.rect(x0, by - 2, m.w, 5, C('#f2eef8'));
      b.rect(x0, by - 2, m.w, 1, C('#ded6ea'));
      b.rect(bx - mid / 2, by - 2, mid, 5, C(d.flash > 0 && d.good ? '#b9f5a0' : '#8ee86a'));
      b.rect(bx - mid / 2, by - 2, mid, 1, C('#63c93f'));
      // the sweeping marker
      var mx = Math.round(x0 + d.pos * m.w);
      b.rect(mx - 1, by - 4, 3, 9, C(d.flash > 0 ? (d.good ? '#ffd93d' : '#ff5f5f') : '#5f4bb6'));
    }, true);
  }

  /* ------------------------------------------------------------------ */
  /* naps, and being woken up                                            */
  /* ------------------------------------------------------------------ */
  function minStat(p) {
    var lo = 101;
    for (var i = 0; i < STAT_KEYS.length; i++) lo = Math.min(lo, p.stats[STAT_KEYS[i]]);
    return lo;
  }

  function pickerOpen() {
    return el.foodPicker.classList.contains('show') ||
      el.drinkPicker.classList.contains('show') ||
      el.gamePicker.classList.contains('show');
  }

  function maybeSleep(dt) {
    if (rt.sleep || rt.activity || rt.tool || rt.dose) return;
    if (rt.pooping || rt.petting || rt.angry > 0) return;
    if (pet.sick || rt.intro || pickerOpen()) return;
    if (minStat(pet) < 32) return;              // never nap while something is needed
    if (pet.messes.length) return;              // or with a mess on the floor
    if (rt.t - rt.lastWake < 30) return;
    if (Math.random() < dt / 70 * (1 + sky.night * 2.5)) {
      rt.sleep = { t: 0, dur: 15 + Math.random() * 18 };
      say('Zzz…', 1600);
      Sfx.yawn();
    }
  }

  function updateSleep(dt) {
    if (!rt.sleep) return;
    rt.sleep.t += dt;
    if (Math.random() < dt * 1.1) {
      spawn('zzz', W / 2 + 9, room.groundY - 26, { vx: 4 + Math.random() * 3, vy: -8, max: 1.9 });
    }
    if (Math.random() < dt * 0.35) Sfx.snore();
    if (rt.sleep.t >= rt.sleep.dur) wake(false);
  }

  /* Tucking the pet in on purpose: it stays down until you wake it, or until
     it has had a good long rest. */
  function tuckIn() {
    if (!pet || rt.activity || rt.tool || rt.intro || rt.pooping) return;
    if (rt.sleep) { wake(false); return; }
    // putting it straight back to bed after waking it makes up for the shock
    var sorry = rt.angry > 0;
    if (sorry) {
      rt.angry = 0;
      bumpLove(12);
      pet.stats.fun = clamp(pet.stats.fun + 6, 0, 100);
      for (var i = 0; i < 5; i++) {
        spawn('heart', W / 2 + (Math.random() - 0.5) * 16, room.groundY - 32,
          { vy: -14, max: 1.2 });
      }
    }
    rt.sleep = { t: 0, dur: 180, byPlayer: true };
    rt.petting = false;
    say(sorry ? 'Mmm… back to sleep!' : 'Night night…', 2000);
    Sfx.yawn();
    save();
  }

  /* Waking the pet yourself is rude, and it will let you know. */
  function wake(rude) {
    if (!rt.sleep) return false;
    rt.sleepByPlayer = !!rt.sleep.byPlayer;
    rt.sleep = null;
    rt.lastWake = rt.t;
    if (rude && rt.sleepByPlayer) rude = false;   // you put it down, you may wake it
    if (rude) {
      rt.angry = 9;
      bumpLove(-14);
      pet.stats.fun = clamp(pet.stats.fun - 5, 0, 100);
      say('Grrr! I was sleeping!', 2400);
      Sfx.growl();
      for (var i = 0; i < 3; i++) {
        spawn('anger', W / 2 + 8 + i * 2, room.groundY - 40 - i * 2,
          { vx: 6 + i * 4, vy: -8, max: 1.1 });
      }
    } else {
      bumpLove(10);
      say('*yawn* What a nap!', 2000);
      Sfx.yawn();
    }
    save();
    return true;
  }

  function updateAngry(dt) {
    if (rt.angry <= 0) return;
    rt.angry -= dt;
    if (Math.random() < dt * 0.8) {
      spawn('anger', W / 2 + (Math.random() < 0.5 ? -12 : 12), room.groundY - 38,
        { vy: -6, max: 0.9 });
    }
    if (rt.angry <= 0) {
      rt.angry = 0;
      say('Okay… I forgive you!', 2000);
      bumpLove(6);
      for (var i = 0; i < 4; i++) {
        spawn('heart', W / 2 + (Math.random() - 0.5) * 14, room.groundY - 30, { vy: -14, max: 1.1 });
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* mini games                                                          */
  /* ------------------------------------------------------------------ */
  /* `per` is the Fun each point is worth; `perfect` is the score that counts
     as a clean sweep and wins a prize on its own. */
  var GAMES = {
    ball: { label: 'Bounce', dur: 9, hint: 'Tap the ball!', per: 4, perfect: 8 },
    bubble: { label: 'Bubbles', dur: 14, hint: 'Pop the bubbles!', per: 3, perfect: 12 },
    treat: { label: 'Find It', dur: 0, hint: 'Which cup hides the treat?', per: 14, perfect: 3 },
    // unlocked by winning the matching toy from the toy box
    wand: { label: 'Chase', dur: 16, hint: 'Dangle it — let your pet grab it!', per: 6, perfect: 8, prize: 'wand' },
    frisbee: { label: 'Fetch', dur: 14, hint: 'Keep it flying!', per: 5, perfect: 8, prize: 'frisbee' }
  };

  function cupGap() { return Math.min(20, Math.max(14, Math.round(W * 0.26))); }
  function cupX(slot) { return W / 2 + (slot - 1) * cupGap(); }
  function cupY() { return room.groundY + 5; }

  function drawCup(L, x, y, lift) {
    stampOutlined(L, x, y - lift, function (b, bx, by) {
      b.tri(bx - 5.5, by, bx + 5.5, by, bx + 4, by - 11, C('#77b8f0'));
      b.tri(bx - 5.5, by, bx + 4, by - 11, bx - 4, by - 11, C('#77b8f0'));
      b.rect(bx - 5, by - 13, 10, 3, C('#9ad0ff'));
      b.ellipse(bx, by - 12, 5, 1.4, C('#bfe0ff'));
      b.ellipse(bx - 2.4, by - 5, 1.2, 3, C('#a8d8ff'));
    });
  }

  function drawTreat(L, x, y) {
    stampOutlined(L, x, y - 3, function (b, bx, by) {
      b.disc(bx, by, 4, C('#d9954f'));
      b.disc(bx - 1.5, by - 1, 0.9, C('#8a5a2a'));
      b.disc(bx + 1.5, by + 0.5, 0.9, C('#8a5a2a'));
      b.disc(bx, by + 2, 0.9, C('#8a5a2a'));
    });
  }

  var WAND_STRING = 13;       // how far the toy hangs below the end of the stick

  /* The teaser wand: a stick you hold, a string, and a little cat on the end
     that swings after your hand. */
  function drawWand(L, wd) {
    // the stick runs off toward your hand, past the bottom corner of the room
    var handX = W + 10, handY = room.groundY + 16;
    L.line(wd.hx, wd.hy, handX, handY, C('#141014'), 2);
    L.line(wd.hx, wd.hy - 0.6, handX, handY - 0.6, C('#c98f4b'), 1);
    // string
    L.line(wd.hx, wd.hy, wd.tx, wd.ty - 4, C('#141014'), 1);
    var wiggle = wd.cool > 0.5 ? Math.sin(rt.t * 30) * 1.2 : 0;
    stampOutlined(L, wd.tx + wiggle, wd.ty, function (b, bx, by) {
      b.tri(bx - 3.4, by - 1, bx - 0.8, by - 1.6, bx - 3.2, by - 5, C('#8a7fb8'));
      b.tri(bx + 3.4, by - 1, bx + 0.8, by - 1.6, bx + 3.2, by - 5, C('#8a7fb8'));
      b.disc(bx, by, 4, C('#8a7fb8'));
      b.ellipse(bx, by + 1.6, 2.6, 1.8, C('#d4cfe0'));
      b.set(bx - 1.8, by - 0.6, C('#141014'));
      b.set(bx + 1.8, by - 0.6, C('#141014'));
      b.set(bx, by + 0.8, C('#ff9ec4'));
      b.line(bx - 5, by + 1, bx - 2.6, by + 1.4, C('#d4cfe0'), 1);
      b.line(bx + 5, by + 1, bx + 2.6, by + 1.4, C('#d4cfe0'), 1);
    });
  }

  function moveWand(p) {
    var wd = rt.props.wand;
    if (!wd) return;
    wd.touched = true;
    wd.hx = clamp(p.x, 7, W - 7);
    wd.hy = clamp(p.y, 7, room.groundY - 10);
  }

  function drawFrisbee(L, x, y, spin) {
    var squash = 0.45 + 0.55 * Math.abs(Math.cos(spin));
    stampOutlined(L, x, y, function (b, bx, by) {
      b.ellipse(bx, by + 1, 6.5, 3.2 * squash, C('#ff9f3d'));
      b.ellipse(bx, by, 6.5, 3 * squash, C('#ffd93d'));
      b.ellipse(bx, by - 0.2, 3.6, 1.7 * squash, C('#fff3a8'));
    });
  }

  function drawGameBubble(L, bb) {
    stampOutlined(L, bb.x, bb.y, function (b, bx, by) {
      b.disc(bx, by, bb.r, C('#bfe9ff'));
      b.disc(bx, by, Math.max(1, bb.r - 1.6), C('#eaf9ff'));
      b.disc(bx - bb.r * 0.4, by - bb.r * 0.4, Math.max(0.8, bb.r * 0.25), C('#ffffff'));
    });
  }

  function newTreatRound() {
    var g = rt.activity;
    g.round++;
    g.cups = [0, 1, 2].map(function (i) { return { slot: i, x: cupX(i), lift: 0 }; });
    g.treatCup = Math.floor(Math.random() * 3);
    g.phase = 'reveal';
    g.phaseT = 0;
    g.swapsLeft = 2 + g.round;
    g.swap = null;
    g.picked = -1;
  }

  function beginSwap() {
    var g = rt.activity;
    var a = Math.floor(Math.random() * 3);
    var b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
    g.swap = { a: a, b: b, t: 0, dur: 0.42, ax: g.cups[a].slot, bx: g.cups[b].slot };
    Sfx.whoosh();
  }

  function updateTreatGame(dt) {
    var g = rt.activity;
    g.phaseT += dt;

    if (g.phase === 'reveal') {
      g.cups[g.treatCup].lift = Math.min(13, g.phaseT * 40);
      if (g.phaseT > 1.5) {
        g.cups[g.treatCup].lift = 0;
        g.phase = 'shuffle';
        g.phaseT = 0;
      }
      return;
    }

    if (g.phase === 'shuffle') {
      if (!g.swap) {
        if (g.swapsLeft <= 0) { g.phase = 'choose'; g.phaseT = 0; return; }
        g.swapsLeft--;
        beginSwap();
      }
      var sw = g.swap;
      sw.t += dt;
      var k = Math.min(1, sw.t / sw.dur);
      var ca = g.cups[sw.a], cb = g.cups[sw.b];
      ca.x = cupX(sw.ax) + (cupX(sw.bx) - cupX(sw.ax)) * k;
      cb.x = cupX(sw.bx) + (cupX(sw.ax) - cupX(sw.bx)) * k;
      ca.lift = Math.sin(Math.PI * k) * 5;
      cb.lift = 0;
      if (k >= 1) {
        var t2 = ca.slot; ca.slot = cb.slot; cb.slot = t2;
        ca.x = cupX(ca.slot); cb.x = cupX(cb.slot);
        ca.lift = cb.lift = 0;
        g.swap = null;
      }
      return;
    }

    if (g.phase === 'result') {
      var right = g.picked === g.treatCup;
      g.cups[g.picked].lift = Math.min(13, g.phaseT * 45);
      if (!right && g.phaseT > 0.8) g.cups[g.treatCup].lift = Math.min(13, (g.phaseT - 0.8) * 45);
      if (g.phaseT > 2) {
        if (g.round >= 3) endGame();
        else newTreatRound();
      }
    }
  }

  function pickCup(x, y) {
    var g = rt.activity;
    if (!g || g.game !== 'treat' || g.phase !== 'choose') return false;
    if (y < cupY() - 16 || y > cupY() + 5) return false;
    for (var i = 0; i < g.cups.length; i++) {
      if (Math.abs(x - g.cups[i].x) < cupGap() / 2) {
        g.picked = i;
        g.phase = 'result';
        g.phaseT = 0;
        if (i === g.treatCup) {
          g.score++;
          pet.stats.fun = clamp(pet.stats.fun + GAMES.treat.per, 0, 100);
          bumpLove(5);
          Sfx.ding();
          say('You found it!', 1600);
          for (var k = 0; k < 5; k++) {
            spawn('heart', g.cups[i].x + (Math.random() - 0.5) * 10, room.groundY - 20, { vy: -15, max: 1.1 });
          }
        } else {
          Sfx.sad();
          say('Not that one!', 1600);
        }
        return true;
      }
    }
    return false;
  }

  function startFeeding(kind) {
    el.foodPicker.classList.remove('show');
    if (rt.sleep) { wake(true); return; }
    var food = FOODS[kind] || FOODS.meal;
    rt.activity = { kind: 'feed', food: kind, t: 0, dur: 4.6, given: 0, beat: 0, gain: food.gain };
    rt.props = {};
    refreshDock();
  }

  function startDrinking(kind) {
    el.drinkPicker.classList.remove('show');
    if (rt.sleep) { wake(true); return; }
    var drink = DRINKS[kind] || DRINKS.water;
    rt.activity = {
      kind: 'water', drink: kind, t: 0, dur: 4.0,
      given: 0, beat: 0, gain: drink.gain
    };
    rt.props = {};
    refreshDock();
  }

  function startGame(id) {
    el.gamePicker.classList.remove('show');
    if (rt.sleep) { wake(true); return; }
    rt.activity = { kind: 'play', game: id, t: 0, dur: GAMES[id].dur, score: 0 };
    rt.props = {};
    if (id === 'ball') {
      rt.props.ball = { x: W * 0.72, y: room.groundY - 34, vx: -16, vy: 0, spin: 0 };
      Sfx.boing();
    } else if (id === 'bubble') {
      rt.props.bubbles = [];
      rt.activity.spawnT = 0;
    } else if (id === 'treat') {
      rt.activity.round = 0;
      newTreatRound();
    } else if (id === 'wand') {
      rt.props.wand = {
        hx: W * 0.72, hy: room.groundY - 46,
        tx: W * 0.72, ty: room.groundY - 46 + WAND_STRING,
        vx: 0, vy: 0, charge: 0, cool: 0, touched: false
      };
      Sfx.pickup();
    } else if (id === 'frisbee') {
      rt.props.frisbee = { x: 12, y: room.groundY - 26, vx: 30, vy: -14, spin: 0 };
      Sfx.whoosh();
    }
    el.dock.classList.add('hide');
    el.toolBar.classList.add('show');
    el.toolText.textContent = GAMES[id].hint;
    setHint('');
    refreshDock();
  }

  function endGame() {
    var g = rt.activity;
    if (!g) return;
    var cfg = GAMES[g.game];
    pet.stats.fun = clamp(pet.stats.fun + 12, 0, 100);
    addGrowth(4 + Math.min(4, g.score * 0.4));
    bumpLove(8);

    // three ways a round is worth a prize: a clean sweep, a new record, or
    // matching the record you already hold
    var had = pet.best[g.game];
    var isPerfect = !!cfg.perfect && g.score >= cfg.perfect;
    var beatIt = had !== undefined && g.score > had;
    var matched = had !== undefined && g.score === had && g.score > 0;
    if (had === undefined || g.score > had) pet.best[g.game] = g.score;

    if (isPerfect || beatIt || matched) {
      say(isPerfect ? 'Perfect! ' + g.score + '!' : beatIt ? 'New best: ' + g.score + '!'
        : 'Matched your best!', 2400);
      Sfx.ding();
      setTimeout(function () { awardPrize(); }, 700);
    } else {
      say(g.score > 0 ? 'Score: ' + g.score + '!' : 'That was fun!', 2200);
    }
    for (var i = 0; i < 5; i++) {
      spawn('heart', W / 2 + (Math.random() - 0.5) * 14, room.groundY - 28, { vy: -14, max: 1.2 });
    }
    rt.activity = null;
    rt.props = {};
    rt.leanTarget = 0;
    el.dock.classList.remove('hide');
    el.toolBar.classList.remove('show');
    refreshDock();
    save();
  }

  /* ------------------------------------------------------------------ */
  /* the present a new pet arrives in                                    */
  /* ------------------------------------------------------------------ */
  function drawPresent(L, x, y, open, wobble) {
    var box = C('#ff5f8f'), boxLo = C('#e04a78'), ribbon = C('#ffd93d'), ribLo = C('#ffb01a');
    // lid, which pops up and tips over as it opens
    var lidY = y - 12 - open * 22;
    var tilt = open * 6;
    stampOutlined(L, x + tilt * 0.6, lidY, function (b, bx, by) {
      b.rect(bx - 11, by - 2, 22, 5, box);
      b.rect(bx - 11, by - 2, 22, 2, C('#ff8fb8'));
      b.rect(bx - 1.5, by - 2, 3, 5, ribbon);
      b.disc(bx - 3.5, by - 5, 2.6, ribbon);
      b.disc(bx + 3.5, by - 5, 2.6, ribbon);
      b.rect(bx - 1.5, by - 6, 3, 3, ribLo);
    });
    if (open < 0.98) {
      stampOutlined(L, x + wobble, y, function (b, bx, by) {
        b.rect(bx - 10, by - 11, 20, 12, box);
        b.rect(bx - 10, by - 1, 20, 2, boxLo);
        b.rect(bx - 1.5, by - 11, 3, 13, ribbon);
      });
    }
  }

  /* A basket to curl up in once it is properly dark, drawn in two passes so
     the pet sits down inside it rather than on top of it. */
  function drawBedBack(L, x, y) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.ellipse(bx, by - 3, 15, 5, C('#e08aa8'));
      b.ellipse(bx, by - 4, 12.5, 3.6, C('#ffd9e6'));
      b.ellipse(bx, by - 4.4, 10, 2.6, C('#fff0f5'));
    });
  }

  /* Just the front lip of the basket, so the pet is tucked in behind it. */
  function drawBedFront(L, x, y) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.ellipse(bx, by, 15, 4.6, C('#e08aa8'));
      b.ellipse(bx, by - 0.6, 12.5, 3.2, C('#f0a8c0'));
      b.rect(bx - 16, by - 8, 32, 8, 0);          // keep only the bottom arc
    });
  }

  /* ------------------------------------------------------------------ */
  /* need bubble                                                         */
  /* ------------------------------------------------------------------ */
  /* Small hand-drawn versions of the care icons — the 16px UI icons are too
     chunky for a thought bubble at this room scale. */
  var NEED_ICON = {
    food: function (b, x, y) {
      b.disc(x, y + 1, 3, C('#ff5f5f'));
      b.ellipse(x - 1, y - 0.5, 1, 1.4, C('#ff9b9b'));
      b.rect(x, y - 4, 1, 2, C('#8a5a2a'));
      b.ellipse(x + 1.6, y - 3.4, 1.6, 0.9, C('#63c93f'));
    },
    water: function (b, x, y) {
      b.tri(x, y - 4, x - 2.6, y + 1, x + 2.6, y + 1, C('#5fc8ff'));
      b.disc(x, y + 1, 2.7, C('#5fc8ff'));
      b.set(x - 1, y + 1, C('#c8f0ff'));
    },
    fun: function (b, x, y) {
      b.disc(x, y, 3.2, C('#ff5f8f'));
      b.ellipse(x, y, 3.2, 0.8, C('#ffffff'));
      b.set(x - 1, y - 2, C('#ff8fb0'));
    },
    clean: function (b, x, y) {
      b.ellipse(x, y + 1.6, 3.4, 1.8, C('#5fc8ff'));
      b.ellipse(x, y + 1, 3, 1.3, C('#b6e6ff'));
      b.disc(x + 2.4, y - 2.4, 1.5, C('#eaf9ff'));
      b.disc(x - 2, y - 2, 1, C('#eaf9ff'));
    },
    groom: function (b, x, y) {
      b.line(x + 1, y - 1, x + 3.4, y - 3.6, C('#d9954f'), 2);
      b.ellipse(x - 1, y, 3, 1.9, C('#d9954f'));
      b.ellipse(x - 1, y - 0.6, 2.6, 1.2, C('#eab275'));
      for (var i = -3; i <= 1; i += 2) b.rect(x + i, y + 1.6, 1, 2, C('#fbf3e6'));
    }
  };

  function drawNeedBubble(L, x, y, need, t) {
    var pop = Math.sin(t * 4) * 0.6;
    stampOutlined(L, x, y + pop, function (b, bx, by) {
      b.ellipse(bx, by, 6.5, 6, C('#ffffff'));
      b.tri(bx - 3, by + 4.5, bx + 1.5, by + 4.5, bx - 1.5, by + 9, C('#ffffff'));
      (NEED_ICON[need] || NEED_ICON.food)(b, bx, by);
    });
  }

  /* ------------------------------------------------------------------ */
  /* dirt + tufts                                                        */
  /* ------------------------------------------------------------------ */
  function makeSpot(kind) {
    var m = Pets.metrics(Pets.stageFor(pet.growth).key);
    var onHead = Math.random() < 0.35;
    var a = Math.random() * Math.PI * 2;
    var r = kind === 'tuft' ? 0.55 + Math.random() * 0.35 : Math.sqrt(Math.random()) * 0.72;
    var cx = onHead ? m.cx : m.cx;
    var cy = onHead ? m.headCY : m.bodyCY;
    var rx = onHead ? m.headRX : m.bodyRX;
    var ry = onHead ? m.headRY : m.bodyRY;
    return {
      kind: kind,
      x: cx + Math.cos(a) * rx * r,
      y: cy + Math.sin(a) * ry * r,
      flip: Math.random() < 0.5
    };
  }

  function countSpots(kind) {
    var n = 0;
    for (var i = 0; i < rt.spots.length; i++) if (rt.spots[i].kind === kind) n++;
    return n;
  }

  /* Keeps the number of spots in step with the Clean and Brush stats, so the
     mess you can see always matches the gauges. */
  function syncSpots() {
    if (!pet) return;
    var want = {
      dirt: Math.floor((100 - pet.stats.clean) / DIRT_PER),
      tuft: Math.floor((100 - pet.stats.groom) / TUFT_PER)
    };
    ['dirt', 'tuft'].forEach(function (kind) {
      var have = countSpots(kind);
      while (have < want[kind]) { rt.spots.push(makeSpot(kind)); have++; }
      while (have > want[kind]) {
        for (var i = rt.spots.length - 1; i >= 0; i--) {
          if (rt.spots[i].kind === kind) { rt.spots.splice(i, 1); break; }
        }
        have--;
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* actions                                                             */
  /* ------------------------------------------------------------------ */
  function startAction(name) {
    if (!pet || rt.activity || rt.tool || rt.intro) return;
    var cfg = ACTIONS[name];
    if (!cfg) return;
    Sfx.init();

    // poking a sleeping pet into action is the rudest thing you can do
    if (rt.sleep) { wake(true); return; }
    if (rt.pooping) return;

    if (name === 'medicine' && !pet.sick) { say('I feel fine!', 1600); return; }
    if (name === 'play' && pet.sick) { say('I am too poorly to play…', 2200); Sfx.sad(); return; }

    if (cfg.stat && pet.stats[cfg.stat] > (cfg.kind === 'tool' ? 95 : 92)) {
      say(cfg.full);
      Sfx.sad();
      bumpLove(1);
      return;
    }

    if (cfg.kind === 'tool') return startTool(name);
    if (name === 'play') {
      el.gameWand.classList.toggle('hidden', !hasPrize('wand'));
      el.gameFrisbee.classList.toggle('hidden', !hasPrize('frisbee'));
      el.gamePicker.classList.add('show');
      return;
    }
    if (name === 'feed') { el.foodPicker.classList.add('show'); return; }
    if (name === 'water') { el.drinkPicker.classList.add('show'); return; }
    if (name === 'medicine') return startDose();

    rt.activity = { kind: name, t: 0, dur: cfg.dur, given: 0, beat: 0 };
    rt.props = {};
    refreshDock();
  }

  function updateActivity(dt) {
    var a = rt.activity;
    if (!a) return;
    var cfg = ACTIONS[a.kind];
    a.t += dt;
    var p = a.t / a.dur;

    var fillFrom = 0.25, fillTo = 0.8;
    var totalGain = a.gain !== undefined ? a.gain : (cfg.gain || 0);
    var want = totalGain * clamp((p - fillFrom) / (fillTo - fillFrom), 0, 1);
    if (want > a.given) {
      pet.stats[cfg.stat] = clamp(pet.stats[cfg.stat] + (want - a.given), 0, 100);
      a.given = want;
    }

    if (a.kind === 'medicine') {
      var slide = clamp(p / 0.2, 0, 1);
      var out = clamp((p - 0.84) / 0.16, 0, 1);
      rt.props.bottle = { x: (W + 12) - slide * (W / 2 + 30) + out * 30, y: room.groundY - 1 };
      if (p > 0.25 && p < 0.8) {
        rt.leanTarget = 3;
        var beat2 = Math.floor(a.t * 2.4);
        if (beat2 !== a.beat) {
          a.beat = beat2;
          Sfx.sip();
          spawn('sparkle', W / 2 + 6, room.groundY - 24, { vy: -10, max: 0.8 });
        }
      } else rt.leanTarget = 0;
      if (p > 0.8 && pet.sick) cure();
    }

    if (a.kind === 'feed' || a.kind === 'water') {
      var isFood = a.kind === 'feed';
      var slide = clamp(p / 0.18, 0, 1);
      var out = clamp((p - 0.86) / 0.14, 0, 1);
      var bowlX = W / 2 + 18;
      var propX = (W + 10) - slide * (W + 10 - bowlX) + out * 26;
      var left = clamp(1 - (p - fillFrom) / (fillTo - fillFrom), 0, 1);
      if (isFood && a.food !== 'meal') {
        rt.props.dish = { x: propX, y: room.groundY - 3, kind: a.food, left: left };
      } else {
        rt.props.bowl = {
          x: propX, y: room.groundY - 1,
          fill: isFood ? '#c98a4b' : (DRINKS[a.drink] || DRINKS.water).fill,
          level: clamp(left, 0.12, 1)
        };
      }
      if (p > 0.2 && p < 0.85) {
        rt.leanTarget = 4;
        var beat = Math.floor(a.t * (isFood ? 3.2 : 4));
        if (beat !== a.beat) {
          a.beat = beat;
          if (isFood) {
            Sfx.chomp();
            spawn('crumb', propX - 4, room.groundY - 6, { vx: -12, vy: -14, g: 60, max: 0.7 });
          } else {
            Sfx.sip();
            spawn('drop', propX - 3, room.groundY - 7, { vx: -6, vy: -12, g: 55, max: 0.6 });
          }
        }
      } else rt.leanTarget = 0;
    }

    if (a.kind === 'play') {
      if (a.game === 'ball') {
        var b = rt.props.ball;
        b.vy += 90 * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.spin += dt * 6;
        if (b.y > room.groundY - 5) {
          b.y = room.groundY - 5;
          b.vy = -Math.abs(b.vy) * 0.78;
          if (Math.abs(b.vy) < 12) b.vy = -46;
          Sfx.boing();
        }
        if (b.x < 8) { b.x = 8; b.vx = Math.abs(b.vx); }
        if (b.x > W - 8) { b.x = W - 8; b.vx = -Math.abs(b.vx); }
        rt.leanTarget = clamp((b.x - W / 2) * 0.16, -5, 5);
      } else if (a.game === 'bubble') {
        a.spawnT -= dt;
        if (a.spawnT <= 0) {
          a.spawnT = 0.42 + Math.random() * 0.3;
          rt.props.bubbles.push({
            x: 8 + Math.random() * (W - 16), y: room.groundY + 4,
            r: 3 + Math.random() * 1.8, vy: -(9 + Math.random() * 6), wob: Math.random() * 6
          });
        }
        var nearest = null;
        for (var i2 = rt.props.bubbles.length - 1; i2 >= 0; i2--) {
          var bb = rt.props.bubbles[i2];
          bb.y += bb.vy * dt;
          bb.x += Math.sin((a.t + bb.wob) * 2.2) * 0.35;
          if (bb.y < 10) { rt.props.bubbles.splice(i2, 1); continue; }
          if (!nearest || bb.y > nearest.y) nearest = bb;
        }
        if (nearest) rt.leanTarget = clamp((nearest.x - W / 2) * 0.14, -5, 5);
      } else if (a.game === 'treat') {
        updateTreatGame(dt);
        rt.leanTarget = 0;
      } else if (a.game === 'wand') {
        var wd = rt.props.wand;
        // until you take hold of it the wand waves itself about, so the game
        // is never just a still toy hanging in mid air
        if (!wd.touched) {
          wd.hx = W / 2 + Math.sin(a.t * 1.3) * (W * 0.24);
          wd.hy = room.groundY - 44 + Math.sin(a.t * 2.3) * 5;
        }
        // the toy chases the end of the string, so it swings as you move
        wd.vx += ((wd.hx - wd.tx) * 40 - wd.vx * 5) * dt;
        wd.vy += ((wd.hy + WAND_STRING - wd.ty) * 40 - wd.vy * 5) * dt;
        wd.tx += wd.vx * dt;
        wd.ty += wd.vy * dt;
        wd.tx = clamp(wd.tx, 5, W - 5);
        wd.ty = clamp(wd.ty, 6, room.groundY - 2);
        rt.leanTarget = clamp((wd.tx - W / 2) * 0.2, -5, 5);

        // your pet stalks it, and pounces once it is close enough for long enough
        wd.cool -= dt;
        var reach = Math.max(Math.abs(wd.tx - W / 2) / 17, Math.abs(wd.ty - (room.groundY - 28)) / 15);
        if (reach < 1 && wd.cool <= 0) {
          wd.charge += dt;
          if (wd.charge >= 0.35) {
            wd.charge = 0;
            wd.cool = 1;
            a.score++;
            rt.pounce = { t: 0, dir: wd.tx < W / 2 ? -1 : 1 };
            wd.vx += (wd.tx < W / 2 ? -1 : 1) * 70;
            wd.vy -= 45;
            pet.stats.fun = clamp(pet.stats.fun + GAMES.wand.per, 0, 100);
            addGrowth(0.5);
            bumpLove(2);
            Sfx.squeak();
            say('Got it!', 900);
            for (var wi = 0; wi < 4; wi++) {
              spawn(wi % 2 ? 'heart' : 'sparkle', wd.tx, wd.ty - 4,
                { vx: (Math.random() - 0.5) * 20, vy: -14, g: 26, max: 0.9 });
            }
          }
        } else if (wd.charge > 0) {
          wd.charge = Math.max(0, wd.charge - dt * 2);
        }
      } else if (a.game === 'frisbee') {
        var fr = rt.props.frisbee;
        fr.vy += 34 * dt;
        fr.x += fr.vx * dt;
        fr.y += fr.vy * dt;
        fr.spin += dt * 9;
        if (fr.y > room.groundY - 6) {            // skims off the floor
          fr.y = room.groundY - 6;
          fr.vy = -Math.abs(fr.vy) * 0.7 - 8;
        }
        if (fr.y < 8) { fr.y = 8; fr.vy = Math.abs(fr.vy); }
        if (fr.x < 9) { fr.x = 9; fr.vx = Math.abs(fr.vx); }
        if (fr.x > W - 9) { fr.x = W - 9; fr.vx = -Math.abs(fr.vx); }
        rt.leanTarget = clamp((fr.x - W / 2) * 0.16, -5, 5);
      }
      if (a.game !== 'treat' && Math.random() < dt * 3) {
        spawn('note', W / 2 + (Math.random() - 0.5) * 16, room.groundY - 30, { vy: -10, max: 1.2 });
      }
      // the bar counts up to the clean-sweep target, then just shows a star
      var gcfg = GAMES[a.game];
      el.toolText.textContent = gcfg.hint + '  ' + a.score +
        (a.score >= gcfg.perfect ? '  ★' : ' / ' + gcfg.perfect);
      if (a.dur > 0 && a.t >= a.dur) endGame();
      return;
    }

    if (a.t >= a.dur) {
      addGrowth(!cfg.stat ? 5 : pet.stats[cfg.stat] - totalGain < 55 ? 6 : 2.5);
      bumpLove(6);
      var tummy = false;
      if (a.kind === 'feed' && a.food) {
        var eaten = FOODS[a.food] || FOODS.meal;
        if (eaten.fun) pet.stats.fun = clamp(pet.stats.fun + eaten.fun, 0, 100);
        say(eaten.say);
      } else if (a.kind === 'water' && a.drink) {
        var drunk = DRINKS[a.drink] || DRINKS.water;
        if (drunk.fun) pet.stats.fun = clamp(pet.stats.fun + drunk.fun, 0, 100);
        tummy = countMilk(a.drink);
        if (!tummy) say(drunk.say);
      } else {
        say(cfg.done);
      }
      if (!tummy) {
        for (var i = 0; i < 5; i++) {
          spawn('heart', W / 2 + (Math.random() - 0.5) * 14, room.groundY - 28, { vy: -14, max: 1.2 });
        }
      }
      rt.activity = null;
      rt.props = {};
      rt.leanTarget = 0;
      refreshDock();
      save();
    }
  }

  /* ---------------- interactive tools: soap + brush ---------------- */
  function startTool(name) {
    var kind = name === 'bath' ? 'dirt' : 'tuft';
    syncSpots();
    if (name === 'brush' && countSpots('tuft') === 0) {
      pet.stats.groom = clamp(pet.stats.groom - TUFT_PER * 2, 0, 100);
      syncSpots();
    }
    if (name === 'bath') {
      // top the mud up so bath time is always a full three-step job
      while (countSpots('dirt') < BATH_MIN_DIRT) rt.spots.push(makeSpot('dirt'));
      rt.foam = [];
      rt.drips = [];
    }

    rt.tool = {
      kind: name, target: kind, step: 0, t: 0, cleared: 0,
      stepTime: 0, parked: true, popT: 0.45,
      startStat: pet.stats[ACTIONS[name].stat],
      x: 0, y: 0, down: false, finishing: 0
    };
    if (name === 'bath') {
      rt.props.tub = { x: W / 2, y: room.groundY + 1 };
      // the tub front hides the lower body, so float any dirt down there
      // back up to where it can actually be seen and scrubbed
      var m = Pets.metrics(Pets.stageFor(pet.growth).key);
      var topY = Pets.FEET - 9;
      for (var i = 0; i < rt.spots.length; i++) {
        var sp = rt.spots[i];
        if (sp.kind === 'dirt' && sp.y > topY) {
          sp.y = m.headCY + Math.random() * (topY - m.headCY - 2);
          sp.x = m.cx + (Math.random() - 0.5) * m.bodyRX * 1.5;
        }
      }
      Sfx.splash();
    }
    el.dock.classList.add('hide');
    el.toolBar.classList.add('show');
    el.toolMeter.classList.add('show');
    var park0 = parkSpot();
    rt.tool.x = park0.x;
    rt.tool.y = park0.y;
    el.toolText.textContent = name === 'bath' ? BATH_STEPS[0].grab : 'Grab the brush!';
    el.toolFill.style.height = '0%';
    setHint('');
  }

  /* Where the current tool waits until you pick it up. */
  function parkSpot() {
    return { x: Math.min(W - 10, W / 2 + 24), y: room.groundY - 5 };
  }

  function updateToolMeter() {
    var t = rt.tool;
    if (!t) return;
    el.toolFill.style.height = (clamp(t.stepTime / STEP_SECONDS, 0, 1) * 100).toFixed(1) + '%';
  }

  function stepCount() {
    return rt.tool && rt.tool.kind === 'bath' ? BATH_STEPS.length : 1;
  }

  /* Clean (or Brush) climbs steadily with how much of the job is done. */
  function applyToolProgress() {
    var t = rt.tool;
    if (!t) return;
    var key = ACTIONS[t.kind].stat;
    var done = (t.step + clamp(t.stepTime / STEP_SECONDS, 0, 1)) / stepCount();
    var target = t.startStat + (100 - t.startStat) * done;
    if (target > pet.stats[key]) pet.stats[key] = clamp(target, 0, 100);
  }

  function bathStep() {
    if (!rt.tool || rt.tool.kind !== 'bath') return null;
    return BATH_STEPS[rt.tool.step] || null;
  }

  function targetCount(kind) {
    if (kind === 'foam') return rt.foam.length;
    if (kind === 'drip') return rt.drips.length;
    return countSpots(kind);
  }

  /* Anything still on the pet when the clock runs out turns into whatever the
     next step deals with, so the pet always ends a step looking right: soapy
     after scrubbing, dripping after rinsing, spotless after drying. */
  function convertLeftovers(fromStep) {
    var i;
    if (fromStep === 0) {
      for (i = rt.spots.length - 1; i >= 0; i--) {
        if (rt.spots[i].kind === 'dirt') {
          rt.foam.push({ x: rt.spots[i].x, y: rt.spots[i].y, r: 1.9, life: 0 });
          rt.spots.splice(i, 1);
        }
      }
      while (rt.foam.length < 8) {
        var sp = makeSpot('dirt');
        rt.foam.push({ x: sp.x, y: Math.min(sp.y, Pets.FEET - 10), r: 1.9, life: 0 });
      }
    } else if (fromStep === 1) {
      for (i = rt.foam.length - 1; i >= 0; i--) {
        rt.drips.push({ x: rt.foam[i].x, y: rt.foam[i].y });
        rt.foam.splice(i, 1);
      }
      while (rt.drips.length < 7) {
        var sp2 = makeSpot('dirt');
        rt.drips.push({ x: sp2.x, y: Math.min(sp2.y, Pets.FEET - 10) });
      }
    } else {
      rt.drips.length = 0;
    }
  }

  function finishStep() {
    var t = rt.tool;
    if (!t || t.finishing) return;
    var park = parkSpot();

    // the tool you were using vanishes in a puff
    for (var i = 0; i < 7; i++) {
      spawn('poof', t.x + (Math.random() - 0.5) * 10, t.y + (Math.random() - 0.5) * 8,
        { vx: (Math.random() - 0.5) * 16, vy: -8 - Math.random() * 8, max: 0.8 });
    }
    Sfx.stepDone();

    if (t.kind !== 'bath') { t.finishing = 0.6; return; }

    convertLeftovers(t.step);
    t.step++;
    if (t.step >= BATH_STEPS.length) { t.finishing = 0.6; return; }

    t.target = BATH_STEPS[t.step].target;
    t.stepTime = 0;
    t.parked = true;
    t.down = false;
    t.popT = 0.45;
    t.x = park.x;
    t.y = park.y;
    el.toolFill.style.height = '0%';
    el.toolText.textContent = BATH_STEPS[t.step].grab;
    say(t.step === 1 ? 'All soapy!' : 'Nice and rinsed!', 1800);
    if (t.step === 1) Sfx.splash();
    // the next thing to use pops in beside the tub
    for (var k = 0; k < 6; k++) {
      spawn('sparkle', park.x + (Math.random() - 0.5) * 10, park.y - 4,
        { vx: (Math.random() - 0.5) * 12, vy: -10, max: 0.8 });
    }
  }

  function endTool(complete) {
    var t = rt.tool;
    if (!t) return;
    var cfg = ACTIONS[t.kind];
    if (complete) {
      pet.stats[cfg.stat] = 100;
      say(cfg.done);
      Sfx.ding();
      addGrowth(5);
      bumpLove(10);
      rt.shine = 1.6;
      for (var i = 0; i < 16; i++) {
        spawn('sparkle', W / 2 + (Math.random() - 0.5) * 30, room.groundY - 30 + Math.random() * 20,
          { vx: (Math.random() - 0.5) * 20, vy: -18 - Math.random() * 14, g: 26, max: 1.3 });
      }
    }
    rt.tool = null;
    rt.props = {};
    rt.drips = [];
    rt.leanTarget = 0;
    el.dock.classList.remove('hide');
    el.toolBar.classList.remove('show');
    el.toolMeter.classList.remove('show');
    refreshDock();
    syncSpots();
    save();
  }

  function scrubAt(x, y) {
    var t = rt.tool;
    if (!t || t.finishing || t.parked) return;
    var lx = x - (W / 2 - Pets.SIZE / 2);
    var ly = y - (room.groundY - Pets.FEET);
    var hit = false;
    var cfg = ACTIONS[t.kind];
    var i, k;

    function reward() {
      bumpLove(1);
      addGrowth(0.3);
    }
    void cfg;

    if (t.target === 'dirt' || t.target === 'tuft') {
      for (i = rt.spots.length - 1; i >= 0; i--) {
        var s = rt.spots[i];
        if (s.kind !== t.target) continue;
        if (Math.abs(s.x - lx) < 5 && Math.abs(s.y - ly) < 5) {
          rt.spots.splice(i, 1);
          t.cleared++;
          hit = true;
          if (t.target === 'dirt') {
            reward();
            rt.foam.push({ x: s.x, y: s.y, r: 1.9, life: 0 });
            for (k = 0; k < 3; k++) {
              spawn('bubble', x + (Math.random() - 0.5) * 6, y - 2, { vy: -12 - Math.random() * 8, max: 1.3 });
            }
          } else {
            reward();
            for (k = 0; k < 3; k++) {
              spawn('fluff', x + (Math.random() - 0.5) * 6, y - 2,
                { vx: (Math.random() - 0.5) * 14, vy: -10, g: 18, max: 0.9 });
            }
          }
          if (Math.random() < 0.5) spawn('heart', x, y - 4, { vy: -14, max: 1 });
        }
      }
    } else if (t.target === 'foam') {
      for (i = rt.foam.length - 1; i >= 0; i--) {
        var fm = rt.foam[i];
        if (Math.abs(fm.x - lx) < 5 && Math.abs(fm.y - ly) < 5) {
          rt.foam.splice(i, 1);
          rt.drips.push({ x: fm.x, y: fm.y });
          t.cleared++;
          hit = true;
          reward();
          for (k = 0; k < 3; k++) {
            spawn('drop', x + (Math.random() - 0.5) * 8, y,
              { vx: (Math.random() - 0.5) * 16, vy: 4 + Math.random() * 8, g: 60, max: 0.7 });
          }
        }
      }
    } else if (t.target === 'drip') {
      for (i = rt.drips.length - 1; i >= 0; i--) {
        var dr = rt.drips[i];
        if (Math.abs(dr.x - lx) < 5 && Math.abs(dr.y - ly) < 5) {
          rt.drips.splice(i, 1);
          t.cleared++;
          hit = true;
          reward();
          spawn('sparkle', x, y - 3, { vy: -10, max: 0.7 });
          if (Math.random() < 0.4) spawn('heart', x, y - 4, { vy: -14, max: 1 });
        }
      }
    }

    // scrubbing over the pet at all is pleasant even when nothing is there
    var overPetNow = Math.abs(lx - Pets.SIZE / 2) < 16 && ly > 4 && ly < Pets.FEET + 2;
    t.onPet = overPetNow;
    if (overPetNow) {
      rt.leanTarget = clamp((x - W / 2) * 0.22, -3, 3);
      if (t.kind !== 'bath') Sfx.swish();
      else if (t.step === 1) Sfx.splash();
      else Sfx.squeak();
      if (Math.random() < 0.12) {
        var puff = t.kind !== 'bath' ? 'fluff' : t.step === 1 ? 'drop' : 'bubble';
        spawn(puff, x + (Math.random() - 0.5) * 8, y - 3, { vy: t.step === 1 ? 6 : -9, g: t.step === 1 ? 40 : 0, max: 0.9 });
      }
    }

    void hit;
  }

  function updateTool(dt) {
    var t = rt.tool;
    if (!t) return;
    t.t += dt;
    if (t.popT > 0) t.popT -= dt;

    if (!t.parked && !t.finishing && t.down && t.onPet) {
      t.stepTime += dt;
      applyToolProgress();
      if (t.stepTime >= STEP_SECONDS) { t.stepTime = STEP_SECONDS; finishStep(); }
    }
    updateToolMeter();
    if (!t.parked && t.kind === 'bath' && t.step === 0 && Math.random() < dt * 5) {
      spawn('bubble', W / 2 + (Math.random() - 0.5) * 30, room.groundY - 10 - Math.random() * 6,
        { vy: -8 - Math.random() * 6, max: 1.5 });
    }
    if (t.finishing > 0) {
      t.finishing -= dt;
      if (t.finishing <= 0) endTool(true);
    }
  }

  /* ------------------------------------------------------------------ */
  /* unwrapping a new pet                                                */
  /* ------------------------------------------------------------------ */
  function startIntro() {
    rt.intro = { t: 0, open: 0, popped: false, done: false };
    setHint('Tap the present!');
    el.dock.classList.add('hide');
  }

  function updateIntro(dt) {
    var it = rt.intro;
    if (!it) return;
    it.t += dt;
    if (!it.popped) return;

    it.open = Math.min(1, it.open + dt * 2.2);
    if (it.t > 2.4) {
      rt.intro = null;
      el.dock.classList.remove('hide');
      say('Hi! I am ' + pet.name + '!', 2600);
      bumpLove(10);
      save();
    }
  }

  function popPresent() {
    var it = rt.intro;
    if (!it || it.popped) return;
    it.popped = true;
    it.t = 0;
    Sfx.unwrap();
    Sfx.grow();
    setHint('');
    for (var i = 0; i < 24; i++) {
      spawn(i % 2 ? 'sparkle' : 'heart', W / 2 + (Math.random() - 0.5) * 22, room.groundY - 16,
        { vx: (Math.random() - 0.5) * 34, vy: -22 - Math.random() * 20, g: 34, max: 1.5 });
    }
  }

  /* How high the pet is riding out of the box, 0 when it has landed. */
  function introLift() {
    var it = rt.intro;
    if (!it || !it.popped) return null;
    var t = it.t;
    if (t < 0.12) return 40;                       // still inside
    var k = clamp((t - 0.12) / 1.1, 0, 1);
    return Math.max(0, 26 * Math.sin(Math.PI * (1 - k)) * (1 - k) + (1 - k) * 6);
  }

  /* ------------------------------------------------------------------ */
  /* growth + love                                                       */
  /* ------------------------------------------------------------------ */
  function addGrowth(n) {
    var before = Pets.stageFor(pet.growth).key;
    pet.growth += n;
    var after = Pets.stageFor(pet.growth);
    pet.stage = after.key;
    if (after.key !== before) celebrate(after);
  }

  function bumpLove(n) { pet.love = clamp((pet.love || 0) + n, 0, 100); }

  /* ------------------------------------------------------------------ */
  /* DOM                                                                 */
  /* ------------------------------------------------------------------ */
  var el = {};
  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    ['scene', 'ui', 'petName', 'petStage', 'growthFill', 'hearts', 'speech', 'hint',
      'dock', 'toolBar', 'toolText', 'doneBtn', 'petsBtn', 'soundBtn', 'petsScreen',
      'petsClose', 'petGrid', 'startScreen', 'nameInput', 'startBtn', 'startBack',
      'confirmModal', 'confirmText', 'confirmYes', 'confirmNo', 'celebrate', 'celebrateText',
      'gamePicker', 'gameCancel', 'toolFill', 'medBtn', 'foodPicker', 'foodCancel',
      'drinkPicker', 'drinkCancel',
      'prizeScreen', 'prizeClose', 'prizeGrid', 'prizeSub', 'sleepBtn',
      'gameWand', 'gameFrisbee', 'toolMeter', 'prizePop'
    ].forEach(function (id) { el[id] = $(id); });

    el.actionBtns = Array.prototype.slice.call(document.querySelectorAll('[data-action]'));
    el.rings = {};
    el.actionBtns.forEach(function (b) {
      el.rings[b.dataset.action] = b.querySelector('.ring');
    });

    el.heartCanvases = [];
    for (var i = 0; i < 5; i++) {
      var c = document.createElement('canvas');
      el.hearts.appendChild(c);
      el.heartCanvases.push(c);
    }
  }

  var speechTimer = null;
  function say(text, ms) {
    el.speech.textContent = text;
    el.speech.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(function () { el.speech.classList.remove('show'); }, ms || 1900);
  }

  function setHint(text) { el.hint.textContent = text; }

  function celebrate(stage) {
    Sfx.grow();
    rt.growthFlash = 0.9;
    for (var i = 0; i < 26; i++) {
      spawn('sparkle', W / 2 + (Math.random() - 0.5) * 40, room.groundY - 34 + Math.random() * 26,
        { vx: (Math.random() - 0.5) * 26, vy: -20 - Math.random() * 20, g: 30, max: 1.6 });
    }
    el.celebrateText.innerHTML =
      '<div class="celebrate-emoji">🎉</div>' +
      '<div class="celebrate-title">' + escapeHtml(pet.name) + ' grew up!</div>' +
      '<div class="celebrate-sub">Now a ' + stage.label + ' ' + Pets.SPECIES[pet.species].label + '!</div>';
    el.celebrate.classList.add('show');
    setTimeout(function () { el.celebrate.classList.remove('show'); }, 2800);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function refreshDock() {
    var busy = !!(rt.activity || rt.tool || rt.dose);
    el.actionBtns.forEach(function (b) { b.disabled = busy; });
    var showMed = !!(pet && pet.sick);
    el.medBtn.classList.toggle('hidden', !showMed);
    el.dock.classList.toggle('six', showMed);
  }

  var uiClock = 0, lastHearts = -1;
  function updateUI(dt) {
    uiClock += dt;
    if (uiClock < 0.12) return;
    uiClock = 0;

    var sp = Pets.SPECIES[pet.species];
    var stage = Pets.stageFor(pet.growth);
    el.petName.textContent = pet.name;
    el.petStage.textContent = stage.label + ' ' + sp.label;

    var idx = Pets.stageIndex(stage.key);
    var next = Pets.STAGES[idx + 1];
    var pct = next ? (pet.growth - stage.growth) / (next.growth - stage.growth) * 100 : 100;
    el.growthFill.style.width = clamp(pct, 0, 100).toFixed(1) + '%';

    var lowest = null, lowVal = 101;
    el.actionBtns.forEach(function (b) {
      var k = ACTIONS[b.dataset.action].stat;
      if (!k) {           // medicine has no gauge of its own
        el.rings[b.dataset.action].style.setProperty('--p', '100');
        b.classList.toggle('wants', pet.sick && !rt.activity && !rt.tool && !rt.dose);
        return;
      }
      var v = pet.stats[k];
      el.rings[b.dataset.action].style.setProperty('--p', clamp(v, 0, 100).toFixed(0));
      b.classList.toggle('wants', v < 30 && !rt.activity && !rt.tool && !rt.dose && !pet.sick);
      if (v < lowVal) { lowVal = v; lowest = k; }
    });
    refreshDock();

    var hc = heartCount(pet);
    if (hc !== lastHearts) {
      lastHearts = hc;
      for (var i = 0; i < 5; i++) Icons.render(el.heartCanvases[i], i < hc ? 'heart' : 'heartEmpty', 13);
    }

    if (rt.intro) setHint(rt.intro.popped ? '' : 'Tap the present!');
    else if (!rt.tool && !rt.activity && !rt.dose) {
      if (rt.sleep) setHint('Shhh… your pet is asleep.');
      else if (pet.sick) setHint('Your pet is poorly — give it Medicine!');
      else if (rt.angry > 0) setHint('Uh oh — tap the moon to tuck it back in!');
      else if (pet.sickT > SICK_AFTER * 0.5) setHint("Your pet doesn't look well — feed it!");
      else if (pet.messes.length) setHint('Tap the mess to clean it up!');
      else if (pet.prizeNew > 0) setHint('A prize is in the toy box — tap it!');
      else if (db.plant >= PLANT_WILD) setHint('The plant needs a trim — tap it!');
      else if (lowVal < 30) setHint(HINTS[lowest]);
      else setHint('Stroke your pet to give it cuddles!');
    }
  }

  /* ------------------------------------------------------------------ */
  /* rendering                                                           */
  /* ------------------------------------------------------------------ */
  var bounds = null;

  function currentEyes() {
    if (rt.sleep) return 'sleep';
    if (pet.sick && !rt.activity && !rt.tool && !rt.petting) return 'sad';
    if (rt.angry > 0) return 'angry';
    if (rt.pooping) return 'blink';
    if (rt.petting || rt.tool) return 'happy';
    if (rt.blinking > 0) return 'blink';
    if (rt.activity) return 'open';
    var avg = avgStats(pet);
    if (avg < 32) return 'sad';
    if (avg > 78 && Math.sin(rt.t * 0.7) > 0.6) return 'happy';
    return 'open';
  }

  function currentMouth() {
    if (rt.sleep) return 'snooze';
    if (pet.sick && !rt.activity && !rt.tool) return 'frown';
    if (rt.angry > 0) return 'angry';
    if (rt.pooping) return 'snooze';
    if (rt.petting || rt.tool) return 'smile';
    var a = rt.activity;
    if (a && (a.kind === 'feed' || a.kind === 'water')) {
      var p = a.t / a.dur;
      if (p > 0.2 && p < 0.85) return (Math.floor(a.t * 3.4) % 2 === 0) ? 'open' : 'smile';
    }
    if (a && a.kind === 'play') return 'wide';
    if (!a && avgStats(pet) < 32) return 'frown';
    return 'smile';
  }

  function render() {
    var L = screen.layer;
    screen.clearMask();
    L.record(null);
    L.clear(C('#ffe6f2'));
    drawRoom(L, rt.t);
    L.ellipse(W / 2, room.groundY + 1, 13, 2.5, C('#e0b273'));

    // everything from here on is an object in the room, not the room itself,
    // so it is flagged to keep its own colours whatever the light is doing
    L.record(screen.mask);

    drawToyBoxGlow(L, rt.t);

    var inBed = rt.sleep && (sky.night > 0.45 || rt.sleep.byPlayer);
    if (inBed) drawBedBack(L, W / 2, room.groundY + 3);

    if (rt.props.tub) drawTub(L, rt.props.tub.x, rt.props.tub.y, true, rt.t);

    // messes behind the pet get drawn first so it can stand in front of them
    var mi;
    for (mi = 0; mi < pet.messes.length; mi++) {
      if (pet.messes[mi].ny < 0.4) {
        drawMess(L, pet.messes[mi], rt.t, rt.messAge[messKey(pet.messes[mi])] || 0);
      }
    }

    petLayer.clear();
    var bobAmp = rt.activity && rt.activity.kind === 'play' ? 1.8 : 0.8;
    if (rt.sleep) bobAmp = 0.5;
    var squat = rt.pooping ? Math.min(3, rt.pooping.t * 4) * (rt.pooping.t > 1.6 ? 0.3 : 1) : 0;
    var blitDY = inBed ? 3 : 0;
    var lift = introLift();
    if (lift !== null) blitDY -= lift;
    var wagSpeed = rt.angry > 0 ? 11 : (rt.petting || rt.tool ? 7 : rt.sleep ? 0.8 : 2.4);
    bounds = Pets.drawPet(petLayer, pet.species, Pets.stageFor(pet.growth).key, {
      bob: Math.sin(rt.bobPhase) * bobAmp + squat,
      lean: rt.lean,
      sleep: rt.sleep ? 1 : 0,
      tailWag: Math.sin(rt.t * wagSpeed) * (rt.angry > 0 ? 1.8 : rt.petting ? 1.4 : 1),
      earWig: Math.sin(rt.t * 3.1) * 0.5,
      eyes: currentEyes(),
      mouth: currentMouth(),
      spots: rt.spots,
      foam: rt.foam,
      drips: rt.drips,
      sick: pet.sick,
      hat: pet.hat,
      shine: rt.shine > 0 ? rt.shine : 0
    });
    // a pounce at the wand throws the whole pet toward the toy for a moment
    var lunge = rt.pounce ? Math.sin(clamp(rt.pounce.t / 0.4, 0, 1) * Math.PI) : 0;
    var petDX = rt.pounce ? rt.pounce.dir * 8 * lunge : 0;
    if (!rt.intro || rt.intro.popped) {
      L.blit(petLayer, Math.round(W / 2 - Pets.SIZE / 2 + petDX),
        Math.round(room.groundY - Pets.FEET + blitDY - lunge * 7));
    }
    if (inBed) drawBedFront(L, W / 2, room.groundY + 3);
    if (rt.intro) {
      drawPresent(L, W / 2, room.groundY, rt.intro.open,
        rt.intro.popped ? 0 : Math.sin(rt.t * 4) * 0.8);
    }

    // messes in front of the pet
    for (mi = 0; mi < pet.messes.length; mi++) {
      if (pet.messes[mi].ny >= 0.4) {
        drawMess(L, pet.messes[mi], rt.t, rt.messAge[messKey(pet.messes[mi])] || 0);
      }
    }

    if (rt.props.dish) drawDish(L, rt.props.dish.x, rt.props.dish.y, rt.props.dish.kind, rt.props.dish.left);
    if (rt.props.bottle) drawBottle(L, rt.props.bottle.x, rt.props.bottle.y);
    if (rt.props.bowl) drawBowl(L, rt.props.bowl.x, rt.props.bowl.y, rt.props.bowl.fill, rt.props.bowl.level);
    if (rt.props.tub) drawTub(L, rt.props.tub.x, rt.props.tub.y, false, rt.t);
    if (rt.props.ball) drawBall(L, rt.props.ball.x, rt.props.ball.y, rt.props.ball.spin);
    if (rt.props.wand) drawWand(L, rt.props.wand);
    drawDoseMeter(L);
    if (rt.props.frisbee) drawFrisbee(L, rt.props.frisbee.x, rt.props.frisbee.y, rt.props.frisbee.spin);
    if (rt.props.bubbles) {
      for (var bi = 0; bi < rt.props.bubbles.length; bi++) drawGameBubble(L, rt.props.bubbles[bi]);
    }
    if (rt.activity && rt.activity.game === 'treat' && rt.activity.cups) {
      var g = rt.activity;
      if (g.cups[g.treatCup].lift > 3) drawTreat(L, g.cups[g.treatCup].x, cupY());
      var order = [0, 1, 2].sort(function (a2, b2) { return g.cups[a2].lift - g.cups[b2].lift; });
      for (var ci = 0; ci < 3; ci++) {
        var cup = g.cups[order[ci]];
        drawCup(L, cup.x, cupY(), cup.lift);
      }
    }

    if (rt.prizeFly) {
      var fk = clamp(rt.prizeFly.t / 1.1, 0, 1);
      var fx2 = W / 2 + (8 - W / 2) * fk;
      var fy2 = (room.groundY - 30) + ((room.floorY - 3) - (room.groundY - 30)) * fk - Math.sin(fk * Math.PI) * 12;
      L.blit(Icons.layer(rt.prizeFly.icon), Math.round(fx2 - 8), Math.round(fy2 - 8));
    }

    drawParticles(L);

    if (rt.tool && !rt.tool.finishing) {
      var tl = rt.tool;
      var tx = tl.x, ty = tl.y;
      if (tl.parked) {
        var park = parkSpot();
        tx = park.x;
        ty = park.y + Math.sin(rt.t * 3) * 1.2;
        if (tl.popT > 0) ty -= tl.popT / 0.45 * 16;      // drops in from above
        L.ellipse(park.x, room.groundY + 1, 5, 1.5, C('#d9a869'));
      }
      var tilt = Math.sin(rt.t * 9) * (tl.down ? 1.2 : 0.3);
      var step = bathStep();
      if (!step) drawBrush(L, tx, ty, tilt);
      else if (step.tool === 'soap') drawSoap(L, tx, ty, tilt);
      else if (step.tool === 'shower') drawShower(L, tx, ty, tilt, tl.down && !tl.parked);
      else drawTowel(L, tx, ty, tilt);
    }

    if (!rt.activity && !rt.tool && !rt.sleep && !rt.angry) {
      var lowest = null, lv = 101;
      for (var i = 0; i < STAT_KEYS.length; i++) {
        if (pet.stats[STAT_KEYS[i]] < lv) { lv = pet.stats[STAT_KEYS[i]]; lowest = STAT_KEYS[i]; }
      }
      if (lv < 30) drawNeedBubble(L, W / 2 + 17, room.groundY - 42, lowest, rt.t);
    }

    if (rt.growthFlash > 0 && Math.floor(rt.growthFlash * 16) % 2 === 0) {
      var white = C('#ffffff');
      for (var y = 0; y < H; y++) for (var x = (y % 2); x < W; x += 2) L.set(x, y, white);
    }

    L.record(null);
    screen.present(sky.tint);
  }

  /* ------------------------------------------------------------------ */
  /* main loop                                                           */
  /* ------------------------------------------------------------------ */
  var last = 0, running = false, saveClock = 0, growthClock = 0;

  function frame(ts) {
    if (!running) return;
    var dt = Math.min(0.1, (ts - last) / 1000 || 0);
    last = ts;
    rt.t += dt;
    updateSky();

    // every pet ages; the one you are looking after ages fastest
    for (var i = 0; i < db.pets.length && !rt.intro; i++) {
      var p = db.pets[i];
      var busy = (p === pet) && (rt.activity || rt.tool);
      var rate = p === pet ? (busy ? 0 : 1) : IDLE_RATE;
      if (p === pet && rt.sleep) rate = 0.5;          // resting is restful
      if (rate > 0) {
        // a mess on the floor makes the room dirty much faster
        var messMult = 1 + (p.messes ? p.messes.length : 0) * 0.8;
        var illMult = p.sick ? SICK_DECAY : 1;
        for (var s = 0; s < STAT_KEYS.length; s++) {
          var k = STAT_KEYS[s];
          var r2 = rate * illMult * (k === 'clean' ? messMult : 1);
          p.stats[k] = clamp(p.stats[k] - DECAY[k] * dt * r2, 0, 100);
        }
      }
      updateSickness(p, dt, p === pet ? 1 : IDLE_RATE);
      if (p === pet && p.sick && Math.random() < dt * 0.7) {
        spawn('sick', W / 2 + (Math.random() < 0.5 ? -11 : 11), room.groundY - 34,
          { vy: -7, max: 1.4 });
      }
      if (p !== pet) p.love = clamp((p.love || 0) - dt * 0.5, 0, 100);
    }
    pet.love = clamp((pet.love || 0) - dt * 1.6, 0, 100);

    db.plant = clamp(db.plant + dt / PLANT_FULL * 100, 0, 100);
    if (!rt.intro) checkPrize();
    if (rt.prizeFly) { rt.prizeFly.t += dt; if (rt.prizeFly.t > 1.1) rt.prizeFly = null; }
    if (rt.pounce) { rt.pounce.t += dt; if (rt.pounce.t > 0.4) rt.pounce = null; }

    growthClock += dt;
    if (growthClock > 10) {
      growthClock = 0;
      if (avgStats(pet) > 55) addGrowth(0.6);
    }

    rt.bobPhase += dt * (rt.sleep ? 0.9 : rt.activity && rt.activity.kind === 'play' ? 7 : 2.2);
    rt.lean += (rt.leanTarget - rt.lean) * Math.min(1, dt * 6);
    if (rt.blinking > 0) rt.blinking -= dt;
    else if (rt.t > rt.blinkAt) { rt.blinking = 0.14; rt.blinkAt = rt.t + 2 + Math.random() * 3.5; }
    if (rt.sleep) rt.blinking = 0;
    if (rt.growthFlash > 0) rt.growthFlash -= dt;
    if (rt.shine > 0) rt.shine -= dt * 0.5;

    // foam dries off after the bath
    for (var f = rt.foam.length - 1; f >= 0; f--) {
      rt.foam[f].life += dt;
      if (!rt.tool || rt.tool.kind !== 'bath') rt.foam[f].r -= dt * 0.7;
      if (rt.foam[f].r <= 0.4) rt.foam.splice(f, 1);
    }
    if (!rt.tool && rt.drips.length && Math.random() < dt * 2) rt.drips.pop();

    if (rt.petting) {
      if (rt.t - rt.lastHeart > 0.28) {
        rt.lastHeart = rt.t;
        spawn('heart', W / 2 + (Math.random() - 0.5) * 18, room.groundY - 32, { vy: -16, max: 1.1 });
        bumpLove(5);
        pet.stats.fun = clamp(pet.stats.fun + 1.2, 0, 100);
        addGrowth(0.25);
        pet.cuddles = (pet.cuddles || 0) + 1;
        rt.petStreak++;
        if (rt.petStreak >= 7 && rt.t - rt.lastDelight > 14) {
          rt.petStreak = 0;
          rt.lastDelight = rt.t;
          Sfx.delight(pet.species);
          say(HAPPY_SAY[pet.species] || 'Purrrrr!', 2000);
          bumpLove(14);
          addGrowth(1.5);
          for (var hb = 0; hb < 10; hb++) {
            spawn('heart', W / 2 + (Math.random() - 0.5) * 24, room.groundY - 34,
              { vx: (Math.random() - 0.5) * 24, vy: -18 - Math.random() * 12, max: 1.4 });
          }
        } else {
          Sfx.purr();
        }
      }
    }

    updateIntro(dt);
    maybeSleep(dt);
    updateSleep(dt);
    updateAngry(dt);
    updateMesses(dt);
    updatePooping(dt);
    updateActivity(dt);
    updateDose(dt);
    updateTool(dt);
    if (!rt.tool) syncSpots();
    updateParticles(dt);
    updateUI(dt);
    render();

    saveClock += dt;
    if (saveClock > 5) { saveClock = 0; save(); }

    requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ */
  /* input                                                               */
  /* ------------------------------------------------------------------ */
  function sceneCoords(ev) {
    var r = el.scene.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) / r.width * W,
      y: (ev.clientY - r.top) / r.height * H
    };
  }

  function overPet(p) {
    var top = bounds ? (room.groundY - Pets.FEET) + bounds.top - 2 : room.groundY - 40;
    return p.x > W / 2 - 18 && p.x < W / 2 + 18 && p.y > top && p.y < room.groundY + 3;
  }

  function bindScene() {
    var canvas = el.scene;

    canvas.addEventListener('pointerdown', function (ev) {
      Sfx.init();
      if (!pet) return;
      canvas.setPointerCapture(ev.pointerId);
      var p = sceneCoords(ev);

      if (rt.intro) { popPresent(); return; }

      // stopping the medicine meter takes a tap anywhere, so small fingers
      // do not have to hit the bar itself
      if (rt.dose) { tapDose(); return; }

      if (rt.tool) {
        if (rt.tool.parked) {
          rt.tool.parked = false;
          rt.tool.popT = 0;
          Sfx.pickup();
          el.toolText.textContent = rt.tool.kind === 'bath'
            ? BATH_STEPS[rt.tool.step].text : 'Swipe to brush the fur!';
        }
        rt.tool.down = true;
        rt.tool.x = p.x;
        rt.tool.y = p.y;
        scrubAt(p.x, p.y);
        return;
      }
      // mini games
      if (rt.activity && rt.activity.kind === 'play') {
        var g = rt.activity;
        if (g.game === 'ball' && rt.props.ball) {
          var b = rt.props.ball;
          if (Math.abs(p.x - b.x) < 9 && Math.abs(p.y - b.y) < 9) {
            b.vy = -70;
            b.vx = (b.x < W / 2 ? 1 : -1) * (18 + Math.random() * 16);
            g.score++;
            pet.stats.fun = clamp(pet.stats.fun + GAMES.ball.per, 0, 100);
            addGrowth(0.4);
            Sfx.boing();
            spawn('sparkle', b.x, b.y - 4, { vy: -12, max: 0.6 });
          }
          return;
        }
        if (g.game === 'bubble' && rt.props.bubbles) {
          for (var bi = rt.props.bubbles.length - 1; bi >= 0; bi--) {
            var bb = rt.props.bubbles[bi];
            if (Math.abs(p.x - bb.x) < bb.r + 4 && Math.abs(p.y - bb.y) < bb.r + 4) {
              rt.props.bubbles.splice(bi, 1);
              g.score++;
              pet.stats.fun = clamp(pet.stats.fun + GAMES.bubble.per, 0, 100);
              addGrowth(0.35);
              Sfx.pop();
              for (var pi = 0; pi < 4; pi++) {
                spawn('sparkle', bb.x + (Math.random() - 0.5) * 6, bb.y,
                  { vx: (Math.random() - 0.5) * 22, vy: -8 - Math.random() * 10, g: 30, max: 0.6 });
              }
              break;
            }
          }
          return;
        }
        if (g.game === 'wand' && rt.props.wand) { moveWand(p); return; }
        if (g.game === 'frisbee' && rt.props.frisbee) {
          var fr2 = rt.props.frisbee;
          if (Math.abs(p.x - fr2.x) < 10 && Math.abs(p.y - fr2.y) < 9) {
            fr2.vx = (fr2.x < W / 2 ? 1 : -1) * (28 + Math.random() * 16);
            fr2.vy = -26;
            g.score++;
            pet.stats.fun = clamp(pet.stats.fun + GAMES.frisbee.per, 0, 100);
            addGrowth(0.45);
            Sfx.whoosh();
            spawn('sparkle', fr2.x, fr2.y, { vy: -12, max: 0.6 });
          }
          return;
        }
        if (g.game === 'treat') { pickCup(p.x, p.y); return; }
        return;
      }

      // tidy up an accident, or give the plant a haircut
      if (!rt.tool && cleanMessAt(p.x, p.y)) return;
      if (!rt.tool && !rt.activity && trimPlant(p.x, p.y)) return;
      if (!rt.tool && !rt.activity && tapToyBox(p.x, p.y)) return;
      if (!rt.tool && !rt.activity && tapPicture(p.x, p.y)) return;

      // a sleeping pet does not want to be prodded
      if (rt.sleep) {
        if (overPet(p)) wake(true);
        return;
      }
      if (rt.angry > 0) {
        if (overPet(p)) { say('Hmph!', 1200); Sfx.growl(); }
        return;
      }
      if (rt.pooping) return;

      if (!rt.activity && overPet(p)) {
        rt.petting = true;
        rt.lastHeart = -1;
        rt.leanTarget = clamp((p.x - W / 2) * 0.3, -3, 3);
      }
    });

    canvas.addEventListener('pointermove', function (ev) {
      if (!pet) return;
      var p = sceneCoords(ev);
      if (rt.tool) {
        rt.tool.x = p.x;
        rt.tool.y = p.y;
        if (rt.tool.down) scrubAt(p.x, p.y);
        return;
      }
      if (rt.props.wand) { moveWand(p); return; }
      if (!rt.petting) return;
      if (!overPet(p)) { stopPetting(); return; }
      rt.leanTarget = clamp((p.x - W / 2) * 0.3, -3, 3);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      canvas.addEventListener(t, function () {
        if (rt.tool) { rt.tool.down = false; rt.tool.onPet = false; rt.leanTarget = 0; }
        stopPetting();
      });
    });
  }

  function stopPetting() {
    if (!rt.petting) return;
    rt.petting = false;
    rt.petStreak = 0;
    if (!rt.activity && !rt.tool) rt.leanTarget = 0;
    save();
  }

  function bindButtons() {
    el.actionBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        Sfx.click();
        startAction(b.dataset.action);
      });
    });

    el.doneBtn.addEventListener('click', function () {
      Sfx.click();
      if (rt.dose) cancelDose();
      else if (rt.activity && rt.activity.kind === 'play') endGame();
      else endTool(false);
    });

    var gameCards = document.querySelectorAll('.game-card');
    for (var gi = 0; gi < gameCards.length; gi++) {
      (function (card) {
        card.addEventListener('click', function () {
          Sfx.click();
          startGame(card.dataset.game);
        });
      })(gameCards[gi]);
    }
    el.gameCancel.addEventListener('click', function () {
      Sfx.click();
      el.gamePicker.classList.remove('show');
    });

    var foodCards = document.querySelectorAll('.food-card');
    for (var fi = 0; fi < foodCards.length; fi++) {
      (function (card) {
        card.addEventListener('click', function () {
          Sfx.click();
          startFeeding(card.dataset.food);
        });
      })(foodCards[fi]);
    }
    el.foodCancel.addEventListener('click', function () {
      Sfx.click();
      el.foodPicker.classList.remove('show');
    });

    var drinkCards = document.querySelectorAll('.drink-card');
    for (var di = 0; di < drinkCards.length; di++) {
      (function (card) {
        card.addEventListener('click', function () {
          Sfx.click();
          startDrinking(card.dataset.drink);
        });
      })(drinkCards[di]);
    }
    el.drinkCancel.addEventListener('click', function () {
      Sfx.click();
      el.drinkPicker.classList.remove('show');
    });

    el.soundBtn.addEventListener('click', function () {
      Sfx.on = !Sfx.on;
      Sfx.init();
      Icons.render(el.soundBtn.querySelector('canvas'), Sfx.on ? 'soundOn' : 'soundOff', 26);
      el.soundBtn.setAttribute('aria-label', Sfx.on ? 'Turn sound off' : 'Turn sound on');
      if (Sfx.on) Sfx.click();
      try { localStorage.setItem('pixelpals.sound', Sfx.on ? '1' : '0'); } catch (e) { }
    });

    el.petsBtn.addEventListener('click', function () {
      Sfx.init();
      Sfx.click();
      openPets();
    });
    el.petsClose.addEventListener('click', function () {
      Sfx.click();
      el.petsScreen.classList.add('hidden');
    });
    el.prizeClose.addEventListener('click', function () {
      Sfx.click();
      el.prizeScreen.classList.add('hidden');
    });
    el.sleepBtn.addEventListener('click', function () {
      Sfx.init();
      Sfx.click();
      tuckIn();
    });

    el.celebrate.addEventListener('click', function () { el.celebrate.classList.remove('show'); });
  }

  /* ------------------------------------------------------------------ */
  /* my pets                                                             */
  /* ------------------------------------------------------------------ */
  function openPets() {
    el.petGrid.innerHTML = '';
    db.pets.forEach(function (p) {
      var card = document.createElement('button');
      card.className = 'pet-card' + (p.id === db.activeId ? ' active' : '');

      var canvas = document.createElement('canvas');
      canvas.className = 'thumb';
      card.appendChild(canvas);

      var name = document.createElement('span');
      name.className = 'pc-name';
      name.textContent = p.name;
      card.appendChild(name);

      var stage = document.createElement('span');
      stage.className = 'pc-stage';
      stage.textContent = Pets.stageFor(p.growth).label + ' ' + Pets.SPECIES[p.species].label;
      card.appendChild(stage);

      var hearts = document.createElement('span');
      hearts.className = 'pc-hearts';
      var hc = heartCount(p);
      for (var i = 0; i < 5; i++) {
        var h = document.createElement('canvas');
        hearts.appendChild(h);
        Icons.render(h, i < hc ? 'heart' : 'heartEmpty', 12);
      }
      card.appendChild(hearts);

      card.addEventListener('click', function () {
        Sfx.click();
        switchTo(p.id);
        el.petsScreen.classList.add('hidden');
      });

      if (db.pets.length > 1) {
        var del = document.createElement('span');
        del.className = 'pc-del';
        del.setAttribute('role', 'button');
        del.setAttribute('aria-label', 'Say goodbye to ' + p.name);
        del.tabIndex = 0;
        del.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); del.click(); }
        });
        var dc = document.createElement('canvas');
        del.appendChild(dc);
        Icons.render(dc, 'trash', 16);
        del.addEventListener('click', function (ev) {
          ev.stopPropagation();
          Sfx.click();
          askConfirm('Say goodbye to ' + p.name + '?', function () { removePet(p.id); openPets(); });
        });
        card.appendChild(del);
      }

      el.petGrid.appendChild(card);

      // thumbnail
      var scr = new PX.Screen(canvas, 48, 48);
      var L = new PX.Layer(Pets.SIZE, Pets.SIZE);
      Pets.drawPet(L, p.species, Pets.stageFor(p.growth).key,
        { eyes: 'open', mouth: 'smile', hat: p.hat });
      var tsp = Pets.SPECIES[p.species] || Pets.SPECIES.cat;
      scr.layer.clear(C(tsp.thumbBg));
      scr.layer.ellipse(24, 44, 15, 3, C(tsp.thumbShade));
      scr.layer.blit(L, Math.round((48 - Pets.SIZE) / 2), 48 - Pets.FEET - 3);
      scr.present();
    });

    if (db.pets.length < MAX_PETS) {
      var add = document.createElement('button');
      add.className = 'pet-card add';
      var ac = document.createElement('canvas');
      add.appendChild(ac);
      Icons.render(ac, 'plus', 40);
      var lbl = document.createElement('span');
      lbl.className = 'pc-name';
      lbl.textContent = 'New pet';
      add.appendChild(lbl);
      add.addEventListener('click', function () {
        Sfx.click();
        el.petsScreen.classList.add('hidden');
        showStartScreen(true);
      });
      el.petGrid.appendChild(add);
    }

    el.petsScreen.classList.remove('hidden');
  }

  /* Tapping a toy in the box gets it straight out and starts its game, so a
     player never has to close the box and go back through the Play menu. */
  function playWithToy(pz) {
    if (rt.intro || rt.tool || rt.activity || rt.dose) { say('Let me finish this first!', 1800); return; }
    if (rt.sleep) { wake(true); return; }
    if (pet.sick) { say('I am too poorly to play…', 2200); Sfx.sad(); return; }
    startGame(pz.game);
  }

  var PRIZE_USE = {
    hat: 'Tap to wear', toy: 'Tap to play', picture: 'Tap to hang up',
    wallpaper: 'Tap to put up', plant: 'Tap to pot it', banner: 'Tap to hang up'
  };
  var PRIZE_ON = {
    hat: 'Wearing it', toy: 'Tap to play', picture: 'On the wall',
    wallpaper: 'On the walls', plant: 'In the pot', banner: 'Up on the wall'
  };
  // which field on the pet each kind of decoration is remembered in
  var PRIZE_SLOT = {
    hat: 'hat', picture: 'picture', wallpaper: 'wallpaper',
    plant: 'plantStyle', banner: 'banner'
  };
  var PUT_UP = {
    hat: 'How do I look?', picture: 'Look at my new picture!',
    wallpaper: 'What a spooky room!', plant: 'A prickly new friend!',
    banner: 'Spooky!'
  };
  var PUT_AWAY = {
    hat: 'Hat off!', picture: 'Back to the old one!',
    wallpaper: 'Back to the old walls!', plant: 'My plant is back!',
    banner: 'Back to the old banner!'
  };

  function prizeInUse(pz) {
    var slot = PRIZE_SLOT[pz.kind];
    return !!(pet && slot && pet[slot] === pz.id);
  }

  /* Tapping a prize uses it there and then and shuts the box, so you can see
     what it did instead of having to close up first. */
  function usePrize(pz) {
    el.prizeScreen.classList.add('hidden');
    if (pz.kind === 'toy') { playWithToy(pz); return; }

    var wearing = prizeInUse(pz);
    pet[PRIZE_SLOT[pz.kind]] = wearing ? null : pz.id;
    say(wearing ? PUT_AWAY[pz.kind] : PUT_UP[pz.kind], 2000);
    Sfx.ding();
    for (var i = 0; i < 6; i++) {
      spawn('sparkle', W / 2 + (Math.random() - 0.5) * 26, room.groundY - 30,
        { vx: (Math.random() - 0.5) * 18, vy: -14, g: 26, max: 0.9 });
    }
    bumpLove(2);
    save();
  }

  function openPrizes() {
    pet.prizeNew = 0;
    save();
    el.prizeGrid.innerHTML = '';
    var owned = pet.prizes.length;
    el.prizeSub.textContent = owned
      ? pet.name + ' has ' + owned + ' of ' + PRIZES.length +
        ' — tap one to use it straight away'
      : pet.name + ' has not won anything yet. Top up two meters at once, ' +
        'or do well in a game, to win a prize!';

    PRIZES.forEach(function (pz) {
      var got = hasPrize(pz.id);
      var on = prizeInUse(pz);
      var card = document.createElement(got ? 'button' : 'div');
      card.className = 'prize-card' + (got ? '' : ' locked') + (on ? ' worn' : '');

      var canvas = document.createElement('canvas');
      card.appendChild(canvas);

      var name = document.createElement('span');
      name.className = 'pz-name';
      name.textContent = got ? pz.label : '???';
      card.appendChild(name);

      var tag = document.createElement('span');
      tag.className = 'pz-tag';
      tag.textContent = !got ? 'Not won yet' : on ? PRIZE_ON[pz.kind] : PRIZE_USE[pz.kind];
      card.appendChild(tag);

      el.prizeGrid.appendChild(card);
      Icons.render(canvas, got ? pz.icon : 'lock', 52);

      if (got) {
        card.addEventListener('click', function () {
          Sfx.click();
          usePrize(pz);
        });
      }
    });

    el.prizeScreen.classList.remove('hidden');
  }

  function switchTo(id) {
    var p = byId(id);
    if (!p || p === pet) return;
    if (rt.tool) endTool(false);
    if (rt.dose) cancelDose();
    rt.activity = null;
    rt.props = {};
    rt.particles = [];
    rt.foam = [];
    rt.drips = [];
    rt.spots = [];
    rt.shine = 0;
    rt.sleep = null;
    rt.angry = 0;
    rt.pooping = null;
    rt.messAge = {};
    rt.messTimer = 40 + Math.random() * 50;
    db.activeId = id;
    pet = p;
    applyAway(pet);
    syncSpots();
    lastHearts = -1;
    refreshDock();
    save();
    say('Hi again!', 1600);
  }

  function removePet(id) {
    db.pets = db.pets.filter(function (p) { return p.id !== id; });
    if (!db.pets.length) {
      pet = null;
      running = false;
      save();
      showStartScreen(false);
      return;
    }
    if (db.activeId === id) {
      db.activeId = db.pets[0].id;
      pet = db.pets[0];
      rt.spots = [];
      syncSpots();
    }
    save();
  }

  var confirmAction = null;
  function askConfirm(text, fn) {
    el.confirmText.textContent = text;
    confirmAction = fn;
    el.confirmModal.classList.add('show');
  }

  /* ------------------------------------------------------------------ */
  /* new pet screen                                                      */
  /* ------------------------------------------------------------------ */
  var NAMES = {
    cat: ['Mochi', 'Biscuit', 'Pumpkin', 'Nimbus', 'Waffles', 'Pickle', 'Sushi', 'Muffin'],
    fox: ['Ember', 'Ginger', 'Maple', 'Sunny', 'Pepper', 'Clementine', 'Rusty', 'Nutmeg'],
    blackcat: ['Shadow', 'Midnight', 'Onyx', 'Luna', 'Binx', 'Sooty', 'Pepper', 'Olive'],
    dog: ['Spot', 'Domino', 'Patch', 'Buddy', 'Freckle', 'Pongo', 'Cookie', 'Dot']
  };

  var picked = 'fox';
  var previews = [];
  var previewRAF = null;

  function setupPreviews() {
    ['cat', 'fox', 'blackcat', 'dog'].forEach(function (id) {
      var canvas = document.getElementById('preview-' + id);
      if (!canvas) return;
      previews.push({
        id: id,
        scr: new PX.Screen(canvas, 48, 48),
        layer: new PX.Layer(Pets.SIZE, Pets.SIZE),
        phase: Math.random() * 6
      });
    });
  }

  function previewLoop(ts) {
    var t = ts / 1000;
    for (var i = 0; i < previews.length; i++) {
      var pv = previews[i];
      var L = pv.scr.layer;
      var psp = Pets.SPECIES[pv.id];
      L.clear(C(psp.thumbBg));
      L.ellipse(24, 44, 15, 3, C(psp.thumbShade));
      pv.layer.clear();
      Pets.drawPet(pv.layer, pv.id, 'baby', {
        bob: Math.sin(t * 2.4 + pv.phase) * 0.9,
        tailWag: Math.sin(t * 3 + pv.phase),
        eyes: Math.sin(t * 1.3 + pv.phase) > 0.985 ? 'blink' : 'open',
        mouth: 'smile'
      });
      L.blit(pv.layer, Math.round((48 - Pets.SIZE) / 2), 48 - Pets.FEET - 3);
      pv.scr.present();
    }
    previewRAF = requestAnimationFrame(previewLoop);
  }

  function showStartScreen(canGoBack) {
    el.startScreen.classList.remove('hidden');
    el.startBack.classList.toggle('hidden', !canGoBack);
    if (!previewRAF) previewRAF = requestAnimationFrame(previewLoop);
    selectSpecies(picked);
  }

  function hideStartScreen() {
    el.startScreen.classList.add('hidden');
    if (previewRAF) { cancelAnimationFrame(previewRAF); previewRAF = null; }
    el.nameInput.value = '';
  }

  function selectSpecies(id) {
    picked = id;
    var cards = document.querySelectorAll('.pick-card');
    for (var i = 0; i < cards.length; i++) {
      var on = cards[i].dataset.species === id;
      cards[i].classList.toggle('selected', on);
      cards[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }
    var pool = NAMES[id];
    el.nameInput.placeholder = pool[Math.floor(Math.random() * pool.length)];
  }

  function bindStartScreen() {
    var cards = document.querySelectorAll('.pick-card');
    for (var i = 0; i < cards.length; i++) {
      (function (card) {
        card.addEventListener('click', function () {
          Sfx.init();
          Sfx.click();
          selectSpecies(card.dataset.species);
        });
      })(cards[i]);
    }

    el.startBtn.addEventListener('click', function () {
      Sfx.init();
      Sfx.click();
      var name = (el.nameInput.value || '').trim().slice(0, 14) || el.nameInput.placeholder;
      var p = newPet(picked, name);
      db.pets.push(p);
      db.activeId = p.id;
      pet = p;
      rt.spots = [];
      rt.foam = [];
      rt.particles = [];
      lastHearts = -1;
      hideStartScreen();
      save();
      startLoop();
      startIntro();
    });

    el.startBack.addEventListener('click', function () {
      Sfx.click();
      hideStartScreen();
      if (pet) openPets();
    });

    el.nameInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') el.startBtn.click();
    });
  }

  function startLoop() {
    syncSpots();
    refreshDock();
    sizeScene();
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  function boot() {
    cacheDom();
    updateSky();
    Icons.renderAll(document);

    try { Sfx.on = localStorage.getItem('pixelpals.sound') !== '0'; } catch (e) { }
    Icons.render(el.soundBtn.querySelector('canvas'), Sfx.on ? 'soundOn' : 'soundOff', 26);

    sizeScene();
    setupPreviews();
    bindStartScreen();
    bindButtons();
    bindScene();

    el.confirmNo.addEventListener('click', function () {
      Sfx.click();
      confirmAction = null;
      el.confirmModal.classList.remove('show');
    });
    el.confirmYes.addEventListener('click', function () {
      Sfx.click();
      el.confirmModal.classList.remove('show');
      if (confirmAction) confirmAction();
      confirmAction = null;
    });

    window.addEventListener('resize', sizeScene);
    window.addEventListener('orientationchange', function () { setTimeout(sizeScene, 200); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { save(); return; }
      if (!pet) return;
      var away = applyAway(pet);
      db.pets.forEach(function (p) { if (p !== pet) applyAway(p); });
      syncSpots();
      if (away > 120) say('I missed you!', 2400);
    });

    if (load()) {
      pet = byId(db.activeId) || db.pets[0];
      db.activeId = pet.id;
      var away = 0;
      db.pets.forEach(function (p) {
        var a = applyAway(p);
        if (p === pet) away = a;
      });
      startLoop();
      setTimeout(function () {
        say(away > 120 ? 'I missed you! ' + greeting() : greeting(), 2600);
      }, 400);
    } else {
      showStartScreen(false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
