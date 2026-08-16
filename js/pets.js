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
  var PET_SCALE = { fish: 2, axolotl: 1.85 };
  function scaleOf(id) { return PET_SCALE[id] || 1; }

  // roughly how many layer pixels wide the sprite is per unit of scale, so the
  // game can shrink a big pet that would not fit the scene
  var PET_SPAN = { fish: 33, axolotl: 31 };
  function spanOf(id) { return PET_SPAN[id] || 30; }

  function drawEye(L, sp, ex, ey, r, state, side) {
    side = side || -1;
    var dark = C(sp.eyeColor);
    var white = C('#ffffff');

    switch (state) {
      case 'blink':
        L.rect(ex - r, ey, r * 2, 1, dark);
        break;

      case 'sleep':   // a contented downward curve
        L.set(ex - r, ey - 1, dark);
        L.rect(ex - r + 1, ey, r * 2 - 2, 1, dark);
        L.set(ex + r, ey - 1, dark);
        break;

      case 'angry':
        L.ellipse(ex, ey + r * 0.35, r * 0.8, r * 0.5, dark);
        L.line(ex + side * r * 1.05, ey - r * 1.15, ex - side * r * 0.95, ey - r * 0.3, dark, 1);
        break;

      case 'happy':
        L.line(ex - r, ey + r * 0.55, ex, ey - r * 0.45, dark, 1);
        L.line(ex, ey - r * 0.45, ex + r, ey + r * 0.55, dark, 1);
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

  function drawMouth(L, sp, mx, my, state) {
    var dark = C(sp.outline);
    switch (state) {
      case 'open':
        L.ellipse(mx, my + 1, 2.2, 1.8, dark);
        L.ellipse(mx, my + 1.6, 1.2, 0.9, C('#ff7f9f'));
        break;
      case 'wide':
        L.ellipse(mx, my + 1.2, 3, 2.4, dark);
        L.ellipse(mx, my + 2, 1.7, 1.2, C('#ff7f9f'));
        break;
      case 'frown':
        L.set(mx - 2, my + 1, dark);
        L.set(mx - 1, my, dark);
        L.set(mx, my, dark);
        L.set(mx + 1, my, dark);
        L.set(mx + 2, my + 1, dark);
        break;
      case 'angry':
        L.set(mx - 2, my + 1, dark);
        L.set(mx - 1, my, dark);
        L.set(mx, my + 1, dark);
        L.set(mx + 1, my, dark);
        L.set(mx + 2, my + 1, dark);
        L.set(mx - 1, my + 1, dark);
        L.set(mx + 1, my + 1, dark);
        break;

      case 'snooze':
        L.ellipse(mx, my + 1, 1.4, 1.1, dark);
        break;

      case 'none':
        break;
      default: // smile — a little "w"
        L.set(mx - 2, my, dark);
        L.set(mx - 1, my + 1, dark);
        L.set(mx, my, dark);
        L.set(mx + 1, my + 1, dark);
        L.set(mx + 2, my, dark);
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
  function drawFish(L, sp, st, opts) {
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

    L.outline(ink);

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

  /* Geometry of the axolotl inside its layer — a long low body with a big
     round head at the front and a paddle tail behind. */
  function axoGeom(st, k) {
    var brx = st.body[0] * 1.15 * k, bry = st.body[1] * 0.84 * k;
    return {
      k: k, brx: brx, bry: bry,
      hrx: st.head[0] * 0.7 * k, hry: st.head[1] * 0.64 * k,
      cx: (SIZE * k) / 2,
      cy: FEET * k - bry - 13 * k     // it hovers just above the sand
    };
  }

  /* The axolotl's smile — a wide, permanently pleased curve. */
  function axoMouth(L, sp, mx, my, state, k) {
    var dark = C(sp.outline);
    var w = 3.1 * k;
    switch (state) {
      case 'open':
      case 'wide':
        L.ellipse(mx, my + 0.6 * k, w * 0.55, 1.7 * k, dark);
        L.ellipse(mx, my + 1 * k, w * 0.32, 0.9 * k, C('#ff7f9f'));
        break;
      case 'frown':
        L.rect(mx - w * 0.5, my + 0.8 * k, w, 1 * k, dark);
        L.rect(mx - w * 0.6, my, 1 * k, 1 * k, dark);
        L.rect(mx + w * 0.5, my, 1 * k, 1 * k, dark);
        break;
      case 'angry':
        L.rect(mx - w * 0.5, my + 0.4 * k, w, 1 * k, dark);
        break;
      case 'snooze':
        L.ellipse(mx, my + 0.4 * k, w * 0.3, 1 * k, dark);
        break;
      default:                        // the big smile
        L.rect(mx - w * 0.5, my + 0.9 * k, w, 1 * k, dark);
        L.rect(mx - w * 0.62, my, 1 * k, 1 * k, dark);
        L.rect(mx - w * 0.62, my + 0.5 * k, 1 * k, 1 * k, dark);
        L.rect(mx + w * 0.5, my, 1 * k, 1 * k, dark);
        L.rect(mx + w * 0.5, my + 0.5 * k, 1 * k, 1 * k, dark);
    }
  }

  /* An axolotl: the same care mechanics as everyone else, but built out of a
     paddle tail, six feathery gills and four stubby legs. */
  function drawAxolotl(L, sp, st, opts) {
    var k = Math.max(1, L.w / SIZE);
    var body = C(sp.fur), bodyL = C(sp.furLight), bodyD = C(sp.furDark);
    var belly = C(sp.cream), ink = C(sp.outline), fin = C(sp.finColor || sp.furLight);
    var frill = C(sp.frill || '#ff9ec4'), frillD = C(sp.frillDark || '#ec7dab');

    var g = axoGeom(st, k);
    var brx = g.brx, bry = g.bry, hrx = g.hrx, hry = g.hry;
    var bob = (opts.bob || 0) * k;
    var lean = (opts.lean || 0) * k;
    var sleep = opts.sleep || 0;
    var wag = (opts.tailWag || 0) * k;

    var cx = g.cx + lean * 0.6;
    var cy = g.cy + bob;
    var hx = cx + brx * 0.7, hy = cy - bry * 0.28;

    // the paddle tail: a thin core that tapers to a point, inside a fin
    // membrane that swells early and narrows again at the tip
    var tx = cx - brx * 0.72, tl = st.tail[0] * 0.7 * k;
    for (var i = 0; i <= tl; i++) {
      var f = i / tl;
      var yc = cy + Math.sin(f * 1.7) * wag * 1.1;
      var core = bry * (0.48 - 0.44 * f);
      var mem = bry * 0.52 * Math.sin(Math.pow(f, 0.8) * Math.PI);
      if (core + mem < 0.6) continue;
      L.rect(tx - i, yc - core - mem, 1, (core + mem) * 2, fin);
      if (core > 0.5) L.rect(tx - i, yc - core, 1, core * 2, body);
    }

    // the ridge along the back, sitting on top of the body line
    for (var rx2 = -brx * 0.85; rx2 <= brx * 0.4; rx2 += 1) {
      var rf = (rx2 + brx * 0.85) / (brx * 1.25);
      var bodyTop = cy - bry * Math.sqrt(Math.max(0, 1 - Math.pow(rx2 / brx, 2)));
      var rh = Math.sin(rf * Math.PI) * bry * 0.34;
      if (rh > 0.5) L.rect(cx + rx2, bodyTop - rh, 1, rh + 1, fin);
    }

    // body
    L.ellipse(cx, cy, brx + 1, bry + 1, ink);
    L.ellipse(cx, cy, brx, bry, body);
    L.ellipse(cx - brx * 0.2, cy - bry * 0.45, brx * 0.5, bry * 0.36, bodyL);
    L.ellipse(cx - brx * 0.05, cy + bry * 0.58, brx * 0.62, bry * 0.32, belly);

    // four stubby legs, the far pair a shade darker so they read as behind
    function leg(lx, ly, len, dir, col) {
      L.ellipse(lx, ly + len * 0.3, 1.7 * k, len * 0.62, col);
      L.ellipse(lx + dir * 1 * k, ly + len, 2.5 * k, 1.3 * k, col);
      for (var t3 = 0; t3 < 3; t3++) {
        L.set(lx + dir * 1 * k + (t3 - 1) * 1.6 * k, ly + len + 1.5 * k, ink);
      }
    }
    leg(cx + brx * 0.38, cy + bry * 0.48, bry * 0.75, 1, bodyD);
    leg(cx - brx * 0.36, cy + bry * 0.48, bry * 0.75, -1, bodyD);
    leg(cx + brx * 0.5, cy + bry * 0.62, bry * 0.75, 1, body);
    leg(cx - brx * 0.24, cy + bry * 0.62, bry * 0.75, -1, body);

    // the gills go on after the body but before the head, so the head hides
    // their roots and the body cannot swallow the fans
    var nx = hx - hrx * 0.74, ny = hy - hry * 0.16;
    /* Each frill is laid down twice — once oversized in the darker pink, then
       again on top — so neighbouring frills keep a rim between them instead of
       melting into one lump. */
    function frillArm(ang, len, pad, col) {
      var ex = nx - Math.cos(ang) * len, ey = ny - Math.sin(ang) * len;
      L.line(nx, ny, ex, ey, col, Math.max(1, 1.1 * k + pad));
      for (var fr = 0; fr < 3; fr++) {
        var ft = 0.4 + fr * 0.3;
        L.disc(nx + (ex - nx) * ft, ny + (ey - ny) * ft, (0.85 + fr * 0.3) * k + pad, col);
      }
      L.disc(ex, ey, 1.5 * k + pad, col);
    }
    var arms = [[1.5, hrx * 1.3], [0.98, hrx * 1.42], [0.46, hrx * 1.2]];
    for (var gi = 0; gi < arms.length; gi++) {
      frillArm(arms[gi][0], arms[gi][1], 1, frillD);
      frillArm(arms[gi][0], arms[gi][1], 0, frill);
    }

    // head over the front of the body
    L.ellipse(hx, hy, hrx + 1, hry + 1, ink);
    L.ellipse(hx, hy, hrx, hry, body);
    L.ellipse(hx - hrx * 0.1, hy - hry * 0.42, hrx * 0.6, hry * 0.36, bodyL);

    // face — one eye, a blush and that famous smile
    var eyeR = st.eye * 0.74 * k * (1 - 0.55 * sleep);
    var eyeX = hx + hrx * 0.3, eyeY = hy - hry * 0.3;
    // a white ball behind the expression, so a blink or a squint still reads
    L.ellipse(eyeX, eyeY, eyeR * 1.3 + 1, eyeR * 1.4 + 1, ink);
    L.ellipse(eyeX, eyeY, eyeR * 1.3, eyeR * 1.4, C('#ffffff'));
    drawEye(L, sp, eyeX, eyeY, eyeR, opts.eyes || 'open', 1);
    L.ellipse(eyeX - eyeR * 2.4, eyeY + eyeR * 2.1, 1.5 * k, 0.9 * k, C(sp.blush));
    axoMouth(L, sp, hx + hrx * 0.18, hy + hry * 0.42, opts.mouth || 'smile', k);

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

    L.outline(ink);

    if (opts.sick) {
      var iceY = hy - hry - 1.5 * k;
      L.ellipse(hx, iceY, hrx * 0.5 + 1, hry * 0.24 + 1, ink);
      L.ellipse(hx, iceY, hrx * 0.5, hry * 0.24, C('#9adcf8'));
      L.ellipse(hx - hrx * 0.18, iceY - 0.6 * k, hrx * 0.16, 0.7 * k, C('#dff3ff'));
    }
    if (opts.hat) drawHat(L, opts.hat, hx, hy - hry * 0.5, hrx * 0.62, hry * 0.8, ink);
    if (opts.shine) {
      var sh = C('#ffffff');
      var pts = [[cx - brx * 0.3, cy - bry * 0.6], [hx, hy - hry * 0.7],
                 [cx + brx * 0.1, cy + bry * 0.5]];
      for (var q = 0; q < pts.length; q++) {
        if ((opts.shine * 3) < q) break;
        L.disc(pts[q][0], pts[q][1], 0.7 * k, sh);
        L.disc(pts[q][0] - 1 * k, pts[q][1] + 1 * k, 0.7 * k, sh);
        L.disc(pts[q][0] + 1 * k, pts[q][1] + 1 * k, 0.7 * k, sh);
      }
    }

    return {
      cx: cx, top: Math.min(cy - bry * 1.5, hy - hry) - 2 * k,
      bottom: cy + bry * 1.4 + 2 * k,
      headX: hx, headY: hy, headR: hrx
    };
  }

  function drawPet(L, speciesId, stageKey, opts) {
    opts = opts || {};
    var sp = SPECIES[speciesId] || SPECIES.fox;
    var st = STAGES[stageIndex(stageKey)];
    if (sp.body === 'fish') return drawFish(L, sp, st, opts);
    if (sp.body === 'axolotl') return drawAxolotl(L, sp, st, opts);

    var fur = C(sp.fur), furL = C(sp.furLight), furD = C(sp.furDark);
    var cream = C(sp.cream), creamS = C(sp.creamShade);
    var ink = C(sp.outline);

    var hrx = st.head[0], hry = st.head[1];
    var brx = st.body[0], bry = st.body[1];
    var bob = opts.bob || 0;
    var lean = opts.lean || 0;
    var sleep = opts.sleep || 0;

    var cx = SIZE / 2;
    var bodyCY = FEET - bry - 2.5 + bob * 0.5 + sleep;
    var headCY = bodyCY - (bry + hry) * 0.74 + bob + hry * 0.45 * sleep;
    var headCX = cx + lean;

    /* ---- tail (behind everything, sweeping up the left side) ---- */
    var tlen = st.tail[0], tthick = st.tail[1];
    var wag = (opts.tailWag || 0);
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
      var legH = Math.round(bry * 0.5) + 1;
      L.rect(px - brx * 0.22 - 1, FEET - legH, brx * 0.44 + 2, legH + 1, ink);
      L.rect(px - brx * 0.22, FEET - legH, brx * 0.44, legH, pawC);
    }

    /* ---- ears (drawn before the head so the bases tuck under it) ---- */
    var earLen = st.ear * (1 - 0.18 * sleep);
    var wig = (opts.earWig || 0) + sleep * 1.6;
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
      var big = 1 + 2.4 / Math.max(4, earLen + hrx * 0.5);
      var oi = grow(baseIn, g, big), oo = grow(baseOut, g, big), ot = grow(tip, g, big);
      L.tri(oi.x, oi.y, oo.x, oo.y, ot.x, ot.y, ink);
      L.tri(baseIn.x, baseIn.y, baseOut.x, baseOut.y, tip.x, tip.y, fur);
      // inner ear, pulled toward the centroid
      var a = grow(baseIn, g, 0.58), b = grow(baseOut, g, 0.58), c = grow(tip, g, 0.72);
      L.tri(a.x, a.y, b.x, b.y, c.x, c.y, C(sp.innerEar));
      if (sp.earTip && earLen > 3.4) {
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
      for (var k = -1; k <= 1; k++) {
        L.rect(headCX + k * 2.4 - 0.5, headCY - hry * 0.74, 1, 2.6, furD);
      }
    }

    /* ---- face ---- */
    var eyeR = st.eye;
    var eyeY = headCY - hry * 0.02;
    var eyeDX = hrx * 0.44;
    var eyes = opts.eyes || 'open';
    drawEye(L, sp, headCX - eyeDX, eyeY, eyeR, eyes === 'wink' ? 'blink' : eyes, -1);
    drawEye(L, sp, headCX + eyeDX, eyeY, eyeR, eyes, 1);

    // blush — feverish and darker when the pet is poorly
    if (opts.blush !== false) {
      var blushCol = C(opts.sick ? '#e8607a' : sp.blush);
      for (var s5 = -1; s5 <= 1; s5 += 2) {
        L.ellipse(headCX + s5 * hrx * 0.62, headCY + hry * 0.36, hrx * (opts.sick ? 0.24 : 0.19),
          opts.sick ? 1.4 : 1, blushCol);
      }
    }

    // nose + mouth
    var noseY = headCY + hry * 0.34;
    var ns = sp.noseScale || 1;
    L.ellipse(headCX, noseY, 1.1 * ns, 0.9 * ns, C(sp.nose));
    drawMouth(L, sp, headCX, noseY + 2.4, opts.mouth || 'smile');

    // whiskers — kept inside the silhouette so the outline pass leaves them thin
    if (sp.whiskers && hrx >= 8.5) {
      var wc = C('#ffffff');
      for (var s6 = -1; s6 <= 1; s6 += 2) {
        L.line(headCX + s6 * hrx * 0.5, noseY - 0.5, headCX + s6 * hrx * 0.98, noseY - 1.5, wc, 1);
        L.line(headCX + s6 * hrx * 0.5, noseY + 1.5, headCX + s6 * hrx * 0.96, noseY + 1.5, wc, 1);
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
          L.tri(sx - 1.6, sy + 1.2, sx + 1.6, sy + 1.2, sx + dir * 2, sy - 2.6, furD);
          L.line(sx + dir * 0.6, sy + 0.6, sx + dir * 1.6, sy - 1.8, furL, 1);
        } else {
          L.disc(sx, sy, 1.6, mud);
          L.set(sx, sy, mudD);
          L.set(sx + 1, sy - 1, mudD);
        }
      }
    }

    /* ---- soap foam stuck to the fur ---- */
    if (opts.foam && opts.foam.length) {
      for (var f = 0; f < opts.foam.length; f++) {
        var fm = opts.foam[f];
        L.disc(fm.x, fm.y + bob * 0.5, fm.r, C('#ffffff'));
        L.set(fm.x - 1, fm.y - 1 + bob * 0.5, C('#eaf9ff'));
      }
    }

    /* ---- rinse water still clinging on, waiting to be towelled off ---- */
    if (opts.drips && opts.drips.length) {
      for (var dp = 0; dp < opts.drips.length; dp++) {
        var dr = opts.drips[dp];
        var dy2 = dr.y + bob * 0.5;
        L.ellipse(dr.x, dy2, 1.5, 2, C('#7fd8ff'));
        L.set(dr.x - 1, dy2 - 1, C('#d6f2ff'));
      }
    }

    /* ---- outline ---- */
    L.outline(ink);

    if (opts.sick) {
      var iceX = headCX, iceY = headCY - hry * 0.95;
      L.ellipse(iceX, iceY, hrx * 0.42 + 1, hry * 0.24 + 1, ink);
      L.ellipse(iceX, iceY, hrx * 0.42, hry * 0.24, C('#9adcf8'));
      L.ellipse(iceX - hrx * 0.14, iceY - 0.6, hrx * 0.16, 0.7, C('#dff3ff'));
      L.rect(iceX - 1, iceY - hry * 0.24 - 2, 3, 2, ink);
      L.rect(iceX - 1, iceY - hry * 0.24 - 2, 2, 1, C('#7fb8d8'));
    }

    if (opts.hat) drawHat(L, opts.hat, headCX, headCY, hrx, hry, ink);

    if (opts.shine) {
      var sh = C('#ffffff');
      var pts = [[headCX - hrx * 0.55, headCY - hry * 0.6], [cx + brx * 0.5, bodyCY - bry * 0.5],
                 [headCX + hrx * 0.5, headCY - hry * 0.75]];
      for (var q = 0; q < pts.length; q++) {
        if ((opts.shine * 3) < q) break;
        L.set(pts[q][0], pts[q][1], sh);
        L.set(pts[q][0] - 1, pts[q][1] + 1, sh);
        L.set(pts[q][0] + 1, pts[q][1] + 1, sh);
        L.set(pts[q][0], pts[q][1] + 2, sh);
      }
    }

    return {
      cx: cx,
      top: headCY - hry - earLen,
      bottom: FEET,
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
        bodyCY: a.cy, bodyRX: a.brx * 0.78, bodyRY: a.bry * 0.7,
        headCX: a.cx + a.brx * 0.66,
        headCY: a.cy - a.bry * 0.3, headRX: a.hrx * 0.62, headRY: a.hry * 0.6,
        top: a.cy - a.bry * 1.5
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
    var hrx = st.head[0], hry = st.head[1];
    var brx = st.body[0], bry = st.body[1];
    var bodyCY = FEET - bry - 2.5;
    var headCY = bodyCY - (bry + hry) * 0.74;
    return {
      cx: SIZE / 2, feet: FEET,
      bodyCY: bodyCY, bodyRX: brx, bodyRY: bry,
      headCY: headCY, headRX: hrx, headRY: hry,
      top: headCY - hry - st.ear
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
    stageFor: stageFor,
    metrics: metrics,
    stageIndex: stageIndex,
    drawPet: drawPet,
    drawHat: drawHat,
    HEART: HEART
  };
})(window);
