/* pets.js — the animals.
   Sprites are drawn procedurally onto a 40x40 index layer so the same code
   can grow the pet from baby to adult and animate ears, tails, eyes and
   mouths without hand-authoring dozens of frames. Style follows the
   reference art: chunky pixels, solid black outlines, cream chest and
   muzzle, blush cheeks. */
(function (global) {
  'use strict';

  var C = PX.C;

  var SPECIES = {
    fox: {
      id: 'fox',
      label: 'Fox',
      emoji: '🦊',
      blurb: 'Bouncy and cheeky',
      fur: '#e08040',
      furLight: '#f0a05e',
      furDark: '#c0642c',
      cream: '#fbf3e6',
      creamShade: '#ecdcc6',
      innerEar: '#fbf3e6',
      earTip: '#141014',
      paw: '#141014',
      nose: '#141014',
      blush: '#f08a8a',
      outline: '#141014',
      eyeStyle: 'slit',
      eyeColor: '#141014',
      tailTip: '#fbf3e6',
      whiskers: false,
      earLean: 0.22,
      tailBushy: true,
      cheekPatch: true,
      foreheadStripes: false,
      cardBg: '#ffd9b0',
      thumbBg: '#fff0e0',
      thumbShade: '#ffe0c0'
    },
    cat: {
      id: 'cat',
      label: 'Cat',
      emoji: '🐱',
      blurb: 'Soft and sleepy',
      fur: '#6f7076',
      furLight: '#8d8e95',
      furDark: '#4f5055',
      cream: '#ffffff',
      creamShade: '#e4e6ec',
      innerEar: '#f4a6c8',
      earTip: null,
      paw: '#ffffff',
      nose: '#f4a6c8',
      blush: '#f0a0b8',
      outline: '#141014',
      eyeStyle: 'round',
      eyeColor: '#141014',
      tailTip: '#ffffff',
      whiskers: true,
      earLean: 0.16,
      tailBushy: false,
      cheekPatch: false,
      foreheadStripes: true,
      cardBg: '#d8dce8',
      thumbBg: '#eef1f8',
      thumbShade: '#dfe4f0'
    },
    blackcat: {
      id: 'blackcat',
      label: 'Black Cat',
      emoji: '🐈‍⬛',
      blurb: 'Mysterious and cuddly',
      fur: '#3a3644',
      furLight: '#4b4657',
      furDark: '#2a2732',
      cream: '#4b4657',
      creamShade: '#413d4c',
      innerEar: '#e08aa8',
      earTip: null,
      paw: '#2a2732',
      nose: '#e08aa8',
      blush: '#7a5068',
      outline: '#141014',
      eyeStyle: 'glow',
      eyeColor: '#141014',
      iris: '#9ef05e',
      tailTip: '#3a3644',
      whiskers: true,
      earLean: 0.16,
      tailBushy: false,
      cheekPatch: false,
      foreheadStripes: false,
      cardBg: '#cfc7dd',
      thumbBg: '#e7e3f0',
      thumbShade: '#d5cfe4'
    },
    dog: {
      id: 'dog',
      label: 'Dalmatian',
      emoji: '🐕',
      blurb: 'Spotty and waggy',
      fur: '#f6f4f2',
      furLight: '#ffffff',
      furDark: '#2a2732',
      cream: '#ffffff',
      creamShade: '#e6e3e0',
      innerEar: '#f0a8b8',
      earTip: null,
      earColor: '#2a2732',
      paw: '#f6f4f2',
      nose: '#2a2732',
      blush: '#f5a8b4',
      outline: '#141014',
      eyeStyle: 'round',
      eyeColor: '#141014',
      iris: '#a06a3c',
      tailTip: '#f6f4f2',
      whiskers: false,
      earLean: 0.1,
      earStyle: 'floppy',
      muzzleScale: 1.25,
      noseScale: 1.6,
      tailBushy: false,
      coatSpots: true,
      cheekPatch: false,
      foreheadStripes: false,
      cardBg: '#ecebe9',
      thumbBg: '#f3f2f0',
      thumbShade: '#dedcda'
    },
    fish: {
      id: 'fish',
      label: 'Clownfish',
      emoji: '🐠',
      blurb: 'Stripy and bold',
      body: 'fish',                 // swims instead of standing, and lives in a tank
      fur: '#ff7a1e',
      furLight: '#ff9d47',
      furDark: '#d1550c',
      band: '#fdfbf2',              // the three white stripes
      cream: '#ffd9a8',
      creamShade: '#f0c894',
      finColor: '#ff8f2e',
      innerEar: '#ffd07a',
      earTip: null,
      paw: '#ffd07a',
      nose: '#141014',
      blush: '#ff9ec4',
      outline: '#1b1626',
      eyeStyle: 'round',
      eyeColor: '#141014',
      tailTip: '#ff8f2e',
      whiskers: false,
      earLean: 0,
      tailBushy: false,
      cheekPatch: false,
      foreheadStripes: false,
      cardBg: '#bfe9ff',
      thumbBg: '#dff3ff',
      thumbShade: '#bfe9ff',
      water: true                   // lives in a tank rather than a bedroom
    },
    axolotl: {
      id: 'axolotl',
      label: 'Axolotl',
      emoji: '🦎',
      blurb: 'Smiley and squishy',
      body: 'axolotl',
      water: true,
      fur: '#3fc9bd',
      furLight: '#74e2d8',
      furDark: '#2a9a92',
      frill: '#ff9ec4',             // the feathery gills
      frillDark: '#ec7dab',
      cream: '#d9f7f3',
      creamShade: '#b7e9e3',
      finColor: '#5fd8ce',
      innerEar: '#ff9ec4',
      earTip: null,
      paw: '#74e2d8',
      nose: '#16323a',
      blush: '#ff9ec4',
      outline: '#16323a',
      eyeStyle: 'round',
      eyeColor: '#16323a',
      tailTip: '#5fd8ce',
      whiskers: false,
      earLean: 0,
      tailBushy: false,
      cheekPatch: false,
      foreheadStripes: false,
      cardBg: '#bff0ea',
      thumbBg: '#e2faf7',
      thumbShade: '#bff0ea'
    }
  };

  // Life stages. `growth` is the score at which the pet reaches the stage.
  // Babies are all head; adults grow into their bodies, ears and tails.
  // Growing up is meant to take a good while — a stage is several sessions of
  // proper care, not a handful of taps. GROWTH_SCALE below is the multiplier
  // these numbers were last stretched by, so old saves can be brought along.
  var GROWTH_SCALE = 3;
  var STAGES = [
    { key: 'baby', label: 'Baby', growth: 0, head: [7.8, 7.2], body: [5.2, 4.4], ear: 4.0, eye: 2.5, tail: [8, 2.3] },
    { key: 'kid', label: 'Kid', growth: 90, head: [8.4, 7.8], body: [6.2, 5.2], ear: 4.9, eye: 2.4, tail: [10, 2.6] },
    { key: 'teen', label: 'Teen', growth: 225, head: [9, 8.4], body: [7.3, 6.3], ear: 5.6, eye: 2.3, tail: [12, 3.0] },
    { key: 'adult', label: 'Adult', growth: 420, head: [9.6, 9], body: [8.4, 7.3], ear: 6.9, eye: 2.2, tail: [14, 3.3] }
  ];

  function stageFor(growth) {
    var s = STAGES[0];
    for (var i = 0; i < STAGES.length; i++) if (growth >= STAGES[i].growth) s = STAGES[i];
    return s;
  }

  function stageIndex(key) {
    for (var i = 0; i < STAGES.length; i++) if (STAGES[i].key === key) return i;
    return 0;
  }

  var HEART = [
    '.#.#.',
    '#####',
    '#####',
    '.###.',
    '..#..'
  ];

  var SIZE = 44;      // pet layer is SIZE x SIZE
  var FEET = 40;      // ground line inside the layer

  // Some pets are drawn bigger than others. The scale multiplies the whole
  // layer — the sprite is redrawn at the larger size rather than magnified —
  // so a big pet keeps the same crisp one-pixel grid as the scene around it.
  // how much bigger a pet is drawn at each mutation phase
  var MONSTER_SCALE = [1, 1.16, 1.34, 1.55];
  var PET_SCALE = { fish: 2, axolotl: 1.85 };
  function scaleOf(id, phase) {
    return (PET_SCALE[id] || 1) * MONSTER_SCALE[Math.min(3, Math.max(0, phase || 0))];
  }

  // roughly how many layer pixels wide the sprite is per unit of scale, so the
  // game can shrink a big pet that would not fit the scene
  var PET_SPAN = { fish: 33, axolotl: 39 };
  function spanOf(id) { return PET_SPAN[id] || 30; }

  function drawEye(L, sp, ex, ey, r, state, side, k) {
    side = side || -1;
    k = k || 1;
    var dark = C(sp.eyeColor);
    var white = C('#ffffff');

    switch (state) {
      case 'blink':
        L.rect(ex - r, ey, r * 2, k, dark);
        break;

      case 'sleep':   // a contented downward curve
        L.rect(ex - r, ey - k, k, k, dark);
        L.rect(ex - r + k, ey, r * 2 - 2 * k, k, dark);
        L.rect(ex + r, ey - k, k, k, dark);
        break;

      case 'angry':
        L.ellipse(ex, ey + r * 0.35, r * 0.8, r * 0.5, dark);
        L.line(ex + side * r * 1.05, ey - r * 1.15, ex - side * r * 0.95, ey - r * 0.3, dark, 1);
        break;

      case 'happy':
        L.line(ex - r, ey + r * 0.55, ex, ey - r * 0.45, dark, k);
        L.line(ex, ey - r * 0.45, ex + r, ey + r * 0.55, dark, k);
        break;

      case 'love':
        var s = Math.max(0.6, r / 2.5);
        L.stamp(HEART, { '#': C('#ff5f8f') }, Math.round(ex - 2 * s), Math.round(ey - 2 * s));
        break;

      case 'sad':
        L.ellipse(ex, ey + r * 0.25, r * 0.85, r * 0.7, dark);
        L.set(ex - r * 0.3, ey + r * 0.05, white);
        // heavy lid
        L.line(ex - r, ey - r * 0.55, ex + r, ey - r * 0.15, C(sp.outline), 1);
        break;

      default: // open
        if (sp.eyeStyle === 'glow') {
          L.ellipse(ex, ey, r * 0.95, r * 1.1, dark);
          L.ellipse(ex, ey, r * 0.72, r * 0.92, C(sp.iris || '#9ef05e'));
          L.ellipse(ex, ey, r * 0.28, r * 0.78, dark);
          L.set(ex - r * 0.45, ey - r * 0.55, white);
        } else if (sp.eyeStyle === 'slit') {
          L.ellipse(ex, ey, r * 1.0, r * 0.62, dark);
          L.set(ex - r * 0.4, ey - r * 0.2, white);
        } else {
          L.ellipse(ex, ey, r * 0.9, r * 1.05, dark);
          L.set(ex - r * 0.35, ey - r * 0.45, white);
          L.set(ex - r * 0.35 + 1, ey - r * 0.45, white);
          L.set(ex - r * 0.35, ey - r * 0.45 + 1, white);
          L.set(ex + r * 0.3, ey + r * 0.5, C(sp.iris || '#7fd8b0'));
        }
        break;
    }
  }

  function drawMouth(L, sp, mx, my, state, k) {
    k = k || 1;
    var dark = C(sp.outline);
    function dot(dx, dy) { L.rect(mx + dx * k, my + dy * k, k, k, dark); }
    switch (state) {
      case 'open':
        L.ellipse(mx, my + 1 * k, 2.2 * k, 1.8 * k, dark);
        L.ellipse(mx, my + 1.6 * k, 1.2 * k, 0.9 * k, C('#ff7f9f'));
        break;
      case 'wide':
        L.ellipse(mx, my + 1.2 * k, 3 * k, 2.4 * k, dark);
        L.ellipse(mx, my + 2 * k, 1.7 * k, 1.2 * k, C('#ff7f9f'));
        break;
      case 'frown':
        dot(-2, 1);
        dot(-1, 0);
        dot(0, 0);
        dot(1, 0);
        dot(2, 1);
        break;
      case 'angry':
        dot(-2, 1);
        dot(-1, 0);
        dot(0, 1);
        dot(1, 0);
        dot(2, 1);
        dot(-1, 1);
        dot(1, 1);
        break;

      case 'snooze':
        L.ellipse(mx, my + 1 * k, 1.4 * k, 1.1 * k, dark);
        break;

      case 'none':
        break;
      default: // smile — a little "w"
        dot(-2, 0);
        dot(-1, 1);
        dot(0, 0);
        dot(1, 1);
        dot(2, 0);
        break;
    }
  }

  /* Draws the pet into `L` (a SIZE x SIZE layer, cleared by the caller).
     opts: { bob, tailWag, earWig, eyes, mouth, dirty, lean, sparkle } */
  /* A little mouth at the snout. The pet's mouth states are shared with the
     other animals, but a wide muzzle smile makes no sense in profile. */
  function fishMouth(L, sp, mx, my, state, k) {
    k = k || 1;
    var dark = C(sp.outline);
    switch (state) {
      case 'open':
      case 'wide':
        L.ellipse(mx - 1 * k, my, 1.7 * k, 1.6 * k, dark);
        L.ellipse(mx - 1 * k, my + 0.3 * k, 0.9 * k, 0.8 * k, C('#ff7f9f'));
        break;
      case 'frown':
        L.disc(mx, my - 1 * k, 0.5 * k, dark);
        L.disc(mx - 1 * k, my, 0.5 * k, dark);
        L.disc(mx - 2 * k, my + 0.5 * k, 0.5 * k, dark);
        break;
      case 'angry':
        L.rect(mx - 3 * k, my, 3.5 * k, 1 * k, dark);
        break;
      case 'snooze':
        L.ellipse(mx - 1 * k, my, 1.2 * k, 1.1 * k, dark);
        break;
      default:                       // smile
        L.rect(mx - 1 * k, my, 3 * k, 1 * k, dark);
        L.rect(mx + 2 * k, my - 1 * k, 1 * k, 1 * k, dark);
        L.rect(mx - 2 * k, my - 1 * k, 1 * k, 1 * k, dark);
    }
  }

  /* Geometry of the fish inside its layer. The layer may be bigger than a
     land pet's, so everything is worked out from the scale rather than from
     fixed numbers — the sprite is redrawn larger, not blown up. */
  function fishGeom(st, k) {
    // a clownfish is a stout oval, not a long torpedo
    var brx = st.body[0] * 1.6 * k, bry = st.body[1] * 1.22 * k;
    return {
      k: k, brx: brx, bry: bry,
      cx: (SIZE * k) / 2,
      cy: FEET * k - bry - 12 * k     // it floats above the sand, not on it
    };
  }

  /* One white stripe across the body, edged in dark. Drawn pixel by pixel so
     it stops exactly at the edge of the body instead of hanging over it. */
  function fishBand(L, cx, cy, brx, bry, offX, halfW, tilt, white, ink) {
    var x0 = Math.floor(cx - brx - 1), x1 = Math.ceil(cx + brx + 1);
    var y0 = Math.floor(cy - bry - 1), y1 = Math.ceil(cy + bry + 1);
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var dx = (x + 0.5 - cx) / brx, dy = (y + 0.5 - cy) / bry;
        if (dx * dx + dy * dy > 1) continue;
        var mid = cx + offX + (y + 0.5 - cy) * tilt;
        var d = Math.abs(x + 0.5 - mid);
        if (d <= halfW) L.set(x, y, white);
        else if (d <= halfW + 1) L.set(x, y, ink);
      }
    }
  }

  /* A fin: an orange blade inside a dark margin. Fins are laid down before
     the body, so the body covers the root and they read as growing out of
     it rather than being stuck on. */
  function fishFin(L, shape, ink, fin) {
    shape(1.3, ink);
    shape(0, fin);
  }

  /* A fish is a different animal altogether — no legs, no ears, no standing
     up — so it gets its own sprite. It still grows from the same stage
     numbers and takes the same eyes, mouth, hat and scrubbable spots, so
     everything the game does to a pet works on it too. */
  function drawFish(L, sp, st, opts, phase) {
    var k = Math.max(1, L.w / SIZE);
    var fur = C(sp.fur), furL = C(sp.furLight), furD = C(sp.furDark);
    var cream = C(sp.cream), ink = C(sp.outline), fin = C(sp.finColor || sp.furLight);
    var white = C(sp.band || '#fdfbf2');

    var g = fishGeom(st, k);
    var brx = g.brx, bry = g.bry;
    var bob = (opts.bob || 0) * k;
    var lean = (opts.lean || 0) * k;
    var sleep = opts.sleep || 0;
    var wag = (opts.tailWag || 0) * k;

    var cx = g.cx + lean * 0.6;
    var cy = g.cy + bob;

    // the fins go down first — the body is painted over their roots, which is
    // what makes them look grown on instead of stuck on
    var sway = wag * 0.5;

    // the sail along the back
    var dorsalCY = cy - bry * 0.45, dorsalRY = bry * 1.02;
    fishFin(L, function (m, col) {
      L.ellipse(cx - brx * 0.16 + sway * 0.4, dorsalCY - m * 0.6,
        brx * 0.62 + m * 0.6, dorsalRY + m, col);
    }, ink, fin);

    // the fin under the belly, at the back
    var analCY = cy + bry * 0.62, analRY = bry * 0.66;
    fishFin(L, function (m, col) {
      L.ellipse(cx - brx * 0.24 + sway * 0.3, analCY + m * 0.6,
        brx * 0.32 + m * 0.5, analRY + m, col);
    }, ink, fin);

    // tail fin, sweeping out behind
    var tx = cx - brx * 0.6, tl = st.tail[0] * 0.66 * k, th = st.tail[1] * 1.7 * k;
    fishFin(L, function (m, col) {
      L.tri(tx + m * 0.5, cy, tx - tl - m * 0.6, cy - th - m + wag,
        tx - tl - m * 0.6, cy + th + m + wag, col);
    }, ink, fin);
    // cut a notch out of the trailing edge so the tail fans instead of
    // reading as one solid wedge — the outline pass re-edges it afterwards
    L.tri(tx - tl - 2, cy - th * 0.34 + wag, tx - tl - 2, cy + th * 0.34 + wag,
      tx - tl * 0.72, cy + wag, 0);

    // the body over the top of them all
    L.ellipse(cx, cy, brx + 1, bry + 1, ink);
    L.ellipse(cx, cy, brx, bry, fur);
    L.ellipse(cx - brx * 0.22, cy - bry * 0.5, brx * 0.46, bry * 0.3, furL);
    void cream;

    // the three white stripes — one behind the eye, one at the middle, one
    // just before the tail
    fishBand(L, cx, cy, brx, bry, brx * 0.30, brx * 0.09, 0.16 * k, white, ink);
    fishBand(L, cx, cy, brx, bry, -brx * 0.13, brx * 0.105, 0.3 * k, white, ink);
    fishBand(L, cx, cy, brx, bry, -brx * 0.62, brx * 0.07, 0.08 * k, white, ink);

    // the little side fin, sitting on the flank just behind the head stripe
    var sfx = cx + brx * 0.14, sfy = cy + bry * 0.34;
    var sfrx = brx * 0.17, sfry = bry * 0.24;
    L.ellipse(sfx, sfy, sfrx + 1.2, sfry + 1.2, ink);
    L.ellipse(sfx, sfy, sfrx, sfry, fin);
    L.ellipse(sfx + sfrx * 0.2, sfy - sfry * 0.25, sfrx * 0.45, sfry * 0.35, furL);

    var dorsalTop = bry * 1.47 + Math.abs(sway) * 0.3;
    var bellyLow = bry * 1.28 + Math.abs(sway) * 0.3;

    // face — one eye and a little mouth, since it swims in profile
    var eyeR = st.eye * 0.8 * k * (1 - 0.55 * sleep);
    var eyeX = cx + brx * 0.63, eyeY = cy - bry * 0.24;
    // a fish only has the one eye facing us, so it gets a white ball behind
    // whatever expression is on top — a lone blink or squint on bare orange
    // would not read as an eye at all
    L.ellipse(eyeX, eyeY, eyeR * 1.26 + 1, eyeR * 1.36 + 1, ink);
    L.ellipse(eyeX, eyeY, eyeR * 1.26, eyeR * 1.36, C('#ffffff'));
    drawEye(L, sp, eyeX, eyeY, eyeR, opts.eyes || 'open', 1);
    L.ellipse(eyeX - eyeR * 1.4, eyeY + eyeR * 1.5, 1.3 * k, 0.8 * k, C(sp.blush));
    fishMouth(L, sp, cx + brx * 0.76, cy + bry * 0.3, opts.mouth || 'smile', k);

    // dirt, suds and drips are already scattered in this layer's coordinates
    if (opts.spots && opts.spots.length) {
      var mud = C('#8a6a45'), mudD = C('#6d5233');
      for (var d2 = 0; d2 < opts.spots.length; d2++) {
        var s2 = opts.spots[d2];
        if (s2.kind === 'tuft') {
          var dir = s2.flip ? 1 : -1;
          L.tri(s2.x - 1.6 * k, s2.y + 1.2 * k, s2.x + 1.6 * k, s2.y + 1.2 * k,
            s2.x + dir * 2 * k, s2.y - 2.6 * k, furD);
        } else {
          L.disc(s2.x, s2.y, 1.6 * k, mud);
          L.disc(s2.x, s2.y, 0.6 * k, mudD);
        }
      }
    }
    if (opts.foam && opts.foam.length) {
      for (var f = 0; f < opts.foam.length; f++) {
        L.disc(opts.foam[f].x, opts.foam[f].y, opts.foam[f].r * k, C('#ffffff'));
      }
    }
    if (opts.drips && opts.drips.length) {
      for (var dp = 0; dp < opts.drips.length; dp++) {
        L.ellipse(opts.drips[dp].x, opts.drips[dp].y, 1.5 * k, 2 * k, C('#7fd8ff'));
      }
    }

    var mg = {
      cx: cx, feet: FEET * k, top: cy - dorsalTop,
      headX: cx + brx * 0.5, headY: cy, headR: brx * 0.4, headRY: bry * 0.7,
      bodyX: cx, bodyY: cy, bodyRX: brx, bodyRY: bry
    };
    drawMonsterParts(L, sp, mg, phase || 0, k, opts);

    L.outline(ink);
    drawMonsterGlow(L, sp, mg, phase || 0, k);

    if (opts.sick) {
      var iceX = cx + brx * 0.2, iceY = cy - bry - 1.5 * k;
      L.ellipse(iceX, iceY, brx * 0.34 + 1, bry * 0.22 + 1, ink);
      L.ellipse(iceX, iceY, brx * 0.34, bry * 0.22, C('#9adcf8'));
      L.ellipse(iceX - brx * 0.12, iceY - 0.6 * k, brx * 0.12, 0.7 * k, C('#dff3ff'));
    }
    if (opts.hat) drawHat(L, opts.hat, cx + brx * 0.46, cy - bry * 0.62, brx * 0.34, bry * 0.72, ink);
    if (opts.shine) {
      var sh = C('#ffffff');
      var pts = [[cx - brx * 0.3, cy - bry * 0.6], [cx + brx * 0.4, cy - bry * 0.3],
                 [cx, cy + bry * 0.5]];
      for (var q = 0; q < pts.length; q++) {
        if ((opts.shine * 3) < q) break;
        L.disc(pts[q][0], pts[q][1], 0.7 * k, sh);
        L.disc(pts[q][0] - 1 * k, pts[q][1] + 1 * k, 0.7 * k, sh);
        L.disc(pts[q][0] + 1 * k, pts[q][1] + 1 * k, 0.7 * k, sh);
      }
    }

    return {
      cx: cx, top: cy - dorsalTop - 2 * k, bottom: cy + bellyLow + 2 * k,
      headX: cx + brx * 0.4, headY: cy, headR: brx * 0.5
    };
  }

  /* Geometry of the axolotl inside its layer. Unlike the fish it faces us,
     the way the land pets do: a big round head, a small body tucked under it,
     and a fan of gills out to either side. */
  function axoGeom(st, k) {
    var hrx = st.head[0] * 0.98 * k, hry = st.head[1] * 0.9 * k;
    var brx = st.body[0] * 1.02 * k, bry = st.body[1] * 0.8 * k;
    var cy = FEET * k - bry - 12 * k;          // it hovers just above the sand
    return {
      k: k, hrx: hrx, hry: hry, brx: brx, bry: bry,
      cx: (SIZE * k) / 2,
      by: cy,
      hy: cy - (bry + hry) * 0.62               // the head sits over the body
    };
  }

  /* One feathery gill branch: a stalk with a few plus-shaped fronds along it.
     Everything is laid down twice, oversized in the darker pink first, so
     neighbouring branches keep a rim between them instead of merging. */
  function axoGill(L, gx, gy, ang, len, dir, k, pad, col) {
    var ex = gx + Math.cos(ang) * len * dir, ey = gy + Math.sin(ang) * len;
    L.line(gx, gy, ex, ey, col, Math.max(1, 1.2 * k + pad));
    for (var i = 0; i < 3; i++) {
      var t = 0.36 + i * 0.32;
      var px = gx + (ex - gx) * t, py = gy + (ey - gy) * t;
      var r = (1.5 + i * 0.5) * k + pad;
      L.rect(px - r, py - r * 0.42, r * 2, r * 0.84, col);   // the plus shape
      L.rect(px - r * 0.42, py - r, r * 0.84, r * 2, col);
    }
  }

  /* An axolotl, facing us: the same care mechanics as everyone else, built out
     of a round head, six frilly gills, two little hands and a paddle tail. */
  function drawAxolotl(L, sp, st, opts, phase) {
    var k = Math.max(1, L.w / SIZE);
    var body = C(sp.fur), bodyL = C(sp.furLight), bodyD = C(sp.furDark);
    var belly = C(sp.cream), ink = C(sp.outline), fin = C(sp.finColor || sp.furLight);
    var frill = C(sp.frill || '#ff9ec4'), frillD = C(sp.frillDark || '#ec7dab');

    var g = axoGeom(st, k);
    var hrx = g.hrx, hry = g.hry, brx = g.brx, bry = g.bry;
    var bob = (opts.bob || 0) * k;
    var lean = (opts.lean || 0) * k;
    var sleep = opts.sleep || 0;
    var wag = (opts.tailWag || 0) * k;

    var cx = g.cx + lean * 0.5;
    var by = g.by + bob, hy = g.hy + bob + lean * 0.2;

    // the tail, hooking away to one side behind the body. The dark edge is
    // laid along the whole path first, or each step would paint over the last
    // step's colour and the tail would come out solid black.
    var tl = st.tail[0] * 0.78 * k;
    var tailAt = function (f) {
      return {
        x: cx + brx * 0.5 + f * tl * 0.78,
        y: by + bry * 0.25 + Math.sin(f * 2.2 + wag * 0.2) * tl * 0.42,
        r: bry * 0.5 * (1 - f * 0.78)
      };
    };
    for (var pass0 = 0; pass0 < 2; pass0++) {
      for (var i = 0; i <= tl; i++) {
        var t0 = tailAt(i / tl);
        if (pass0 === 0) L.disc(t0.x, t0.y, t0.r + 1, ink);
        else L.disc(t0.x, t0.y, t0.r, i / tl > 0.4 ? fin : body);
      }
    }

    // three gills each side, rooted just behind the cheeks
    var gy0 = hy - hry * 0.4, gx0 = hrx * 0.62;
    var arms = [[-0.8, 0.86], [-0.16, 0.96], [0.48, 0.82]];
    for (var pass = 0; pass < 2; pass++) {
      var pad = pass ? 0 : 1, col = pass ? frill : frillD;
      for (var a = 0; a < arms.length; a++) {
        var ay = gy0 + a * hry * 0.44;
        axoGill(L, cx - gx0, ay, arms[a][0], hrx * arms[a][1], -1, k, pad, col);
        axoGill(L, cx + gx0, ay, arms[a][0], hrx * arms[a][1], 1, k, pad, col);
      }
    }

    // body under the head, with a soft pale tummy
    L.ellipse(cx, by, brx + 1, bry + 1, ink);
    L.ellipse(cx, by, brx, bry, body);
    void belly;

    // two little hands held up in front, with a couple of stubby fingers each
    function hand(px) {
      var hy2 = by + bry * 0.42, hw = 2.7 * k, hh = 2.1 * k;
      L.ellipse(px, hy2, hw + 1, hh + 1, ink);
      L.ellipse(px, hy2, hw, hh, body);
      L.ellipse(px, hy2 - hh * 0.3, hw * 0.7, hh * 0.4, bodyL);
      L.rect(px - 0.5 * k, hy2 + hh * 0.15, Math.max(1, 0.8 * k), hh * 0.85, ink);
    }
    hand(cx - brx * 0.42);
    hand(cx + brx * 0.42);

    // head over the top of it all
    L.ellipse(cx, hy, hrx + 1, hry + 1, ink);
    L.ellipse(cx, hy, hrx, hry, body);
    L.ellipse(cx, hy - hry * 0.52, hrx * 0.52, hry * 0.22, bodyL);

    // face — two big eyes, blushed cheeks and a little "w" of a smile
    var eyeR = st.eye * 1.12 * k * (1 - 0.55 * sleep);
    var eyeY = hy + hry * 0.06;
    var eyeDX = hrx * 0.44;
    drawEye(L, sp, cx - eyeDX, eyeY, eyeR, opts.eyes || 'open', -1, k);
    drawEye(L, sp, cx + eyeDX, eyeY, eyeR, opts.eyes || 'open', 1, k);
    L.ellipse(cx - eyeDX - eyeR * 1.15, eyeY + eyeR * 0.9, 1.6 * k, 1.1 * k, C(sp.blush));
    L.ellipse(cx + eyeDX + eyeR * 1.15, eyeY + eyeR * 0.9, 1.6 * k, 1.1 * k, C(sp.blush));
    drawMouth(L, sp, cx, eyeY + eyeR * 1.15, opts.mouth || 'smile', k);

    // dirt, suds and drips are already scattered in this layer's coordinates
    if (opts.spots && opts.spots.length) {
      var mud = C('#8a6a45'), mudD = C('#6d5233');
      for (var d2 = 0; d2 < opts.spots.length; d2++) {
        var s2 = opts.spots[d2];
        if (s2.kind === 'tuft') {
          var dir2 = s2.flip ? 1 : -1;
          L.tri(s2.x - 1.6 * k, s2.y + 1.2 * k, s2.x + 1.6 * k, s2.y + 1.2 * k,
            s2.x + dir2 * 2 * k, s2.y - 2.6 * k, bodyD);
        } else {
          L.disc(s2.x, s2.y, 1.6 * k, mud);
          L.disc(s2.x, s2.y, 0.6 * k, mudD);
        }
      }
    }
    if (opts.foam && opts.foam.length) {
      for (var fm = 0; fm < opts.foam.length; fm++) {
        L.disc(opts.foam[fm].x, opts.foam[fm].y, opts.foam[fm].r * k, C('#ffffff'));
      }
    }
    if (opts.drips && opts.drips.length) {
      for (var dp = 0; dp < opts.drips.length; dp++) {
        L.ellipse(opts.drips[dp].x, opts.drips[dp].y, 1.5 * k, 2 * k, C('#7fd8ff'));
      }
    }

    var mg2 = {
      cx: cx, feet: FEET * k, top: hy - hry - 2 * k,
      headX: cx, headY: hy, headR: hrx, headRY: hry,
      bodyX: cx, bodyY: by, bodyRX: brx, bodyRY: bry
    };
    drawMonsterParts(L, sp, mg2, phase || 0, k, opts);

    L.outline(ink);
    drawMonsterGlow(L, sp, mg2, phase || 0, k);

    if (opts.sick) {
      var iceY = hy - hry - 1.5 * k;
      L.ellipse(cx, iceY, hrx * 0.5 + 1, hry * 0.22 + 1, ink);
      L.ellipse(cx, iceY, hrx * 0.5, hry * 0.22, C('#9adcf8'));
      L.ellipse(cx - hrx * 0.18, iceY - 0.6 * k, hrx * 0.16, 0.7 * k, C('#dff3ff'));
    }
    if (opts.hat) drawHat(L, opts.hat, cx, hy - hry * 0.5, hrx * 0.64, hry * 0.86, ink);
    if (opts.shine) {
      var sh = C('#ffffff');
      var pts = [[cx - hrx * 0.7, hy - hry * 0.6], [cx + hrx * 0.7, hy - hry * 0.5],
                 [cx, by + bry * 0.4]];
      for (var q = 0; q < pts.length; q++) {
        if ((opts.shine * 3) < q) break;
        L.disc(pts[q][0], pts[q][1], 0.7 * k, sh);
        L.disc(pts[q][0] - 1 * k, pts[q][1] + 1 * k, 0.7 * k, sh);
        L.disc(pts[q][0] + 1 * k, pts[q][1] + 1 * k, 0.7 * k, sh);
      }
    }

    return {
      cx: cx, top: hy - hry - 3 * k, bottom: by + bry + 3 * k,
      headX: cx, headY: hy, headR: hrx
    };
  }


  /* ------------------------------------------------------------------ */
  /* monsters                                                            */
  /* ------------------------------------------------------------------ */
  /* A mutated pet is the same animal underneath — same body, same care —
     wearing a darker palette, drawn a size bigger, with a few extra parts
     bolted on. Three phases, each one further gone than the last. */
  var MONSTERS = {
    dog: {
      kind: 'wolf',
      names: ['Hound', 'Dire Wolf', 'Werewolf'],
      skin: [
        { fur: '#eceae8', furLight: '#ffffff', furDark: '#2a2732', cream: '#f6f4f2',
          creamShade: '#d8d5d3', paw: '#eceae8', innerEar: '#c96b7a', blush: '#c98a92',
          tailTip: '#2a2732',
          earStyle: 'point', eyeStyle: 'round', eyeColor: '#d8323f', iris: '#ff8a8a',
          eyeScale: 0.92 },
        { fur: '#dcd9d8', furLight: '#f4f2f1', furDark: '#1f1c26', cream: '#e6e3e2',
          creamShade: '#c2bfbe', paw: '#dcd9d8', innerEar: '#b95a6a', blush: '#b57a84',
          tailTip: '#1f1c26',
          earStyle: 'point', eyeStyle: 'round', eyeColor: '#e01f2f', iris: '#ff8a8a',
          eyeScale: 0.9 },
        { fur: '#cbc8c8', furLight: '#e8e6e6', furDark: '#141118', cream: '#d6d3d3',
          creamShade: '#adaaaa', paw: '#cbc8c8', innerEar: '#a84a5a', blush: '#9a6570',
          tailTip: '#141118',
          outline: '#0d0b12', nose: '#0d0b12', earStyle: 'point',
          eyeStyle: 'round', eyeColor: '#e01f2f', iris: '#ff6b6b', eyeScale: 0.88 }
      ]
    },
    cat: {
      kind: 'tiger',
      names: ['Blue Tabby', 'Blue Tiger', 'Demon Tiger'],
      skin: [
        { fur: '#5fa8d8', furLight: '#8fcbe8', furDark: '#2a4f7a', cream: '#cfe9f8',
          creamShade: '#aed3ea', innerEar: '#f4a6c8', blush: '#7fb8dd', paw: '#cfe9f8',
          tailTip: '#2a4f7a', nose: '#ef8ab0', iris: '#ffb84d', whiskers: false,
          eyeStyle: 'glow', eyeScale: 1.2 },
        { fur: '#4a9fe0', furLight: '#79c4f2', furDark: '#1f4270', cream: '#bfe2f8',
          creamShade: '#9ccbe8', innerEar: '#f79ec4', blush: '#5fa8d8', paw: '#bfe2f8',
          tailTip: '#1f4270', nose: '#ef7fa8', iris: '#ff9f1a', whiskers: false,
          eyeStyle: 'glow', eyeScale: 1.32 },
        { fur: '#3f9ae8', furLight: '#79c9f7', furDark: '#17335c', cream: '#bfe6fb',
          creamShade: '#97cfee', innerEar: '#f79ec4', blush: '#3f8fd0', paw: '#bfe6fb',
          tailTip: '#0f2340', nose: '#f08ab0', outline: '#0b1c33', iris: '#ff8c1a',
          whiskers: false, eyeStyle: 'glow', eyeScale: 1.45 }
      ]
    },
    fox: {
      kind: 'fire',
      names: ['Ember Fox', 'Blaze Fox', 'Firefox'],
      skin: [
        { fur: '#e8622a', furLight: '#ff8a3d', furDark: '#a83a12', cream: '#ffd9a0',
          creamShade: '#f0bd7a', tailTip: '#ffd23d', iris: '#ffe14d' },
        { fur: '#d94314', furLight: '#ff7a1e', furDark: '#8a2a08', cream: '#ffc46a',
          creamShade: '#eda23f', tailTip: '#ffd23d', earTip: '#5e1602', iris: '#fff06a' },
        { fur: '#b32a06', furLight: '#ff5f00', furDark: '#5e1602', cream: '#ffb03d',
          creamShade: '#e08a15', tailTip: '#ffe14d', earTip: '#2a0d04', outline: '#2a0d04',
          nose: '#2a0d04', iris: '#fff06a' }
      ]
    },
    blackcat: {
      kind: 'void',
      names: ['Shade Cat', 'Night Stalker', 'Void Panther'],
      skin: [
        { fur: '#33304a', furLight: '#4a4668', furDark: '#201e30', cream: '#4a4668',
          creamShade: '#3d3a58', innerEar: '#8f5fd6', blush: '#5a3f80', iris: '#b06bff', whiskers: false },
        { fur: '#2a2740', furLight: '#3f3b5e', furDark: '#18162a', cream: '#3f3b5e',
          creamShade: '#332f4d', innerEar: '#a06fe6', blush: '#503a75', iris: '#c98bff', whiskers: false },
        { fur: '#1b1930', furLight: '#2e2a4d', furDark: '#0e0d1a', cream: '#2e2a4d',
          creamShade: '#241f3d', innerEar: '#b585f5', blush: '#3f2d61', outline: '#08070f',
          iris: '#e0a6ff', whiskers: false }
      ]
    },
    axolotl: {
      kind: 'cthulhu',
      names: ['Deep One', 'Kraken Pup', 'Cthulhu'],
      skin: [
        { fur: '#2f9a86', furLight: '#4dc0a8', furDark: '#1c6b5c', cream: '#bdf0e2',
          finColor: '#4dc0a8', frill: '#7fdc6a', frillDark: '#4fae42', iris: '#ffe14d',
          blush: '#1c6b5c' },
        { fur: '#25806f', furLight: '#3aa48e', furDark: '#144f45', cream: '#9adcc9',
          finColor: '#3aa48e', frill: '#6ecf52', frillDark: '#3f9433', iris: '#ffe14d',
          blush: '#144f45', eyeStyle: 'round', eyeColor: '#08201c' },
        { fur: '#17594f', furLight: '#248071', furDark: '#0c332d', cream: '#6fb8a5',
          finColor: '#248071', frill: '#57b83c', frillDark: '#2f7a24', outline: '#07211d',
          iris: '#ffd21f', blush: '#0c332d', eyeStyle: 'round', eyeColor: '#051714' }
      ]
    },
    fish: {
      kind: 'leviathan',
      names: ['Snapper', 'Deep Lurker', 'Leviathan'],
      skin: [
        { fur: '#d95f18', furLight: '#f0812f', furDark: '#a03f08', band: '#e8e2cf',
          finColor: '#e0701f', tailTip: '#e0701f', iris: '#ffe14d' },
        { fur: '#a83c12', furLight: '#cf5c1e', furDark: '#6e2409', band: '#d6cfb8',
          finColor: '#b8480f', tailTip: '#b8480f', iris: '#ffe14d' },
        { fur: '#6e2409', furLight: '#9a3d10', furDark: '#3d1204', band: '#bdb59c',
          finColor: '#7f2c08', tailTip: '#7f2c08', outline: '#180b04', iris: '#ffd21f' }
      ]
    }
  };

  function monsterOf(id) { return MONSTERS[id] || null; }

  /* The name shown for a pet: its species until it mutates, then whatever it
     has turned into. */
  function formLabel(id, phase) {
    var m = MONSTERS[id];
    if (phase > 0 && m) return m.names[Math.min(phase, 3) - 1];
    return (SPECIES[id] || SPECIES.fox).label;
  }

  /* The species table the drawing code sees while a pet is mutated. */
  function monsterSkin(sp, phase) {
    var m = MONSTERS[sp.id];
    if (!m || phase < 1) return sp;
    var out = {}, key;
    for (key in sp) if (Object.prototype.hasOwnProperty.call(sp, key)) out[key] = sp[key];
    var pal = m.skin[Math.min(phase, 3) - 1];
    for (key in pal) if (Object.prototype.hasOwnProperty.call(pal, key)) out[key] = pal[key];
    out.eyeStyle = pal.eyeStyle || (phase >= 2 ? 'glow' : sp.eyeStyle);
    out.eyeColor = out.outline;
    return out;
  }

  /* Fangs hanging from the muzzle — the one part almost every monster gets. */
  function fangs(L, g, k, len, wide, col, ink) {
    var y0 = g.headY + g.headRY * 0.5;
    var half = Math.max(1, 0.9 * k);
    for (var s = -1; s <= 1; s += 2) {
      var fx = g.headX + s * g.headR * wide;
      L.tri(fx - half - 1, y0 - 1, fx + half + 1, y0 - 1, fx + s * 0.5 * k, y0 + len + 1, ink);
      L.tri(fx - half, y0, fx + half, y0, fx + s * 0.5 * k, y0 + len, col);
    }
  }

  /* A fringe of ragged fur spikes around part of an ellipse — the tattered
     silhouette a shaggy monster wears. */
  function furSpikes(L, cx, cy, rx, ry, from, to, n, len, col, ink) {
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < n; i++) {
        var a = from + (to - from) * (n === 1 ? 0.5 : i / (n - 1));
        var ca = Math.cos(a), sa = Math.sin(a);
        var px = cx + ca * rx, py = cy + sa * ry;
        var wob = 0.6 + ((i * 7) % 5) * 0.16;          // uneven, like real fur
        var tipX = px + ca * len * wob, tipY = py + sa * len * wob;
        var w = len * (pass === 0 ? 0.44 : 0.3);
        var g2 = pass === 0 ? 1 : 0;
        L.tri(px - sa * w - ca, py + ca * w - sa,
          px + sa * w - ca, py - ca * w - sa,
          tipX + ca * g2, tipY + sa * g2, pass === 0 ? ink : col);
      }
    }
  }

  /* Claws on the front paws. */
  function claws(L, g, k, n, col, ink) {
    for (var s = -1; s <= 1; s += 2) {
      var px = g.bodyX + s * g.bodyRX * 0.55;
      for (var i = 0; i < n; i++) {
        var cxp = px + (i - (n - 1) / 2) * 1.7 * k;
        L.tri(cxp - 0.9 * k, g.feet - 1, cxp + 0.9 * k, g.feet - 1, cxp, g.feet + 2.4 * k, ink);
        L.tri(cxp - 0.5 * k, g.feet - 1, cxp + 0.5 * k, g.feet - 1, cxp, g.feet + 1.7 * k, col);
      }
    }
  }

  /* A row of spines following the curve of the back. */
  function spines(L, g, k, n, len, col, ink) {
    for (var i = 0; i < n; i++) {
      var f = (i + 0.5) / n;
      var sx = g.bodyX - g.bodyRX * 0.85 + f * g.bodyRX * 1.5;
      var dx = (sx - g.bodyX) / g.bodyRX;
      var sy = g.bodyY - g.bodyRY * Math.sqrt(Math.max(0, 1 - dx * dx)) + 1;
      var h = len * (0.55 + 0.45 * Math.sin(f * Math.PI));
      L.tri(sx - 1.5 * k, sy + 1, sx + 1.5 * k, sy + 1, sx - 0.6 * k, sy - h - 1, ink);
      L.tri(sx - k, sy + 1, sx + k, sy + 1, sx - 0.5 * k, sy - h, col);
    }
  }

  /* The extra parts each monster grows, laid on before the outline pass. */
  function drawMonsterParts(L, sp, g, phase, k, opts) {
    var m = MONSTERS[sp.id];
    if (!m || phase < 1) return;
    var p = Math.min(phase, 3);
    var ink = C(sp.outline), furD = C(sp.furDark), furL = C(sp.furLight);
    var bone = C('#f4efe2'), boneS = C('#cfc7b4');

    switch (m.kind) {
      case 'wolf': {
        /* A ragged black-and-white hound: tattered fur round the neck and
           shoulders, a black patch across one eye, dark claws, red eyes. */
        var shag = C(sp.fur), patch = C(sp.furDark), claw = C('#3a3540');

        // ruffs of fur down each cheek — kept off the chest, which stays smooth
        for (var rs = -1; rs <= 1; rs += 2) {
          furSpikes(L, g.headX, g.headY, g.headR * 0.96, g.headRY * 0.96,
            rs < 0 ? Math.PI * 0.72 : Math.PI * 0.28,
            rs < 0 ? Math.PI * 1.16 : -Math.PI * 0.16,
            4 + p, (1.8 + p * 1.1) * k, shag, ink);
        }
        // tufts breaking up the ear tips
        for (var es2 = -1; es2 <= 1; es2 += 2) {
          furSpikes(L, g.headX + es2 * g.headR * 0.7, g.headY - g.headRY * 0.55,
            g.headR * 0.3, g.headRY * 0.3,
            es2 < 0 ? Math.PI * 1.05 : Math.PI * 1.95,
            es2 < 0 ? Math.PI * 1.35 : Math.PI * 1.65,
            2, (1.4 + p * 0.7) * k, shag, ink);
        }

        // a black patch thrown across one side of the face
        L.ellipse(g.headX - g.headR * 0.46, g.headY - g.headRY * 0.34,
          g.headR * (0.34 + p * 0.09), g.headRY * (0.36 + p * 0.09), patch);
        L.ellipse(g.headX - g.headR * 0.72, g.headY - g.headRY * 0.62,
          g.headR * 0.26, g.headRY * 0.24, patch);
        if (p >= 2) {
          L.ellipse(g.headX - g.headR * 0.2, g.headY - g.headRY * 0.72,
            g.headR * 0.2, g.headRY * 0.18, patch);
        }
        // the eye it covers goes back on top, still glowing
        if (g.eyeR) {
          drawEye(L, sp, g.headX - g.eyeDX, g.eyeY, g.eyeR, opts.eyes || 'open', -1, k);
        }

        // a few more scattered blotches as it turns
        var blots = [[-0.62, 0.12], [0.58, 0.4], [-0.24, 0.66]];
        for (var bl = 0; bl < Math.min(blots.length, p); bl++) {
          L.ellipse(g.bodyX + blots[bl][0] * g.bodyRX, g.bodyY + blots[bl][1] * g.bodyRY,
            g.bodyRX * 0.11, g.bodyRY * 0.11, patch);
        }

        claws(L, g, k, 3, claw, ink);
        if (p >= 3) fangs(L, g, k, 1.8 * k, 0.4, C('#f4efe2'), ink);
        break;
      }

      case 'tiger': {
        /* A demon tiger: bold stripes, a mouthful of needle teeth and big
           burning eyes with a slit down the middle. */
        var stripe = C(sp.furDark), pale = C(sp.creamShade);

        // stripes down both flanks, and a couple on each front leg
        for (var fs = -1; fs <= 1; fs += 2) {
          for (var si = 0; si < 2 + p; si++) {
            var sy = g.bodyY - g.bodyRY * 0.45 + si * g.bodyRY * 0.42;
            var dy = (sy - g.bodyY) / g.bodyRY;
            var reach = g.bodyRX * Math.sqrt(Math.max(0, 1 - dy * dy));
            L.rect(g.bodyX + fs * reach - (fs > 0 ? 3.4 * k : 0), sy,
              3.4 * k, Math.max(1, 1.2 * k), stripe);
          }
          L.rect(g.bodyX + fs * g.bodyRX * 0.66 - 1.4 * k, g.feet - 3.4 * k,
            2.8 * k, Math.max(1, 1.1 * k), stripe);
        }

        // soft teardrops down the chest
        for (var td = 0; td < 5; td++) {
          var tcol = td % 2 ? -1 : 1;
          L.ellipse(g.bodyX + tcol * g.bodyRX * 0.2,
            g.bodyY + g.bodyRY * (-0.05 + td * 0.16), 0.9 * k, 1.5 * k, pale);
        }

        // heavy brows sweeping up and out over the eyes
        if (p >= 2 && g.eyeR) {
          for (var bs = -1; bs <= 1; bs += 2) {
            L.line(g.headX + bs * g.eyeDX * 0.4, g.eyeY - g.eyeR * 1.5,
              g.headX + bs * g.eyeDX * 1.7, g.eyeY - g.eyeR * 2.1, stripe,
              Math.max(1, 1.4 * k));
          }
        }

        // burning eyes: a yellow heart inside the orange, split by a slit
        if (g.eyeR) {
          var hot = C('#ffe14d'), slit = C(sp.outline);
          for (var es = -1; es <= 1; es += 2) {
            var ex2 = g.headX + es * g.eyeDX;
            L.ellipse(ex2, g.eyeY, g.eyeR * 0.5, g.eyeR * 0.66, hot);
            L.ellipse(ex2, g.eyeY, g.eyeR * 0.22, g.eyeR * 0.74, slit);
            L.disc(ex2 - g.eyeR * 0.42, g.eyeY - g.eyeR * 0.48, 0.5 * k, C('#ffffff'));
          }
        }

        // the grin: a wide dark maw lined with needle teeth
        var mw = g.headR * (0.42 + p * 0.1);
        var my = g.headY + g.headRY * 0.58;
        var mh = (0.9 + p * 0.38) * k;
        L.ellipse(g.headX, my, mw + 1, mh + 1, ink);
        L.ellipse(g.headX, my, mw, mh, C('#8f1f45'));
        L.ellipse(g.headX, my + mh * 0.35, mw * 0.6, mh * 0.4, C('#c8386b'));
        var nT2 = 3 + p * 2;
        for (var tt = 0; tt < nT2; tt++) {
          var tx2 = g.headX - mw + (tt + 0.5) * (mw * 2 / nT2);
          var tw2 = (mw / nT2) * 0.58;          // gums show between them
          L.tri(tx2 - tw2, my - mh, tx2 + tw2, my - mh, tx2, my + mh * 0.05, bone);
          if (tt % 2 === 0) {
            L.tri(tx2 - tw2 * 0.8, my + mh, tx2 + tw2 * 0.8, my + mh,
              tx2, my - mh * 0.05, bone);
          }
        }
        // and a long fang at each corner of the mouth
        for (var cf = -1; cf <= 1; cf += 2) {
          var fx2 = g.headX + cf * mw * 0.94;
          var fl = (1.1 + p * 0.7) * k;
          L.tri(fx2 - k - 1, my - mh, fx2 + k + 1, my - mh,
            fx2 + cf * 0.5 * k, my + fl + 1, ink);
          L.tri(fx2 - k, my - mh, fx2 + k, my - mh,
            fx2 + cf * 0.5 * k, my + fl, bone);
        }
        break;
      }

      case 'fire':
        // flames licking off the head, shoulders and tail tip
        var flame = C(p >= 3 ? '#ffe14d' : '#ffb03d'), flameHot = C('#fff3a0');
        // the flames sit on the crown and the shoulders, clear of the face
        var seats = [
          [g.headX - g.headR * 0.5, g.headY - g.headRY * 0.94, 0.9],
          [g.headX + g.headR * 0.5, g.headY - g.headRY * 0.94, 0.9],
          [g.bodyX - g.bodyRX * 0.72, g.bodyY - g.bodyRY * 0.9, 0.8],
          [g.bodyX + g.bodyRX * 0.72, g.bodyY - g.bodyRY * 0.9, 0.8]
        ];
        if (p >= 2) seats.push([g.headX, g.headY - g.headRY * 1.06, 1.3]);
        if (p >= 3) seats.push([g.bodyX, g.bodyY - g.bodyRY * 1.02, 1.05]);
        for (var fi = 0; fi < seats.length; fi++) {
          var st0 = seats[fi];
          var fh = (2.6 + p * 1.9) * k * st0[2];
          var flick = Math.sin((opts.bob || 0) * 2 + fi * 1.7) * 0.8 * k;
          L.tri(st0[0] - 1.7 * k, st0[1] + 1, st0[0] + 1.7 * k, st0[1] + 1,
            st0[0] + flick, st0[1] - fh - 1, ink);
          L.tri(st0[0] - 1.2 * k, st0[1] + 1, st0[0] + 1.2 * k, st0[1] + 1,
            st0[0] + flick, st0[1] - fh, flame);
          L.tri(st0[0] - 0.55 * k, st0[1] + 1, st0[0] + 0.55 * k, st0[1] + 1,
            st0[0] + flick * 0.6, st0[1] - fh * 0.55, flameHot);
        }
        if (p >= 2) fangs(L, g, k, (1.2 + p * 0.7) * k, 0.4, bone, ink);
        if (p >= 3) claws(L, g, k, 3, C('#ffe14d'), ink);
        break;

      case 'void':
        if (p >= 1) fangs(L, g, k, (1.2 + p * 0.8) * k, 0.4, bone, ink);
        if (p >= 2) {                                    // a second pair of eyes
          var ec = C(sp.iris || '#c98bff');
          for (var vs = -1; vs <= 1; vs += 2) {
            var vx = g.headX + vs * g.headR * 0.34, vy = g.headY - g.headRY * 0.62;
            L.ellipse(vx, vy, 1.5 * k, 1.1 * k, ink);
            L.ellipse(vx, vy, 0.9 * k, 0.7 * k, ec);
          }
        }
        if (p >= 3) {                                    // a crown of shards
          for (var cs = -2; cs <= 2; cs++) {
            var kx = g.headX + cs * g.headR * 0.42;
            var ky = g.headY - g.headRY * (0.86 - Math.abs(cs) * 0.06);
            var kh = (5.5 - Math.abs(cs) * 1.1) * k;
            L.tri(kx - 1.4 * k, ky, kx + 1.4 * k, ky, kx, ky - kh - 1, ink);
            L.tri(kx - k, ky, kx + k, ky, kx, ky - kh, C(sp.furLight));
          }
        }
        break;

      case 'cthulhu': {
        /* A packed beard of face tentacles, the way the old one is always
           drawn: a mass of them filling the lower face, each a fat column with
           a dark seam beside it. Ink goes down for all of them first, or each
           one would paint over the seam of the last. */
        var tentA = C(sp.fur), tentB = C(sp.furDark), tentC = C(sp.furLight);
        var nT = 4 + p * 2;                                  // 6, 8, 10
        var halfW = g.headR * (0.6 + p * 0.09);
        var step = (halfW * 2) / (nT - 1);
        var rad = Math.max(1, step * 0.42);
        var rootY = g.headY + g.headRY * 0.66;
        var maxLen = (5 + p * 3.6) * k;
        for (var pass = 0; pass < 2; pass++) {
          for (var ti = 0; ti < nT; ti++) {
            var f = (ti / (nT - 1)) * 2 - 1;                 // -1 .. 1 across
            var len = maxLen * (1 - Math.abs(f) * 0.38);
            var col = pass === 0 ? ink
              : (ti % 3 === 0 ? tentB : ti % 3 === 1 ? tentA : tentC);
            var r0 = rad + (pass === 0 ? 1 : 0);
            for (var q = 0; q <= len; q++) {
              var t = q / len;
              // they hang straight, then splay outward and curl at the tips
              var px = g.headX + f * halfW + f * t * t * 3.4 * k
                + Math.sin(t * 2.4 + ti * 1.3) * 0.7 * k;
              L.disc(px, rootY + q, r0 * (1 - t * 0.3), col);
            }
          }
        }
        // a couple of pale highlights, the way the reference catches the light
        for (var hl = 0; hl < 2; hl++) {
          var hx2 = g.headX + (hl ? 1 : -1) * halfW * 0.55;
          L.disc(hx2, rootY + maxLen * 0.42, rad * 0.5, tentC);
          L.disc(hx2, rootY + maxLen * 0.6, rad * 0.5, tentC);
        }
        if (p >= 2) {                                    // extra eyes on the brow
          var ce = C(sp.iris || '#ffe14d');
          for (var xs = -1; xs <= 1; xs += 2) {
            var xx = g.headX + xs * g.headR * 0.72, xy = g.headY - g.headRY * 0.55;
            L.ellipse(xx, xy, 1.7 * k, 1.3 * k, ink);
            L.ellipse(xx, xy, k, 0.8 * k, ce);
          }
        }
        if (p >= 3) {                                    // a pair of ragged wings
          for (var gs = -1; gs <= 1; gs += 2) {
            var wxr = g.headX + gs * g.headR * 0.86, wyr = g.headY + g.headRY * 0.36;
            var tipX = wxr + gs * 7.5 * k, tipY = wyr - 8.5 * k;
            L.tri(wxr, wyr, tipX + gs, tipY - 1, wxr + gs * 7 * k, wyr + 5 * k, ink);
            L.tri(wxr, wyr, tipX, tipY, wxr + gs * 6 * k, wyr + 4 * k, tentA);
            L.line(wxr, wyr, tipX, tipY, ink, k);          // the leading edge
            L.line(wxr + gs * 1.5 * k, wyr + 1.5 * k, wxr + gs * 5 * k, wyr - 2.5 * k, ink, k);
          }
        }
        break;
      }

      case 'leviathan':
        // a jagged grin along the front of the body
        var jaw = g.headX + g.headR * 0.4;
        for (var jt = 0; jt < 3 + p; jt++) {
          var jx = jaw - jt * 2.2 * k;
          var jy = g.headY + g.headRY * 0.42;
          L.tri(jx - 1.1 * k, jy - 1, jx + 1.1 * k, jy - 1, jx, jy + (1.4 + p * 0.9) * k, ink);
          L.tri(jx - 0.7 * k, jy - 1, jx + 0.7 * k, jy - 1, jx, jy + (1 + p * 0.8) * k, bone);
        }
        spines(L, g, k, 3 + p, (2 + p * 1.4) * k, furD, ink);
        if (p >= 3) {                                    // an angler's lure
          var lx = g.headX + g.headR * 0.2, ly = g.bodyY - g.bodyRY * 1.35;
          L.line(g.headX - g.headR * 0.1, g.bodyY - g.bodyRY, lx, ly, ink, k);
          L.disc(lx, ly, 2.2 * k, ink);
          L.disc(lx, ly, 1.6 * k, C('#fff3a0'));
        }
        void furL;
        break;
    }
  }

  /* Anything that should glow rather than be outlined goes on afterwards. */
  function drawMonsterGlow(L, sp, g, phase, k) {
    var m = MONSTERS[sp.id];
    if (!m || phase < 2) return;
    var glow = C(sp.iris || '#ffe14d');
    var pts = [[g.headX - g.headR * 0.44, g.headY], [g.headX + g.headR * 0.44, g.headY]];
    for (var i = 0; i < pts.length; i++) {
      L.disc(pts[i][0], pts[i][1], (phase >= 3 ? 0.9 : 0.6) * k, glow);
    }
  }

  function drawPet(L, speciesId, stageKey, opts) {
    opts = opts || {};
    var sp = SPECIES[speciesId] || SPECIES.fox;
    var st = STAGES[stageIndex(stageKey)];
    var phase = Math.min(3, Math.max(0, opts.phase || 0));
    if (phase > 0) sp = monsterSkin(sp, phase);
    if (sp.body === 'fish') return drawFish(L, sp, st, opts, phase);
    if (sp.body === 'axolotl') return drawAxolotl(L, sp, st, opts, phase);

    var k = Math.max(1, L.w / SIZE);
    var fur = C(sp.fur), furL = C(sp.furLight), furD = C(sp.furDark);
    var cream = C(sp.cream), creamS = C(sp.creamShade);
    var ink = C(sp.outline);

    var hrx = st.head[0] * k, hry = st.head[1] * k;
    var brx = st.body[0] * k, bry = st.body[1] * k;
    var bob = (opts.bob || 0) * k;
    var lean = (opts.lean || 0) * k;
    var sleep = opts.sleep || 0;

    var cx = L.w / 2;
    var feet = FEET * k;
    var bodyCY = feet - bry - 2.5 * k + bob * 0.5 + sleep * k;
    var headCY = bodyCY - (bry + hry) * 0.74 + bob + hry * 0.45 * sleep;
    var headCX = cx + lean;

    /* ---- tail (behind everything, sweeping up the left side) ---- */
    var tlen = st.tail[0] * k, tthick = st.tail[1] * k;
    var wag = (opts.tailWag || 0) * k;
    var t0x = cx - brx * 0.5, t0y = bodyCY + bry * 0.3;
    var t1x = t0x - tlen * 0.95, t1y = t0y + bry * 0.35 + wag * 1.5;
    var t2x = t0x - tlen * 0.62, t2y = t0y - tlen * 0.8 + wag * 2.4;
    var tailPts = [];
    for (var i = 0; i <= 22; i++) {
      var t = i / 22;
      var mt = 1 - t;
      var col = fur;
      if (t > 0.86) col = C(sp.tailTip);
      else if (!sp.tailBushy && t > 0.35 && Math.floor(t * 8) % 2 === 0) col = furD;
      tailPts.push({
        x: mt * mt * t0x + 2 * mt * t * t1x + t * t * t2x,
        y: mt * mt * t0y + 2 * mt * t * t1y + t * t * t2y,
        r: sp.tailBushy
          ? tthick * (0.7 + 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.1)))
          : tthick * (0.9 - 0.28 * t),
        c: col
      });
    }
    for (i = 0; i < tailPts.length; i++) L.disc(tailPts[i].x, tailPts[i].y, tailPts[i].r + 1, ink);
    for (i = 0; i < tailPts.length; i++) L.disc(tailPts[i].x, tailPts[i].y, tailPts[i].r, tailPts[i].c);

    /* ---- body (its own outline so the tail reads as separate) ---- */
    for (var s = -1; s <= 1; s += 2) {
      L.ellipse(cx + s * brx * 0.72, bodyCY + bry * 0.52, brx * 0.36 + 1, bry * 0.5 + 1, ink);
    }
    L.ellipse(cx, bodyCY, brx + 1, bry + 1, ink);
    for (s = -1; s <= 1; s += 2) {
      L.ellipse(cx + s * brx * 0.72, bodyCY + bry * 0.52, brx * 0.36, bry * 0.5, fur);
    }
    L.ellipse(cx, bodyCY, brx, bry, fur);
    L.ellipse(cx - brx * 0.2, bodyCY - bry * 0.35, brx * 0.5, bry * 0.4, furL);
    // chest patch
    L.ellipse(cx, bodyCY + bry * 0.3, brx * 0.55, bry * 0.72, cream);
    L.ellipse(cx + brx * 0.14, bodyCY + bry * 0.6, brx * 0.26, bry * 0.3, creamS);

    /* ---- front legs + paws ---- */
    var pawC = C(sp.paw);
    for (var s2 = -1; s2 <= 1; s2 += 2) {
      var px = cx + s2 * brx * 0.55;
      var legH = Math.round(bry * 0.5) + k;
      L.rect(px - brx * 0.22 - 1, feet - legH, brx * 0.44 + 2, legH + 1, ink);
      L.rect(px - brx * 0.22, feet - legH, brx * 0.44, legH, pawC);
    }

    /* ---- ears (drawn before the head so the bases tuck under it) ---- */
    var earLen = st.ear * k * (1 - 0.18 * sleep);
    var wig = (opts.earWig || 0) * k + sleep * 1.6 * k;
    function grow(p, g2, k) {
      return { x: g2.x + (p.x - g2.x) * k, y: g2.y + (p.y - g2.y) * k };
    }
    if (sp.earStyle === 'floppy') {
      // hound ears hang down beside the head instead of standing up
      var earCol = C(sp.earColor || sp.furDark);
      for (var sf = -1; sf <= 1; sf += 2) {
        var fex = headCX + sf * hrx * 0.92 + sf * wig * 0.35;
        var fey = headCY - hry * 0.3 + earLen * 0.4;
        var frx = hrx * 0.25, fry = earLen * 0.62;
        L.ellipse(fex, fey, frx + 1, fry + 1, ink);
        L.ellipse(fex, fey, frx, fry, earCol);
        L.ellipse(fex - sf * frx * 0.25, fey - fry * 0.3, frx * 0.45, fry * 0.4, C(sp.innerEar));
      }
    } else
    for (var s3 = -1; s3 <= 1; s3 += 2) {
      var baseIn = { x: headCX + s3 * hrx * 0.16, y: headCY - hry * 0.84 };
      var baseOut = { x: headCX + s3 * hrx * 0.95, y: headCY - hry * 0.28 };
      var tip = {
        x: headCX + s3 * (hrx * (0.66 + sp.earLean) + wig * 0.6),
        y: headCY - hry * 0.7 - earLen
      };
      var gx = (baseIn.x + baseOut.x + tip.x) / 3, gy = (baseIn.y + baseOut.y + tip.y) / 3;
      var g = { x: gx, y: gy };
      var big = 1 + 2.4 * k / Math.max(4 * k, earLen + hrx * 0.5);
      var oi = grow(baseIn, g, big), oo = grow(baseOut, g, big), ot = grow(tip, g, big);
      L.tri(oi.x, oi.y, oo.x, oo.y, ot.x, ot.y, ink);
      L.tri(baseIn.x, baseIn.y, baseOut.x, baseOut.y, tip.x, tip.y, fur);
      // inner ear, pulled toward the centroid
      var a = grow(baseIn, g, 0.58), b = grow(baseOut, g, 0.58), c = grow(tip, g, 0.72);
      L.tri(a.x, a.y, b.x, b.y, c.x, c.y, C(sp.innerEar));
      if (sp.earTip && earLen > 3.4 * k) {
        var tipK = 0.3;
        L.tri(tip.x, tip.y,
          tip.x + (baseIn.x - tip.x) * tipK, tip.y + (baseIn.y - tip.y) * tipK,
          tip.x + (baseOut.x - tip.x) * tipK, tip.y + (baseOut.y - tip.y) * tipK,
          C(sp.earTip));
      }
    }

    /* ---- head (outlined so it sits clearly on top of the body) ---- */
    L.ellipse(headCX, headCY, hrx + 1, hry + 1, ink);
    L.ellipse(headCX, headCY, hrx, hry, fur);
    L.ellipse(headCX, headCY - hry * 0.42, hrx * 0.62, hry * 0.38, furL);

    // muzzle
    var mz = sp.muzzleScale || 1;
    L.ellipse(headCX, headCY + hry * 0.5, hrx * 0.52 * mz, hry * 0.34 * mz, cream);
    if (sp.cheekPatch) {
      for (var s4 = -1; s4 <= 1; s4 += 2) {
        L.ellipse(headCX + s4 * hrx * 0.62, headCY + hry * 0.3, hrx * 0.34, hry * 0.32, cream);
      }
      L.ellipse(headCX, headCY + hry * 0.34, hrx * 0.36, hry * 0.3, cream);
    }

    // dalmatian spots — fixed positions so they never flicker
    if (sp.coatSpots) {
      var sc = C(sp.furDark);
      var bodySpots = [[-0.55, -0.15], [0.5, 0.1], [0.05, 0.45], [-0.3, 0.5], [0.62, -0.3]];
      for (var bs = 0; bs < bodySpots.length; bs++) {
        L.ellipse(cx + bodySpots[bs][0] * brx, bodyCY + bodySpots[bs][1] * bry,
          brx * 0.17, bry * 0.17, sc);
      }
      L.ellipse(headCX - hrx * 0.6, headCY - hry * 0.58, hrx * 0.19, hry * 0.17, sc);
      L.ellipse(headCX + hrx * 0.52, headCY - hry * 0.58, hrx * 0.15, hry * 0.14, sc);
    }

    // forehead stripes (tabby)
    if (sp.foreheadStripes) {
      for (var st2 = -1; st2 <= 1; st2++) {
        L.rect(headCX + st2 * 2.4 * k - 0.5 * k, headCY - hry * 0.74, k, 2.6 * k, furD);
      }
    }

    /* ---- face ---- */
    var eyeR = st.eye * k * (sp.eyeScale || 1);
    var eyeY = headCY - hry * 0.02;
    var eyeDX = hrx * 0.44;
    var eyes = opts.eyes || 'open';
    drawEye(L, sp, headCX - eyeDX, eyeY, eyeR, eyes === 'wink' ? 'blink' : eyes, -1, k);
    drawEye(L, sp, headCX + eyeDX, eyeY, eyeR, eyes, 1, k);

    // blush — feverish and darker when the pet is poorly
    if (opts.blush !== false) {
      var blushCol = C(opts.sick ? '#e8607a' : sp.blush);
      for (var s5 = -1; s5 <= 1; s5 += 2) {
        L.ellipse(headCX + s5 * hrx * 0.62, headCY + hry * 0.36, hrx * (opts.sick ? 0.24 : 0.19),
          (opts.sick ? 1.4 : 1) * k, blushCol);
      }
    }

    // nose + mouth
    var noseY = headCY + hry * 0.34;
    var ns = sp.noseScale || 1;
    L.ellipse(headCX, noseY, 1.1 * ns * k, 0.9 * ns * k, C(sp.nose));
    drawMouth(L, sp, headCX, noseY + 2.4 * k, opts.mouth || 'smile', k);

    // whiskers — kept inside the silhouette so the outline pass leaves them thin
    if (sp.whiskers && hrx >= 8.5 * k) {
      var wc = C('#ffffff');
      for (var s6 = -1; s6 <= 1; s6 += 2) {
        L.line(headCX + s6 * hrx * 0.5, noseY - 0.5 * k, headCX + s6 * hrx * 0.98, noseY - 1.5 * k, wc, k);
        L.line(headCX + s6 * hrx * 0.5, noseY + 1.5 * k, headCX + s6 * hrx * 0.96, noseY + 1.5 * k, wc, k);
      }
    }
    /* ---- scrubbable spots: mud to wash off, tufts to brush out ---- */
    if (opts.spots && opts.spots.length) {
      var mud = C('#8a6a45'), mudD = C('#6d5233');
      for (var d2 = 0; d2 < opts.spots.length; d2++) {
        var sp2 = opts.spots[d2];
        var sx = sp2.x, sy = sp2.y + bob * 0.5;
        // spots on the head ride along with the head tilt
        var dxh = (sp2.x - cx) / hrx, dyh = (sp2.y - (headCY - bob)) / hry;
        if (dxh * dxh + dyh * dyh <= 1.1) { sx += lean; sy += bob * 0.5; }
        if (sp2.kind === 'tuft') {
          var dir = sp2.flip ? 1 : -1;
          L.tri(sx - 1.6 * k, sy + 1.2 * k, sx + 1.6 * k, sy + 1.2 * k,
            sx + dir * 2 * k, sy - 2.6 * k, furD);
          L.line(sx + dir * 0.6 * k, sy + 0.6 * k, sx + dir * 1.6 * k, sy - 1.8 * k, furL, k);
        } else {
          L.disc(sx, sy, 1.6 * k, mud);
          L.disc(sx, sy, 0.6 * k, mudD);
        }
      }
    }

    /* ---- soap foam stuck to the fur ---- */
    if (opts.foam && opts.foam.length) {
      for (var f = 0; f < opts.foam.length; f++) {
        var fm = opts.foam[f];
        L.disc(fm.x, fm.y + bob * 0.5, fm.r * k, C('#ffffff'));
        L.disc(fm.x - 0.8 * k, fm.y - 0.8 * k + bob * 0.5, fm.r * 0.4 * k, C('#eaf9ff'));
      }
    }

    /* ---- rinse water still clinging on, waiting to be towelled off ---- */
    if (opts.drips && opts.drips.length) {
      for (var dp = 0; dp < opts.drips.length; dp++) {
        var dr = opts.drips[dp];
        var dy2 = dr.y + bob * 0.5;
        L.ellipse(dr.x, dy2, 1.5 * k, 2 * k, C('#7fd8ff'));
        L.disc(dr.x - 0.8 * k, dy2 - 0.8 * k, 0.5 * k, C('#d6f2ff'));
      }
    }

    var mg3 = {
      cx: cx, feet: feet, top: headCY - hry - earLen,
      headX: headCX, headY: headCY, headR: hrx, headRY: hry,
      bodyX: cx, bodyY: bodyCY, bodyRX: brx, bodyRY: bry,
      eyeR: eyeR, eyeDX: eyeDX, eyeY: eyeY
    };
    drawMonsterParts(L, sp, mg3, phase, k, opts);

    /* ---- outline ---- */
    L.outline(ink);
    drawMonsterGlow(L, sp, mg3, phase, k);

    if (opts.sick) {
      var iceX = headCX, iceY = headCY - hry * 0.95;
      L.ellipse(iceX, iceY, hrx * 0.42 + 1, hry * 0.24 + 1, ink);
      L.ellipse(iceX, iceY, hrx * 0.42, hry * 0.24, C('#9adcf8'));
      L.ellipse(iceX - hrx * 0.14, iceY - 0.6 * k, hrx * 0.16, 0.7 * k, C('#dff3ff'));
      L.rect(iceX - k, iceY - hry * 0.24 - 2 * k, 3 * k, 2 * k, ink);
      L.rect(iceX - k, iceY - hry * 0.24 - 2 * k, 2 * k, k, C('#7fb8d8'));
    }

    if (opts.hat) drawHat(L, opts.hat, headCX, headCY, hrx, hry, ink);

    if (opts.shine) {
      var sh = C('#ffffff');
      var pts = [[headCX - hrx * 0.55, headCY - hry * 0.6], [cx + brx * 0.5, bodyCY - bry * 0.5],
                 [headCX + hrx * 0.5, headCY - hry * 0.75]];
      for (var q = 0; q < pts.length; q++) {
        if ((opts.shine * 3) < q) break;
        L.disc(pts[q][0], pts[q][1], 0.6 * k, sh);
        L.disc(pts[q][0] - k, pts[q][1] + k, 0.6 * k, sh);
        L.disc(pts[q][0] + k, pts[q][1] + k, 0.6 * k, sh);
        L.disc(pts[q][0], pts[q][1] + 2 * k, 0.6 * k, sh);
      }
    }

    return {
      cx: cx,
      top: headCY - hry - earLen,
      bottom: feet,
      headX: headCX,
      headY: headCY,
      headR: hrx
    };
  }

  /* Prize hats, drawn on top of the finished sprite with their own outline so
     they read as something sitting on the pet rather than part of it. */
  function drawHat(L, id, hx, hy, hrx, hry, ink) {
    var top = hy - hry * 0.92;
    if (id === 'party') {
      var ax = hx + 1, ay = top - hry * 0.85;
      L.tri(ax - 5, top + 1, ax + 5, top + 1, ax + 1, ay - 1, ink);
      L.tri(ax - 4, top, ax + 4, top, ax + 1, ay, C('#ff5f8f'));
      L.tri(ax - 4, top, ax, top, ax + 1, ay, C('#ff8fb8'));
      L.rect(ax - 4, top - 1, 8, 2, C('#ffd93d'));
      L.disc(ax + 1, ay, 1.9, ink);
      L.disc(ax + 1, ay, 1.4, C('#ffd93d'));
    } else if (id === 'crown') {
      L.rect(hx - 6, top - 3, 12, 5, ink);
      L.tri(hx - 6, top - 2, hx - 6, top - 8, hx - 2, top - 3, ink);
      L.tri(hx, top - 9, hx - 3, top - 2, hx + 3, top - 2, ink);
      L.tri(hx + 6, top - 2, hx + 6, top - 8, hx + 2, top - 3, ink);
      L.rect(hx - 5, top - 2, 10, 3, C('#ffb01a'));
      L.rect(hx - 5, top - 2, 10, 1, C('#ffe07a'));
      L.tri(hx - 5, top - 2, hx - 5, top - 7, hx - 2, top - 3, C('#ffd93d'));
      L.tri(hx, top - 8, hx - 2.5, top - 2, hx + 2.5, top - 2, C('#ffd93d'));
      L.tri(hx + 5, top - 2, hx + 5, top - 7, hx + 2, top - 3, C('#ffd93d'));
      L.set(hx - 3, top, C('#ff5f8f'));
      L.set(hx, top, C('#7fd8ff'));
      L.set(hx + 3, top, C('#8ee86a'));
    } else if (id === 'witch') {
      var wy = top + 1;
      L.tri(hx - 6, wy - 1, hx + 6, wy - 1, hx + 4, wy - 12, ink);   // cone
      L.tri(hx + 3, wy - 9, hx + 5, wy - 11, hx + 9, wy - 15, ink);  // floppy tip
      L.ellipse(hx, wy, 9.5, 3.2, ink);                              // brim
      L.ellipse(hx, wy - 0.6, 8.5, 2.4, C('#4a2f6e'));
      L.tri(hx - 5, wy - 2, hx + 5, wy - 2, hx + 3.6, wy - 11, C('#4a2f6e'));
      L.tri(hx - 4, wy - 2, hx, wy - 2, hx + 2, wy - 10, C('#63409c'));
      L.tri(hx + 3.6, wy - 9.4, hx + 4.6, wy - 10.6, hx + 8, wy - 14, C('#4a2f6e'));
      L.rect(hx - 5, wy - 4, 10, 2, C('#ffd93d'));                   // band
      L.rect(hx - 1.5, wy - 4.6, 3, 3, C('#ffb01a'));                // buckle
    } else if (id === 'bow') {
      var bx = hx - hrx * 0.7, by = top + 1;
      L.tri(bx, by, bx - 6, by - 4, bx - 6, by + 4, ink);
      L.tri(bx, by, bx + 6, by - 4, bx + 6, by + 4, ink);
      L.tri(bx, by, bx - 5, by - 3, bx - 5, by + 3, C('#ff5f8f'));
      L.tri(bx, by, bx + 5, by - 3, bx + 5, by + 3, C('#ff5f8f'));
      L.ellipse(bx - 3, by, 1.6, 1.9, C('#ff8fb8'));
      L.ellipse(bx + 3, by, 1.6, 1.9, C('#ff8fb8'));
      L.disc(bx, by, 2.1, ink);
      L.disc(bx, by, 1.5, C('#e8629a'));
    }
  }

  /* Geometry of a stage, in layer coordinates — used to scatter dirt and
     tufts inside the body and head. */
  function metrics(stageKey, speciesId, k) {
    var st = STAGES[stageIndex(stageKey)];
    var sp = SPECIES[speciesId];
    if (sp && sp.body === 'axolotl') {
      var a = axoGeom(st, k || scaleOf(speciesId));
      return {
        cx: a.cx, feet: FEET * a.k,
        bodyCY: a.by, bodyRX: a.brx * 0.8, bodyRY: a.bry * 0.75,
        headCX: a.cx,
        headCY: a.hy, headRX: a.hrx * 0.7, headRY: a.hry * 0.7,
        top: a.hy - a.hry
      };
    }
    if (sp && sp.body === 'fish') {
      // a fish is one long body with no separate head, and it is drawn into a
      // layer of its own size
      var g = fishGeom(st, k || scaleOf(speciesId));
      return {
        cx: g.cx, feet: FEET * g.k,
        bodyCY: g.cy, bodyRX: g.brx * 0.78, bodyRY: g.bry * 0.72,
        headCY: g.cy - g.bry * 0.15, headRX: g.brx * 0.42, headRY: g.bry * 0.5,
        top: g.cy - g.bry - 4 * g.k
      };
    }
    var lk = k || scaleOf(speciesId);
    var hrx = st.head[0] * lk, hry = st.head[1] * lk;
    var brx = st.body[0] * lk, bry = st.body[1] * lk;
    var bodyCY = FEET * lk - bry - 2.5 * lk;
    var headCY = bodyCY - (bry + hry) * 0.74;
    return {
      cx: (SIZE * lk) / 2, feet: FEET * lk,
      bodyCY: bodyCY, bodyRX: brx, bodyRY: bry,
      headCY: headCY, headRX: hrx, headRY: hry,
      top: headCY - hry - st.ear * lk
    };
  }

  global.Pets = {
    SPECIES: SPECIES,
    STAGES: STAGES,
    GROWTH_SCALE: GROWTH_SCALE,
    SIZE: SIZE,
    FEET: FEET,
    scaleOf: scaleOf,
    spanOf: spanOf,
    MONSTERS: MONSTERS,
    monsterOf: monsterOf,
    formLabel: formLabel,
    stageFor: stageFor,
    metrics: metrics,
    stageIndex: stageIndex,
    drawPet: drawPet,
    drawHat: drawHat,
    HEART: HEART
  };
})(window);
