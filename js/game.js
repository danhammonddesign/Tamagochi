/* game.js — the little world: room, props, particles, care actions, growth. */
(function () {
  'use strict';

  var C = PX.C;
  var W = 88, H = 64;          // logical scene size in pixels
  var GROUND = 55;             // y where the pet's feet rest
  var SAVE_KEY = 'pixelpals.save.v1';
  var MAX_OFFLINE = 3 * 3600;  // cap how much decay happens while away (seconds)

  /* ------------------------------------------------------------------ */
  /* sound                                                               */
  /* ------------------------------------------------------------------ */
  var Sfx = {
    ctx: null,
    on: true,
    lastPurr: 0,
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
    purr: function () {
      var now = Date.now();
      if (now - this.lastPurr < 260) return;
      this.lastPurr = now;
      this.tone(150, 0.18, 'triangle', 0.05, 0, 130);
    },
    grow: function () {
      var notes = [523, 659, 784, 1046];
      for (var i = 0; i < notes.length; i++) this.tone(notes[i], 0.22, 'square', 0.055, i * 0.12);
    },
    sad: function () { this.tone(330, 0.25, 'sine', 0.045, 0, 200); }
  };

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  var STAT_KEYS = ['food', 'water', 'fun', 'clean'];
  var DECAY = { food: 100 / 420, water: 100 / 360, fun: 100 / 330, clean: 100 / 700 };

  var ACTIONS = {
    feed: { dur: 4.6, stat: 'food', gain: 38, done: 'Yum yum!', full: "I'm so full!" },
    drink: { dur: 4.0, stat: 'water', gain: 42, done: 'Glug glug!', full: 'Not thirsty!' },
    play: { dur: 6.5, stat: 'fun', gain: 45, done: 'That was fun!', full: 'Played out!' },
    bath: { dur: 5.6, stat: 'clean', gain: 60, done: 'Squeaky clean!', full: "I'm already clean!" }
  };

  var state = null;

  function freshState(species, name) {
    return {
      species: species,
      name: name,
      growth: 0,
      stage: 'baby',
      stats: { food: 70, water: 70, fun: 70, clean: 80 },
      love: 40,
      born: Date.now(),
      saved: Date.now(),
      pets: 0
    };
  }

  function save() {
    if (!state) return;
    state.saved = Date.now();
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.species || !s.stats) return null;
      for (var i = 0; i < STAT_KEYS.length; i++) {
        var k = STAT_KEYS[i];
        if (typeof s.stats[k] !== 'number') s.stats[k] = 60;
      }
      return s;
    } catch (e) { return null; }
  }

  function applyAway(s) {
    var away = Math.max(0, (Date.now() - (s.saved || Date.now())) / 1000);
    var used = Math.min(away, MAX_OFFLINE);
    if (used < 20) return 0;
    for (var i = 0; i < STAT_KEYS.length; i++) {
      var k = STAT_KEYS[i];
      s.stats[k] = clamp(s.stats[k] - DECAY[k] * used * 0.55, 8, 100);
    }
    s.love = clamp((s.love || 0) - used * 0.02, 0, 100);
    return away;
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function avgStats() {
    var t = 0;
    for (var i = 0; i < STAT_KEYS.length; i++) t += state.stats[STAT_KEYS[i]];
    return t / STAT_KEYS.length;
  }

  /* ------------------------------------------------------------------ */
  /* runtime (not persisted)                                             */
  /* ------------------------------------------------------------------ */
  var rt = {
    t: 0,
    blinkAt: 2,
    blinking: 0,
    lean: 0,
    leanTarget: 0,
    bobPhase: 0,
    activity: null,
    particles: [],
    props: {},
    petting: false,
    petHold: 0,
    lastHeart: 0,
    speech: null,
    needPulse: 0,
    growthFlash: 0
  };

  /* ------------------------------------------------------------------ */
  /* particles                                                           */
  /* ------------------------------------------------------------------ */
  function spawn(kind, x, y, opts) {
    opts = opts || {};
    rt.particles.push({
      kind: kind, x: x, y: y,
      vx: opts.vx !== undefined ? opts.vx : (Math.random() - 0.5) * 8,
      vy: opts.vy !== undefined ? opts.vy : -(8 + Math.random() * 8),
      g: opts.g !== undefined ? opts.g : 0,
      life: 0,
      max: opts.max || 1.1,
      wob: Math.random() * 6
    });
  }

  var PARTICLE_ART = {
    heart: { rows: Pets.HEART, color: '#ff5f8f' },
    sparkle: { rows: ['.#.', '###', '.#.'], color: '#fff3a8' },
    bubble: { rows: ['.##.', '####', '####', '.##.'], color: '#d6f2ff' },
    crumb: { rows: ['##', '##'], color: '#c98a4b' },
    drop: { rows: ['.#.', '###', '.#.'], color: '#7fd8ff' },
    note: { rows: ['..#', '..#', '###', '.##'], color: '#5f4bb6' },
    zzz: { rows: ['###', '..#', '###'], color: '#8f9bd6' },
    foam: { rows: ['.##.', '####', '.##.'], color: '#ffffff' }
  };

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
      // blink out near the end
      if (p.life > p.max * 0.75 && Math.floor(p.life * 14) % 2 === 0) continue;
      L.stamp(art.rows, { '#': C(art.color) }, Math.round(p.x), Math.round(p.y));
    }
  }

  /* ------------------------------------------------------------------ */
  /* outlined stamps                                                     */
  /* ------------------------------------------------------------------ */
  /* Anything that needs its own black outline has to be drawn on a scratch
     layer first — outline() only fills empty pixels, and the scene layer is
     completely covered by the room. */
  var fx = new PX.Layer(44, 44);
  function stampOutlined(L, x, y, draw) {
    fx.clear();
    draw(fx, 22, 22);
    fx.outline(C('#141014'));
    L.blit(fx, Math.round(x) - 22, Math.round(y) - 22);
  }

  /* ------------------------------------------------------------------ */
  /* room                                                                */
  /* ------------------------------------------------------------------ */
  function drawRoom(L, t) {
    var wall = C('#ffe6f2'), wallLow = C('#ffd0e6'), trim = C('#f2a8cc');
    var floor = C('#f6cf95'), plank = C('#e0b273'), floorEdge = C('#c99a5f');

    L.rect(0, 0, W, 45, wall);
    L.rect(0, 33, W, 12, wallLow);
    L.rect(0, 32, W, 1, trim);
    L.rect(0, 44, W, 1, floorEdge);
    L.rect(0, 45, W, H - 45, floor);
    for (var x = 3; x < W; x += 11) L.rect(x, 45, 1, H - 45, plank);
    L.rect(0, 50, W, 1, plank);

    // rug
    L.ellipse(44, 57, 31, 6, C('#bfe9ff'));
    L.ellipse(44, 57, 22, 4, C('#9adcf8'));
    L.ellipse(44, 57, 12, 2, C('#bfe9ff'));

    // window — sky and clouds first, then the frame paints back over any spill
    L.rect(9, 7, 20, 18, C('#a8e0ff'));
    L.disc(24, 12, 3.5, C('#ffe98a'));
    var cx1 = 12 + ((t * 2) % 15);
    L.ellipse(cx1, 18, 4, 2, C('#ffffff'));
    L.ellipse(cx1 + 2, 17, 2.5, 1.5, C('#ffffff'));
    var cx2 = 12 + ((t * 1.3 + 8) % 15);
    L.ellipse(cx2, 10, 3, 1.4, C('#ffffff'));
    var frame = C('#ffffff');
    L.rect(7, 5, 24, 2, frame);
    L.rect(7, 25, 24, 2, frame);
    L.rect(7, 5, 2, 22, frame);
    L.rect(29, 5, 2, 22, frame);
    L.rect(18, 7, 1, 18, frame);
    L.rect(9, 15, 20, 1, frame);

    // heart picture on the wall
    L.rect(52, 8, 13, 12, C('#f7b955'));
    L.rect(54, 10, 9, 8, C('#fff6e0'));
    L.stamp(Pets.HEART, { '#': C('#ff6f9c') }, 56, 11);

    // potted plant
    L.rect(74, 36, 9, 8, C('#e58f6a'));
    L.rect(73, 34, 11, 3, C('#f2a682'));
    L.disc(78, 30, 4, C('#7ed957'));
    L.disc(74, 32, 3, C('#63c93f'));
    L.disc(82, 32, 3, C('#63c93f'));
    L.disc(78, 26, 2.5, C('#8ee86a'));

    // toy box in the corner
    L.rect(2, 36, 12, 8, C('#9ad0ff'));
    L.rect(2, 36, 12, 2, C('#77b8f0'));
    L.disc(6, 41, 1.6, C('#ff8fb0'));
    L.disc(10, 41, 1.6, C('#ffe07a'));
  }

  /* ------------------------------------------------------------------ */
  /* props                                                               */
  /* ------------------------------------------------------------------ */
  function drawBowl(L, x, y, fill, level) {
    stampOutlined(L, x, y, function (b, bx, by) {
      var rim = C('#ff8a5c'), body = C('#e56b40');
      // bowl, then the hollow, then whatever is in it
      b.ellipse(bx, by, 7, 3, body);
      b.rect(bx - 7, by - 2, 14, 2, body);
      b.ellipse(bx, by + 2, 6, 1.6, C('#c4552f'));
      b.ellipse(bx, by - 2, 8, 2.6, rim);
      b.ellipse(bx, by - 2.4, 6.4, 1.8, C('#c4552f'));
      if (level > 0) {
        if (fill === '#c98a4b') {
          var k = C(fill), kl = C('#e0a566');
          for (var i = 0; i < 5; i++) {
            var kx = bx - 4.4 + i * 2.2;
            var ky = by - 3 - (i % 2) * 1.1 - level * 1.1;
            b.disc(kx, ky, 1.5, i % 2 ? k : kl);
          }
        } else {
          b.ellipse(bx, by - 2.6, 6.2 * level, 1.7 * level, C(fill));
          b.ellipse(bx - 2, by - 3, 1.6 * level, 0.7 * level, C('#d6f2ff'));
        }
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
        var bxx = x - 13 + i * 5 + Math.sin(t * 2 + i) * 1.2;
        L.disc(bxx, y - 4, 2.2, C('#ffffff'));
        L.set(bxx - 1, y - 5, C('#eaf6ff'));
      }
      // rubber duck
      var dx = x + 11 + Math.sin(t * 1.6) * 1.5, dy = y - 7;
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

  /* ------------------------------------------------------------------ */
  /* need bubble                                                         */
  /* ------------------------------------------------------------------ */
  var NEED_ICON = {
    food: function (L, x, y) {
      L.disc(x, y + 1, 3.2, C('#ff5f5f'));
      L.disc(x - 1, y, 1.2, C('#ff9b9b'));
      L.rect(x, y - 4, 1, 2, C('#8a5a2a'));
      L.ellipse(x + 2, y - 3, 2, 1, C('#63c93f'));
    },
    water: function (L, x, y) {
      L.tri(x, y - 4, x - 3, y + 1, x + 3, y + 1, C('#5fc8ff'));
      L.disc(x, y + 1, 3, C('#5fc8ff'));
      L.set(x - 1, y + 1, C('#c8f0ff'));
    },
    fun: function (L, x, y) {
      L.disc(x, y, 3.4, C('#ff5f8f'));
      L.line(x - 3, y, x + 3, y, C('#ffffff'), 1);
    },
    clean: function (L, x, y) {
      L.rect(x - 4, y - 1, 8, 5, C('#7fd0ff'));
      L.rect(x - 4, y - 1, 8, 2, C('#b6e6ff'));
      L.disc(x + 3, y - 4, 1.8, C('#5fc8ff'));
      L.set(x + 2, y - 5, C('#eaf9ff'));
    }
  };

  function drawNeedBubble(L, x, y, need, t) {
    var pop = Math.sin(t * 4) * 0.6;
    stampOutlined(L, x, y + pop, function (b, bx, by) {
      b.ellipse(bx, by, 8, 7, C('#ffffff'));
      b.tri(bx - 3, by + 6, bx + 2, by + 6, bx - 1, by + 11, C('#ffffff'));
      (NEED_ICON[need] || NEED_ICON.food)(b, bx, by);
    });
  }

  /* ------------------------------------------------------------------ */
  /* activities                                                          */
  /* ------------------------------------------------------------------ */
  function startActivity(kind) {
    if (rt.activity) return;
    var cfg = ACTIONS[kind];
    if (!cfg) return;
    Sfx.init();

    if (state.stats[cfg.stat] > 92) {
      say(cfg.full);
      Sfx.sad();
      bumpLove(1);
      return;
    }

    rt.activity = { kind: kind, t: 0, dur: cfg.dur, given: 0, beat: 0, taps: 0 };
    rt.props = {};

    if (kind === 'play') {
      rt.props.ball = { x: 66, y: 12, vx: -16, vy: 0, spin: 0 };
      Sfx.boing();
    }
    if (kind === 'bath') Sfx.splash();
    setButtonsBusy(true);
  }

  function updateActivity(dt) {
    var a = rt.activity;
    if (!a) return;
    var cfg = ACTIONS[a.kind];
    a.t += dt;
    var p = a.t / a.dur;

    // feed the stat in gradually over the middle of the animation
    var fillFrom = 0.25, fillTo = 0.8;
    var want = cfg.gain * clamp((p - fillFrom) / (fillTo - fillFrom), 0, 1);
    var delta = want - a.given;
    if (delta > 0) {
      state.stats[cfg.stat] = clamp(state.stats[cfg.stat] + delta, 0, 100);
      a.given = want;
    }

    var petX = W / 2;

    if (a.kind === 'feed' || a.kind === 'drink') {
      var isFood = a.kind === 'feed';
      var slide = clamp(p / 0.18, 0, 1);
      var out = clamp((p - 0.86) / 0.14, 0, 1);
      rt.props.bowl = {
        x: 90 - slide * 26 + out * 26,
        y: GROUND - 1,
        fill: isFood ? '#c98a4b' : '#7fd8ff',
        level: clamp(1 - (p - fillFrom) / (fillTo - fillFrom), 0.12, 1)
      };
      if (p > 0.2 && p < 0.85) {
        rt.leanTarget = 4;
        var beat = Math.floor(a.t * (isFood ? 3.2 : 4));
        if (beat !== a.beat) {
          a.beat = beat;
          if (isFood) {
            Sfx.chomp();
            spawn('crumb', rt.props.bowl.x - 4, GROUND - 6, { vx: -10 - Math.random() * 8, vy: -14, g: 60, max: 0.7 });
          } else {
            Sfx.sip();
            spawn('drop', rt.props.bowl.x - 3, GROUND - 7, { vx: -6, vy: -12, g: 55, max: 0.6 });
          }
        }
      } else {
        rt.leanTarget = 0;
      }
    }

    if (a.kind === 'play') {
      var b = rt.props.ball;
      b.vy += 90 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.spin += dt * 6;
      if (b.y > GROUND - 5) { b.y = GROUND - 5; b.vy = -Math.abs(b.vy) * 0.78; if (Math.abs(b.vy) < 12) b.vy = -46; Sfx.boing(); }
      if (b.x < 12) { b.x = 12; b.vx = Math.abs(b.vx); }
      if (b.x > 78) { b.x = 78; b.vx = -Math.abs(b.vx); }
      rt.leanTarget = clamp((b.x - petX) * 0.16, -5, 5);
      if (Math.random() < dt * 3) spawn('note', petX + (Math.random() - 0.5) * 16, 28, { vy: -10, max: 1.2 });
    }

    if (a.kind === 'bath') {
      rt.props.tub = { x: W / 2, y: GROUND + 1 };
      rt.leanTarget = Math.sin(a.t * 7) * 2.2;
      if (Math.random() < dt * 14) {
        spawn('bubble', W / 2 + (Math.random() - 0.5) * 30, GROUND - 8 - Math.random() * 6, { vy: -9 - Math.random() * 7, max: 1.5 });
      }
      if (p > 0.7 && Math.random() < dt * 8) {
        spawn('sparkle', W / 2 + (Math.random() - 0.5) * 26, 24 + Math.random() * 18, { vy: -4, max: 0.7 });
      }
    }

    if (a.t >= a.dur) {
      var wasLow = state.stats[cfg.stat] - cfg.gain < 55;
      addGrowth(wasLow ? 6 : 2.5);
      bumpLove(6);
      say(cfg.done);
      for (var i = 0; i < 5; i++) {
        spawn('heart', W / 2 + (Math.random() - 0.5) * 14, 30, { vy: -14 - Math.random() * 8, max: 1.2 });
      }
      rt.activity = null;
      rt.props = {};
      rt.leanTarget = 0;
      setButtonsBusy(false);
      save();
    }
  }

  function tapScene(lx, ly) {
    var a = rt.activity;
    if (a && a.kind === 'play' && rt.props.ball) {
      var b = rt.props.ball;
      if (Math.abs(lx - b.x) < 8 && Math.abs(ly - b.y) < 8) {
        b.vy = -70;
        b.vx = (b.x < W / 2 ? 1 : -1) * (18 + Math.random() * 16);
        a.taps++;
        state.stats.fun = clamp(state.stats.fun + 3, 0, 100);
        addGrowth(0.4);
        Sfx.boing();
        spawn('sparkle', b.x, b.y - 4, { vy: -12, max: 0.6 });
        return true;
      }
    }
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* growth + love                                                       */
  /* ------------------------------------------------------------------ */
  function addGrowth(n) {
    var before = Pets.stageFor(state.growth).key;
    state.growth += n;
    var after = Pets.stageFor(state.growth);
    if (after.key !== before) {
      state.stage = after.key;
      celebrate(after);
    }
    state.stage = after.key;
  }

  function bumpLove(n) { state.love = clamp((state.love || 0) + n, 0, 100); }

  /* ------------------------------------------------------------------ */
  /* DOM                                                                 */
  /* ------------------------------------------------------------------ */
  var el = {};
  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    ['scene', 'petName', 'petStage', 'petEmoji', 'growthFill', 'growthLabel', 'hearts',
      'speech', 'hint', 'soundBtn', 'resetBtn', 'startScreen', 'nameInput', 'startBtn',
      'game', 'celebrate', 'celebrateText', 'confirmModal', 'confirmYes', 'confirmNo',
      'welcomeBack'].forEach(function (id) { el[id] = $(id); });
    el.bars = {};
    STAT_KEYS.forEach(function (k) {
      el.bars[k] = { fill: $('bar-' + k), box: $('stat-' + k) };
    });
    el.actionBtns = Array.prototype.slice.call(document.querySelectorAll('[data-action]'));
  }

  function setButtonsBusy(busy) {
    el.actionBtns.forEach(function (b) {
      b.disabled = busy;
      b.classList.toggle('is-busy', busy);
    });
  }

  var speechTimer = null;
  function say(text, ms) {
    el.speech.textContent = text;
    el.speech.classList.add('show');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(function () { el.speech.classList.remove('show'); }, ms || 1900);
  }

  function celebrate(stage) {
    Sfx.grow();
    rt.growthFlash = 0.9;
    for (var i = 0; i < 26; i++) {
      spawn('sparkle', W / 2 + (Math.random() - 0.5) * 40, 20 + Math.random() * 26,
        { vx: (Math.random() - 0.5) * 26, vy: -20 - Math.random() * 20, g: 30, max: 1.6 });
    }
    el.celebrateText.innerHTML =
      '<div class="celebrate-emoji">🎉</div>' +
      '<div class="celebrate-title">' + escapeHtml(state.name) + ' grew up!</div>' +
      '<div class="celebrate-sub">Now a ' + stage.label + ' ' + Pets.SPECIES[state.species].label + '!</div>';
    el.celebrate.classList.add('show');
    setTimeout(function () { el.celebrate.classList.remove('show'); }, 2800);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var uiClock = 0;
  function updateUI(dt) {
    uiClock += dt;
    if (uiClock < 0.12) return;
    uiClock = 0;

    var sp = Pets.SPECIES[state.species];
    var stage = Pets.stageFor(state.growth);
    el.petName.textContent = state.name;
    el.petStage.textContent = stage.label + ' ' + sp.label;
    el.petEmoji.textContent = sp.emoji;

    // growth bar toward the next stage
    var idx = Pets.stageIndex(stage.key);
    var next = Pets.STAGES[idx + 1];
    var pct, label;
    if (next) {
      pct = (state.growth - stage.growth) / (next.growth - stage.growth) * 100;
      label = 'Growing to ' + next.label;
    } else {
      pct = 100;
      label = 'All grown up!';
    }
    el.growthFill.style.width = clamp(pct, 0, 100).toFixed(1) + '%';
    el.growthLabel.textContent = label;

    var lowest = null, lowestVal = 101;
    STAT_KEYS.forEach(function (k) {
      var v = state.stats[k];
      el.bars[k].fill.style.width = clamp(v, 0, 100).toFixed(1) + '%';
      el.bars[k].box.classList.toggle('is-low', v < 30);
      if (v < lowestVal) { lowestVal = v; lowest = k; }
    });

    el.actionBtns.forEach(function (b) {
      var k = ACTIONS[b.dataset.action].stat;
      b.classList.toggle('wants', state.stats[k] < 30 && !rt.activity);
    });

    // hearts
    var happy = avgStats() * 0.75 + (state.love || 0) * 0.25;
    var full = Math.round(clamp(happy, 0, 100) / 20);
    var h = '';
    for (var i = 0; i < 5; i++) h += '<span class="' + (i < full ? 'on' : 'off') + '">' + (i < full ? '💗' : '🤍') + '</span>';
    if (el.hearts.dataset.v !== String(full)) {
      el.hearts.innerHTML = h;
      el.hearts.dataset.v = String(full);
    }

    if (!rt.activity && lowestVal < 30) {
      el.hint.textContent = HINTS[lowest];
    } else if (!rt.activity) {
      el.hint.textContent = 'Tap and stroke your pet to give it cuddles! 💕';
    }
    return lowest;
  }

  var HINTS = {
    food: 'Your pet looks hungry — tap Feed! 🍎',
    water: 'Your pet is thirsty — tap Water! 💧',
    fun: 'Your pet is bored — tap Play! 🎾',
    clean: 'Your pet is dirty — tap Bath! 🛁'
  };

  /* ------------------------------------------------------------------ */
  /* rendering                                                           */
  /* ------------------------------------------------------------------ */
  var screen, petLayer, bounds = null;

  function currentEyes() {
    var a = rt.activity;
    if (rt.petting) return 'happy';
    if (rt.blinking > 0) return 'blink';
    if (a) {
      if (a.kind === 'bath') return 'happy';
      if (a.kind === 'play') return 'open';
      return 'open';
    }
    var avg = avgStats();
    if (avg < 32) return 'sad';
    if (avg > 78 && Math.sin(rt.t * 0.7) > 0.6) return 'happy';
    return 'open';
  }

  function currentMouth() {
    var a = rt.activity;
    if (rt.petting) return 'smile';
    if (a && (a.kind === 'feed' || a.kind === 'drink')) {
      var p = a.t / a.dur;
      if (p > 0.2 && p < 0.85) return (Math.floor(a.t * 3.4) % 2 === 0) ? 'open' : 'smile';
    }
    if (a && a.kind === 'play') return 'wide';
    if (!a && avgStats() < 32) return 'frown';
    return 'smile';
  }

  function render() {
    var L = screen.layer;
    L.clear(C('#ffe6f2'));
    drawRoom(L, rt.t);

    // props behind the pet
    if (rt.props.tub) drawTub(L, rt.props.tub.x, rt.props.tub.y, true, rt.t);

    // pet shadow
    L.ellipse(W / 2, GROUND + 1, 13, 2.5, C('#e0b273'));

    petLayer.clear();
    var bobAmp = rt.activity && rt.activity.kind === 'play' ? 1.8 : 0.8;
    var bob = Math.sin(rt.bobPhase) * bobAmp;
    bounds = Pets.drawPet(petLayer, state.species, Pets.stageFor(state.growth).key, {
      bob: bob,
      lean: rt.lean,
      tailWag: Math.sin(rt.t * (rt.petting ? 7 : 2.4)) * (rt.petting ? 1.4 : 1),
      earWig: Math.sin(rt.t * 3.1) * 0.5,
      eyes: currentEyes(),
      mouth: currentMouth(),
      dirty: state.stats.clean < 55 ? clamp((55 - state.stats.clean) / 50, 0, 1) : 0
    });
    var petOX = Math.round(W / 2 - Pets.SIZE / 2);
    var petOY = Math.round(GROUND - Pets.FEET);
    L.blit(petLayer, petOX, petOY);

    // props in front of the pet
    if (rt.props.bowl) drawBowl(L, rt.props.bowl.x, rt.props.bowl.y, rt.props.bowl.fill, rt.props.bowl.level);
    if (rt.props.tub) drawTub(L, rt.props.tub.x, rt.props.tub.y, false, rt.t);
    if (rt.props.ball) drawBall(L, rt.props.ball.x, rt.props.ball.y, rt.props.ball.spin);

    drawParticles(L);

    // need bubble
    if (!rt.activity) {
      var lowest = null, lv = 101;
      for (var i = 0; i < STAT_KEYS.length; i++) {
        if (state.stats[STAT_KEYS[i]] < lv) { lv = state.stats[STAT_KEYS[i]]; lowest = STAT_KEYS[i]; }
      }
      if (lv < 30) drawNeedBubble(L, W / 2 + 17, 18, lowest, rt.t);
    }

    // grow-up flash
    if (rt.growthFlash > 0 && Math.floor(rt.growthFlash * 16) % 2 === 0) {
      var white = C('#ffffff');
      for (var y = 0; y < H; y++) {
        for (var x = 0; x < W; x++) {
          if ((x + y) % 2 === 0) L.set(x, y, white);
        }
      }
    }

    screen.present();
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

    // decay
    if (!rt.activity) {
      for (var i = 0; i < STAT_KEYS.length; i++) {
        var k = STAT_KEYS[i];
        state.stats[k] = clamp(state.stats[k] - DECAY[k] * dt, 0, 100);
      }
    }
    state.love = clamp((state.love || 0) - dt * 1.6, 0, 100);

    // slow passive growth while the pet is well cared for
    growthClock += dt;
    if (growthClock > 10) {
      growthClock = 0;
      if (avgStats() > 55) addGrowth(0.6);
    }

    // idle animation
    rt.bobPhase += dt * (rt.activity && rt.activity.kind === 'play' ? 7 : 2.2);
    rt.lean += (rt.leanTarget - rt.lean) * Math.min(1, dt * 6);
    if (rt.blinking > 0) rt.blinking -= dt;
    else if (rt.t > rt.blinkAt) { rt.blinking = 0.14; rt.blinkAt = rt.t + 2 + Math.random() * 3.5; }
    if (rt.growthFlash > 0) rt.growthFlash -= dt;

    // petting
    if (rt.petting) {
      rt.petHold += dt;
      if (rt.t - rt.lastHeart > 0.28) {
        rt.lastHeart = rt.t;
        spawn('heart', W / 2 + (Math.random() - 0.5) * 18, 26 + Math.random() * 6, { vy: -16, max: 1.1 });
        bumpLove(5);
        state.stats.fun = clamp(state.stats.fun + 1.2, 0, 100);
        addGrowth(0.25);
        state.pets = (state.pets || 0) + 1;
        Sfx.purr();
      }
    }

    updateActivity(dt);
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
    var ox = W / 2, oy = GROUND - Pets.FEET;
    var top = bounds ? oy + bounds.top - 2 : 20;
    return p.x > ox - 18 && p.x < ox + 18 && p.y > top && p.y < GROUND + 3;
  }

  function bindScene() {
    var canvas = el.scene;

    canvas.addEventListener('pointerdown', function (ev) {
      Sfx.init();
      canvas.setPointerCapture(ev.pointerId);
      var p = sceneCoords(ev);
      if (tapScene(p.x, p.y)) return;
      if (overPet(p)) {
        rt.petting = true;
        rt.petHold = 0;
        rt.lastHeart = -1;
        rt.leanTarget = clamp((p.x - W / 2) * 0.3, -3, 3);
      }
    });

    canvas.addEventListener('pointermove', function (ev) {
      if (!rt.petting) return;
      var p = sceneCoords(ev);
      if (!overPet(p)) { stopPetting(); return; }
      rt.leanTarget = clamp((p.x - W / 2) * 0.3, -3, 3);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      canvas.addEventListener(t, stopPetting);
    });
  }

  function stopPetting() {
    if (!rt.petting) return;
    rt.petting = false;
    if (!rt.activity) rt.leanTarget = 0;
    save();
  }

  function bindButtons() {
    el.actionBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        Sfx.click();
        startActivity(b.dataset.action);
      });
    });

    el.soundBtn.addEventListener('click', function () {
      Sfx.on = !Sfx.on;
      Sfx.init();
      el.soundBtn.textContent = Sfx.on ? '🔊' : '🔇';
      el.soundBtn.setAttribute('aria-label', Sfx.on ? 'Turn sound off' : 'Turn sound on');
      if (Sfx.on) Sfx.click();
      try { localStorage.setItem('pixelpals.sound', Sfx.on ? '1' : '0'); } catch (e) { }
    });

    el.resetBtn.addEventListener('click', function () {
      Sfx.click();
      el.confirmModal.classList.add('show');
    });
    el.confirmNo.addEventListener('click', function () {
      Sfx.click();
      el.confirmModal.classList.remove('show');
    });
    el.confirmYes.addEventListener('click', function () {
      Sfx.click();
      el.confirmModal.classList.remove('show');
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
      running = false;
      state = null;
      showStartScreen();
    });

    el.celebrate.addEventListener('click', function () {
      el.celebrate.classList.remove('show');
    });
  }

  /* ------------------------------------------------------------------ */
  /* start screen                                                        */
  /* ------------------------------------------------------------------ */
  var NAMES = {
    cat: ['Mochi', 'Biscuit', 'Pumpkin', 'Nimbus', 'Waffles', 'Pickle', 'Sushi', 'Muffin'],
    fox: ['Ember', 'Ginger', 'Maple', 'Sunny', 'Pepper', 'Clementine', 'Rusty', 'Nutmeg']
  };

  var picked = 'fox';
  var previews = [];

  function setupPreviews() {
    ['cat', 'fox'].forEach(function (id) {
      var canvas = document.getElementById('preview-' + id);
      if (!canvas) return;
      var scr = new PX.Screen(canvas, 44, 44);
      previews.push({ id: id, scr: scr, layer: new PX.Layer(Pets.SIZE, Pets.SIZE), phase: Math.random() * 6 });
    });
  }

  function renderPreviews(t) {
    for (var i = 0; i < previews.length; i++) {
      var pv = previews[i];
      var L = pv.scr.layer;
      L.clear(C(pv.id === 'fox' ? '#fff0e0' : '#eef1f8'));
      L.ellipse(22, 40, 15, 3, C(pv.id === 'fox' ? '#ffe0c0' : '#dfe4f0'));
      pv.layer.clear();
      var blink = (Math.sin(t * 1.3 + pv.phase) > 0.985);
      Pets.drawPet(pv.layer, pv.id, 'baby', {
        bob: Math.sin(t * 2.4 + pv.phase) * 0.9,
        tailWag: Math.sin(t * 3 + pv.phase),
        eyes: blink ? 'blink' : 'open',
        mouth: 'smile'
      });
      L.blit(pv.layer, (44 - Pets.SIZE) / 2, 44 - Pets.FEET - 2);
      pv.scr.present();
    }
  }

  var previewRAF = null;
  function previewLoop(ts) {
    renderPreviews(ts / 1000);
    previewRAF = requestAnimationFrame(previewLoop);
  }

  function showStartScreen() {
    el.startScreen.classList.remove('hidden');
    el.game.classList.add('hidden');
    if (!previewRAF) previewRAF = requestAnimationFrame(previewLoop);
    selectSpecies(picked);
  }

  function selectSpecies(id) {
    picked = id;
    document.querySelectorAll('.pick-card').forEach(function (c) {
      var on = c.dataset.species === id;
      c.classList.toggle('selected', on);
      c.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    var pool = NAMES[id];
    el.nameInput.placeholder = pool[Math.floor(Math.random() * pool.length)];
  }

  function bindStartScreen() {
    document.querySelectorAll('.pick-card').forEach(function (c) {
      c.addEventListener('click', function () {
        Sfx.init();
        Sfx.click();
        selectSpecies(c.dataset.species);
      });
      c.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); c.click(); }
      });
    });

    el.startBtn.addEventListener('click', function () {
      Sfx.init();
      Sfx.click();
      var name = (el.nameInput.value || '').trim().slice(0, 14) || el.nameInput.placeholder;
      state = freshState(picked, name);
      beginGame(true);
    });

    el.nameInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') el.startBtn.click();
    });
  }

  function beginGame(isNew) {
    el.startScreen.classList.add('hidden');
    el.game.classList.remove('hidden');
    if (previewRAF) { cancelAnimationFrame(previewRAF); previewRAF = null; }
    el.nameInput.value = '';
    rt.particles = [];
    rt.props = {};
    rt.activity = null;
    setButtonsBusy(false);
    save();
    if (isNew) say('Hi! I am ' + state.name + '!', 2600);
    if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
    resizeScene();
  }

  /* ------------------------------------------------------------------ */
  /* layout                                                              */
  /* ------------------------------------------------------------------ */
  function resizeScene() {
    var frameEl = el.scene.parentElement;
    if (!frameEl) return;
    var avail = frameEl.clientWidth - 12;
    var availH = Math.max(140, window.innerHeight * 0.42);
    var scale = Math.max(2, Math.min(Math.floor(avail / W), Math.floor(availH / H)));
    el.scene.style.width = (W * scale) + 'px';
    el.scene.style.height = (H * scale) + 'px';
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  function boot() {
    cacheDom();
    screen = new PX.Screen(el.scene, W, H);
    petLayer = new PX.Layer(Pets.SIZE, Pets.SIZE);

    try { Sfx.on = localStorage.getItem('pixelpals.sound') !== '0'; } catch (e) { }
    el.soundBtn.textContent = Sfx.on ? '🔊' : '🔇';

    setupPreviews();
    bindStartScreen();
    bindButtons();
    bindScene();

    window.addEventListener('resize', resizeScene);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) save();
      else if (state) { var away = applyAway(state); if (away > 120) say('I missed you!', 2400); }
    });

    var saved = load();
    if (saved) {
      state = saved;
      var away = applyAway(state);
      beginGame(false);
      if (away > 120) setTimeout(function () { say('I missed you! 💕', 2600); }, 400);
    } else {
      showStartScreen();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
