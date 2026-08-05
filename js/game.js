/* game.js — the little world: room, props, particles, care actions, growth,
   and a shelf of pets you can switch between. */
(function () {
  'use strict';

  var C = PX.C;
  var SAVE_KEY = 'pixelpals.save.v2';
  var OLD_KEY = 'pixelpals.save.v1';
  var MAX_OFFLINE = 3 * 3600;   // cap on decay while you are away (seconds)
  var MAX_PETS = 6;

  var STAT_KEYS = ['food', 'water', 'fun', 'clean', 'groom'];
  var DECAY = {
    food: 100 / 420, water: 100 / 360, fun: 100 / 330,
    clean: 100 / 700, groom: 100 / 900
  };
  var IDLE_RATE = 0.35;         // pets you are not looking after right now

  // one dirt spot is worth this much Clean; one tuft this much Brush
  var DIRT_PER = 12, TUFT_PER = 14;

  var ACTIONS = {
    feed: { stat: 'food', kind: 'anim', dur: 4.6, gain: 38, done: 'Yum yum!', full: "I'm so full!" },
    water: { stat: 'water', kind: 'anim', dur: 4.0, gain: 42, done: 'Glug glug!', full: 'Not thirsty!' },
    play: { stat: 'fun', kind: 'anim', dur: 6.5, gain: 45, done: 'That was fun!', full: 'Played out!' },
    bath: { stat: 'clean', kind: 'tool', done: 'Squeaky clean!', full: "I'm already clean!" },
    brush: { stat: 'groom', kind: 'tool', done: 'So fluffy!', full: 'My fur is perfect!' }
  };

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
    sad: function () { this.tone(330, 0.25, 'sine', 0.045, 0, 200); }
  };

  /* ------------------------------------------------------------------ */
  /* save data — a shelf of pets                                         */
  /* ------------------------------------------------------------------ */
  var db = { v: 2, activeId: '', pets: [] };
  var pet = null;               // the pet currently on screen

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function uid() { return 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }

  function newPet(species, name) {
    return {
      id: uid(), species: species, name: name,
      growth: 0, stage: 'baby',
      stats: { food: 75, water: 75, fun: 75, clean: 95, groom: 92 },
      love: 40, born: Date.now(), saved: Date.now(), cuddles: 0
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
    if (typeof p.love !== 'number') p.love = 40;
    if (!p.id) p.id = uid();
    p.stage = Pets.stageFor(p.growth).key;
    return p;
  }

  function save() {
    db.pets.forEach(function (p) { p.saved = Date.now(); });
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(db)); } catch (e) { /* private mode */ }
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
    if (raw) {
      try {
        var d = JSON.parse(raw);
        if (d && d.pets && d.pets.length) {
          db = { v: 2, activeId: d.activeId, pets: d.pets.map(normalise) };
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
          db = { v: 2, activeId: p.id, pets: [p] };
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
    p.saved = Date.now();
    return away;
  }

  function avgStats(p) {
    var t = 0;
    for (var i = 0; i < STAT_KEYS.length; i++) t += p.stats[STAT_KEYS[i]];
    return t / STAT_KEYS.length;
  }

  function happiness(p) {
    return clamp(avgStats(p) * 0.75 + (p.love || 0) * 0.25, 0, 100);
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
    props: {}, particles: [],
    spots: [], foam: [],
    petting: false, lastHeart: 0,
    shine: 0, growthFlash: 0
  };

  /* ------------------------------------------------------------------ */
  /* screen sizing — the room fills the whole viewport                   */
  /* ------------------------------------------------------------------ */
  var W = 88, H = 64, scale = 6, screen = null;
  var petLayer = new PX.Layer(Pets.SIZE, Pets.SIZE);
  var fx = new PX.Layer(44, 44);
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
     so anything needing its own black edge is drawn on a scratch layer. */
  function stampOutlined(L, x, y, draw) {
    fx.clear();
    draw(fx, 22, 22);
    fx.outline(C('#141014'));
    L.blit(fx, Math.round(x) - 22, Math.round(y) - 22);
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
    fluff: { rows: ['.#.', '###', '.#.'], color: '#ffffff' }
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
      if (p.life > p.max * 0.75 && Math.floor(p.life * 14) % 2 === 0) continue;
      var col = art.color;
      if (p.kind === 'fluff' && pet) col = Pets.SPECIES[pet.species].furLight;
      L.stamp(art.rows, { '#': C(col) }, Math.round(p.x), Math.round(p.y));
    }
  }

  /* ------------------------------------------------------------------ */
  /* the room                                                            */
  /* ------------------------------------------------------------------ */
  function drawRoom(L, t) {
    var wall = C('#ffe6f2'), wallLow = C('#ffd0e6'), trim = C('#f2a8cc');
    var floor = C('#f6cf95'), plank = C('#e0b273'), floorEdge = C('#c99a5f');
    var fy = room.floorY;

    L.rect(0, 0, W, fy, wall);
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

    // bunting, hung below the status card
    var by = Math.round(H * 0.1);
    var cols = ['#ff8fb0', '#ffd93d', '#8ee86a', '#9ad0ff'];
    var n = Math.max(3, Math.floor((W - 6) / 9));
    var string = C('#e8629a');
    for (var sxp = 3; sxp <= W - 3; sxp++) {
      L.set(sxp, by + Math.sin(Math.PI * (sxp - 3) / (W - 6)) * 3, string);
    }
    for (var i = 0; i < n; i++) {
      var bx = 3 + (W - 6) * (i / n);
      var sag = Math.sin(Math.PI * (i / n)) * 3;
      L.tri(bx, by + sag + 1, bx + 5, by + sag + 1, bx + 2.5, by + sag + 6, C(cols[i % cols.length]));
    }

    // window
    var wx = 4, wy = Math.round(H * 0.2);
    L.rect(wx + 2, wy + 2, 20, 18, C('#a8e0ff'));
    L.disc(wx + 17, wy + 7, 3.5, C('#ffe98a'));
    var c1 = wx + 5 + ((t * 2) % 15);
    L.ellipse(c1, wy + 13, 4, 2, C('#ffffff'));
    L.ellipse(c1 + 2, wy + 12, 2.5, 1.5, C('#ffffff'));
    var c2 = wx + 5 + ((t * 1.3 + 8) % 15);
    L.ellipse(c2, wy + 5, 3, 1.4, C('#ffffff'));
    var frame = C('#ffffff');
    L.rect(wx, wy, 24, 2, frame);
    L.rect(wx, wy + 20, 24, 2, frame);
    L.rect(wx, wy, 2, 22, frame);
    L.rect(wx + 22, wy, 2, 22, frame);
    L.rect(wx + 11, wy + 2, 1, 18, frame);
    L.rect(wx + 2, wy + 10, 20, 1, frame);

    // framed heart
    var px2 = W - 19, py2 = Math.round(H * 0.22);
    L.rect(px2, py2, 13, 12, C('#f7b955'));
    L.rect(px2 + 2, py2 + 2, 9, 8, C('#fff6e0'));
    L.stamp(Pets.HEART, { '#': C('#ff6f9c') }, px2 + 4, py2 + 3);

    // wall shelf with a jar and a book, filling the middle of the wall
    var sy = fy - 20, sx = W - 26;
    if (sy > py2 + 15) {
      L.rect(sx, sy, 22, 2, C('#d9954f'));
      L.rect(sx + 3, sy - 6, 5, 6, C('#8ee86a'));
      L.rect(sx + 2, sy - 8, 7, 2, C('#63c93f'));
      L.rect(sx + 12, sy - 7, 3, 7, C('#ff8fb0'));
      L.rect(sx + 15, sy - 6, 3, 6, C('#9ad0ff'));
      L.rect(sx + 18, sy - 8, 3, 8, C('#ffd93d'));
    }

    // potted plant standing against the wall
    stampOutlined(L, W - 9, fy - 4, function (b, bx, by) {
      b.rect(bx - 4, by - 3, 9, 9, C('#e58f6a'));
      b.rect(bx - 5, by - 5, 11, 3, C('#f2a682'));
      b.disc(bx, by - 9, 4, C('#7ed957'));
      b.disc(bx - 4, by - 7, 3, C('#63c93f'));
      b.disc(bx + 4, by - 7, 3, C('#63c93f'));
      b.disc(bx, by - 13, 2.5, C('#8ee86a'));
    });

    // toy box
    stampOutlined(L, 8, fy - 3, function (b, bx, by) {
      b.rect(bx - 6, by - 4, 13, 9, C('#9ad0ff'));
      b.rect(bx - 6, by - 4, 13, 2, C('#77b8f0'));
      b.disc(bx - 2, by + 1, 1.7, C('#ff8fb0'));
      b.disc(bx + 3, by + 1, 1.7, C('#ffe07a'));
    });

    // pet bed cushion on the floor
    stampOutlined(L, 12, fy + 13, function (b, bx, by) {
      b.ellipse(bx, by, 9, 4, C('#ff8fb0'));
      b.ellipse(bx, by - 1, 6.5, 2.6, C('#ffd0dd'));
    });
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

  function drawBrush(L, x, y, tilt) {
    stampOutlined(L, x, y, function (b, bx, by) {
      b.line(bx + 3, by - 1, bx + 8 + tilt, by - 7, C('#d9954f'), 2.6);
      b.ellipse(bx - 1, by, 5, 3, C('#d9954f'));
      b.ellipse(bx - 1, by - 1, 4.4, 2, C('#eab275'));
      for (var i = -4; i <= 3; i += 2) b.rect(bx + i, by + 2, 1, 3, C('#fbf3e6'));
    });
  }

  /* ------------------------------------------------------------------ */
  /* need bubble                                                         */
  /* ------------------------------------------------------------------ */
  function drawNeedBubble(L, x, y, need, t) {
    var iconName = { food: 'feed', water: 'water', fun: 'play', clean: 'bath', groom: 'brush' }[need];
    var pop = Math.sin(t * 4) * 0.6;
    stampOutlined(L, x, y + pop, function (b, bx, by) {
      b.ellipse(bx, by, 10, 9, C('#ffffff'));
      b.tri(bx - 4, by + 7, bx + 2, by + 7, bx - 2, by + 13, C('#ffffff'));
      b.blit(Icons.layer(iconName), Math.round(bx - 8), Math.round(by - 8));
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
    if (!pet || rt.activity || rt.tool) return;
    var cfg = ACTIONS[name];
    if (!cfg) return;
    Sfx.init();

    if (pet.stats[cfg.stat] > (cfg.kind === 'tool' ? 95 : 92)) {
      say(cfg.full);
      Sfx.sad();
      bumpLove(1);
      return;
    }

    if (cfg.kind === 'tool') return startTool(name);

    rt.activity = { kind: name, t: 0, dur: cfg.dur, given: 0, beat: 0 };
    rt.props = {};
    if (name === 'play') {
      rt.props.ball = { x: W * 0.72, y: room.groundY - 34, vx: -16, vy: 0, spin: 0 };
      Sfx.boing();
    }
    refreshDock();
  }

  function updateActivity(dt) {
    var a = rt.activity;
    if (!a) return;
    var cfg = ACTIONS[a.kind];
    a.t += dt;
    var p = a.t / a.dur;

    var fillFrom = 0.25, fillTo = 0.8;
    var want = cfg.gain * clamp((p - fillFrom) / (fillTo - fillFrom), 0, 1);
    if (want > a.given) {
      pet.stats[cfg.stat] = clamp(pet.stats[cfg.stat] + (want - a.given), 0, 100);
      a.given = want;
    }

    if (a.kind === 'feed' || a.kind === 'water') {
      var isFood = a.kind === 'feed';
      var slide = clamp(p / 0.18, 0, 1);
      var out = clamp((p - 0.86) / 0.14, 0, 1);
      var bowlX = W / 2 + 18;
      rt.props.bowl = {
        x: (W + 10) - slide * (W + 10 - bowlX) + out * 26,
        y: room.groundY - 1,
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
            spawn('crumb', rt.props.bowl.x - 4, room.groundY - 6, { vx: -12, vy: -14, g: 60, max: 0.7 });
          } else {
            Sfx.sip();
            spawn('drop', rt.props.bowl.x - 3, room.groundY - 7, { vx: -6, vy: -12, g: 55, max: 0.6 });
          }
        }
      } else rt.leanTarget = 0;
    }

    if (a.kind === 'play') {
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
      if (Math.random() < dt * 3) spawn('note', W / 2 + (Math.random() - 0.5) * 16, room.groundY - 30, { vy: -10, max: 1.2 });
    }

    if (a.t >= a.dur) {
      addGrowth(pet.stats[cfg.stat] - cfg.gain < 55 ? 6 : 2.5);
      bumpLove(6);
      say(cfg.done);
      for (var i = 0; i < 5; i++) {
        spawn('heart', W / 2 + (Math.random() - 0.5) * 14, room.groundY - 28, { vy: -14, max: 1.2 });
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
    // make sure there is something to work on
    syncSpots();
    if (countSpots(kind) === 0) {
      var statKey = ACTIONS[name].stat;
      pet.stats[statKey] = clamp(pet.stats[statKey] - (name === 'bath' ? DIRT_PER : TUFT_PER) * 2, 0, 100);
      syncSpots();
    }

    rt.tool = {
      kind: name, target: kind, t: 0, cleared: 0,
      x: W / 2, y: room.groundY - 20, down: false, lastX: null, lastY: null,
      finishing: 0
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
    el.toolText.textContent = name === 'bath' ? 'Rub the soap on your pet!' : 'Swipe to brush the fur!';
    setHint('');
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
    rt.leanTarget = 0;
    el.dock.classList.remove('hide');
    el.toolBar.classList.remove('show');
    refreshDock();
    syncSpots();
    save();
  }

  function scrubAt(x, y) {
    var t = rt.tool;
    if (!t || t.finishing) return;
    var lx = x - (W / 2 - Pets.SIZE / 2);
    var ly = y - (room.groundY - Pets.FEET);
    var hit = false;

    for (var i = rt.spots.length - 1; i >= 0; i--) {
      var s = rt.spots[i];
      if (s.kind !== t.target) continue;
      if (Math.abs(s.x - lx) < 5 && Math.abs(s.y - ly) < 5) {
        rt.spots.splice(i, 1);
        t.cleared++;
        hit = true;
        var cfg = ACTIONS[t.kind];
        pet.stats[cfg.stat] = clamp(pet.stats[cfg.stat] + (t.target === 'dirt' ? DIRT_PER : TUFT_PER), 0, 100);
        bumpLove(2);
        addGrowth(0.5);
        if (t.target === 'dirt') {
          rt.foam.push({ x: s.x, y: s.y, r: 1.9, life: 0 });
          for (var k = 0; k < 3; k++) {
            spawn('bubble', x + (Math.random() - 0.5) * 6, y - 2, { vy: -12 - Math.random() * 8, max: 1.3 });
          }
        } else {
          for (var k2 = 0; k2 < 3; k2++) {
            spawn('fluff', x + (Math.random() - 0.5) * 6, y - 2, { vx: (Math.random() - 0.5) * 14, vy: -10, g: 18, max: 0.9 });
          }
        }
        if (Math.random() < 0.5) spawn('heart', x, y - 4, { vy: -14, max: 1 });
      }
    }

    // scrubbing over the pet at all is pleasant even when nothing is there
    var overPetNow = Math.abs(lx - Pets.SIZE / 2) < 16 && ly > 4 && ly < Pets.FEET + 2;
    if (overPetNow) {
      rt.leanTarget = clamp((x - W / 2) * 0.22, -3, 3);
      if (t.kind === 'bath') Sfx.squeak(); else Sfx.swish();
      if (Math.random() < 0.12) {
        spawn(t.kind === 'bath' ? 'bubble' : 'fluff', x + (Math.random() - 0.5) * 8, y - 3,
          { vy: -9, max: 0.9 });
      }
    }

    if (hit && countSpots(t.target) === 0) t.finishing = 0.9;
  }

  function updateTool(dt) {
    var t = rt.tool;
    if (!t) return;
    t.t += dt;
    if (t.kind === 'bath' && Math.random() < dt * 5) {
      spawn('bubble', W / 2 + (Math.random() - 0.5) * 30, room.groundY - 10 - Math.random() * 6,
        { vy: -8 - Math.random() * 6, max: 1.5 });
    }
    if (t.finishing > 0) {
      t.finishing -= dt;
      if (t.finishing <= 0) endTool(true);
    }
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
      'confirmModal', 'confirmText', 'confirmYes', 'confirmNo', 'celebrate', 'celebrateText'
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
    var busy = !!(rt.activity || rt.tool);
    el.actionBtns.forEach(function (b) { b.disabled = busy; });
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
      var v = pet.stats[k];
      el.rings[b.dataset.action].style.setProperty('--p', clamp(v, 0, 100).toFixed(0));
      b.classList.toggle('wants', v < 30 && !rt.activity && !rt.tool);
      if (v < lowVal) { lowVal = v; lowest = k; }
    });

    var hc = heartCount(pet);
    if (hc !== lastHearts) {
      lastHearts = hc;
      for (var i = 0; i < 5; i++) Icons.render(el.heartCanvases[i], i < hc ? 'heart' : 'heartEmpty', 13);
    }

    if (!rt.tool) {
      if (rt.activity) setHint('');
      else if (lowVal < 30) setHint(HINTS[lowest]);
      else setHint('Stroke your pet to give it cuddles!');
    }
  }

  /* ------------------------------------------------------------------ */
  /* rendering                                                           */
  /* ------------------------------------------------------------------ */
  var bounds = null;

  function currentEyes() {
    if (rt.petting || rt.tool) return 'happy';
    if (rt.blinking > 0) return 'blink';
    if (rt.activity) return 'open';
    var avg = avgStats(pet);
    if (avg < 32) return 'sad';
    if (avg > 78 && Math.sin(rt.t * 0.7) > 0.6) return 'happy';
    return 'open';
  }

  function currentMouth() {
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
    L.clear(C('#ffe6f2'));
    drawRoom(L, rt.t);

    if (rt.props.tub) drawTub(L, rt.props.tub.x, rt.props.tub.y, true, rt.t);

    L.ellipse(W / 2, room.groundY + 1, 13, 2.5, C('#e0b273'));

    petLayer.clear();
    var bobAmp = rt.activity && rt.activity.kind === 'play' ? 1.8 : 0.8;
    bounds = Pets.drawPet(petLayer, pet.species, Pets.stageFor(pet.growth).key, {
      bob: Math.sin(rt.bobPhase) * bobAmp,
      lean: rt.lean,
      tailWag: Math.sin(rt.t * (rt.petting || rt.tool ? 7 : 2.4)) * (rt.petting ? 1.4 : 1),
      earWig: Math.sin(rt.t * 3.1) * 0.5,
      eyes: currentEyes(),
      mouth: currentMouth(),
      spots: rt.spots,
      foam: rt.foam,
      shine: rt.shine > 0 ? rt.shine : 0
    });
    L.blit(petLayer, Math.round(W / 2 - Pets.SIZE / 2), Math.round(room.groundY - Pets.FEET));

    if (rt.props.bowl) drawBowl(L, rt.props.bowl.x, rt.props.bowl.y, rt.props.bowl.fill, rt.props.bowl.level);
    if (rt.props.tub) drawTub(L, rt.props.tub.x, rt.props.tub.y, false, rt.t);
    if (rt.props.ball) drawBall(L, rt.props.ball.x, rt.props.ball.y, rt.props.ball.spin);

    drawParticles(L);

    if (rt.tool) {
      var tilt = Math.sin(rt.t * 9) * (rt.tool.down ? 1.2 : 0.3);
      if (rt.tool.kind === 'bath') drawSoap(L, rt.tool.x, rt.tool.y, tilt);
      else drawBrush(L, rt.tool.x, rt.tool.y, tilt);
    }

    if (!rt.activity && !rt.tool) {
      var lowest = null, lv = 101;
      for (var i = 0; i < STAT_KEYS.length; i++) {
        if (pet.stats[STAT_KEYS[i]] < lv) { lv = pet.stats[STAT_KEYS[i]]; lowest = STAT_KEYS[i]; }
      }
      if (lv < 30) drawNeedBubble(L, W / 2 + 20, room.groundY - 40, lowest, rt.t);
    }

    if (rt.growthFlash > 0 && Math.floor(rt.growthFlash * 16) % 2 === 0) {
      var white = C('#ffffff');
      for (var y = 0; y < H; y++) for (var x = (y % 2); x < W; x += 2) L.set(x, y, white);
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

    // every pet ages; the one you are looking after ages fastest
    for (var i = 0; i < db.pets.length; i++) {
      var p = db.pets[i];
      var busy = (p === pet) && (rt.activity || rt.tool);
      var rate = p === pet ? (busy ? 0 : 1) : IDLE_RATE;
      if (rate > 0) {
        for (var s = 0; s < STAT_KEYS.length; s++) {
          var k = STAT_KEYS[s];
          p.stats[k] = clamp(p.stats[k] - DECAY[k] * dt * rate, 0, 100);
        }
      }
      if (p !== pet) p.love = clamp((p.love || 0) - dt * 0.5, 0, 100);
    }
    pet.love = clamp((pet.love || 0) - dt * 1.6, 0, 100);

    growthClock += dt;
    if (growthClock > 10) {
      growthClock = 0;
      if (avgStats(pet) > 55) addGrowth(0.6);
    }

    rt.bobPhase += dt * (rt.activity && rt.activity.kind === 'play' ? 7 : 2.2);
    rt.lean += (rt.leanTarget - rt.lean) * Math.min(1, dt * 6);
    if (rt.blinking > 0) rt.blinking -= dt;
    else if (rt.t > rt.blinkAt) { rt.blinking = 0.14; rt.blinkAt = rt.t + 2 + Math.random() * 3.5; }
    if (rt.growthFlash > 0) rt.growthFlash -= dt;
    if (rt.shine > 0) rt.shine -= dt * 0.5;

    // foam dries off after the bath
    for (var f = rt.foam.length - 1; f >= 0; f--) {
      rt.foam[f].life += dt;
      if (!rt.tool) rt.foam[f].r -= dt * 0.7;
      if (rt.foam[f].r <= 0.4) rt.foam.splice(f, 1);
    }

    if (rt.petting) {
      if (rt.t - rt.lastHeart > 0.28) {
        rt.lastHeart = rt.t;
        spawn('heart', W / 2 + (Math.random() - 0.5) * 18, room.groundY - 32, { vy: -16, max: 1.1 });
        bumpLove(5);
        pet.stats.fun = clamp(pet.stats.fun + 1.2, 0, 100);
        addGrowth(0.25);
        pet.cuddles = (pet.cuddles || 0) + 1;
        Sfx.purr();
      }
    }

    updateActivity(dt);
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

      if (rt.tool) {
        rt.tool.down = true;
        rt.tool.x = p.x;
        rt.tool.y = p.y;
        scrubAt(p.x, p.y);
        return;
      }
      if (rt.activity && rt.activity.kind === 'play' && rt.props.ball) {
        var b = rt.props.ball;
        if (Math.abs(p.x - b.x) < 8 && Math.abs(p.y - b.y) < 8) {
          b.vy = -70;
          b.vx = (b.x < W / 2 ? 1 : -1) * (18 + Math.random() * 16);
          pet.stats.fun = clamp(pet.stats.fun + 3, 0, 100);
          addGrowth(0.4);
          Sfx.boing();
          spawn('sparkle', b.x, b.y - 4, { vy: -12, max: 0.6 });
          return;
        }
      }
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
      if (!rt.petting) return;
      if (!overPet(p)) { stopPetting(); return; }
      rt.leanTarget = clamp((p.x - W / 2) * 0.3, -3, 3);
    });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
      canvas.addEventListener(t, function () {
        if (rt.tool) { rt.tool.down = false; rt.leanTarget = 0; }
        stopPetting();
      });
    });
  }

  function stopPetting() {
    if (!rt.petting) return;
    rt.petting = false;
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
      endTool(false);
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
      Pets.drawPet(L, p.species, Pets.stageFor(p.growth).key, { eyes: 'open', mouth: 'smile' });
      scr.layer.clear(C(p.species === 'fox' ? '#fff0e0' : '#eef1f8'));
      scr.layer.ellipse(24, 44, 15, 3, C(p.species === 'fox' ? '#ffe0c0' : '#dfe4f0'));
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

  function switchTo(id) {
    var p = byId(id);
    if (!p || p === pet) return;
    if (rt.tool) endTool(false);
    rt.activity = null;
    rt.props = {};
    rt.particles = [];
    rt.foam = [];
    rt.spots = [];
    rt.shine = 0;
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
    fox: ['Ember', 'Ginger', 'Maple', 'Sunny', 'Pepper', 'Clementine', 'Rusty', 'Nutmeg']
  };

  var picked = 'fox';
  var previews = [];
  var previewRAF = null;

  function setupPreviews() {
    ['cat', 'fox'].forEach(function (id) {
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
      L.clear(C(pv.id === 'fox' ? '#fff0e0' : '#eef1f8'));
      L.ellipse(24, 44, 15, 3, C(pv.id === 'fox' ? '#ffe0c0' : '#dfe4f0'));
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
      say('Hi! I am ' + p.name + '!', 2600);
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
      if (away > 120) setTimeout(function () { say('I missed you!', 2600); }, 400);
    } else {
      showStartScreen(false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
