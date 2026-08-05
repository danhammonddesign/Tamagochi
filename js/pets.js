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
      cardBg: '#ffd9b0'
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
      cardBg: '#d8dce8'
    }
  };

  // Life stages. `growth` is the score at which the pet reaches the stage.
  // Babies are all head; adults grow into their bodies, ears and tails.
  var STAGES = [
    { key: 'baby', label: 'Baby', growth: 0, head: [7.8, 7.2], body: [5.2, 4.4], ear: 4.0, eye: 2.5, tail: [8, 2.3] },
    { key: 'kid', label: 'Kid', growth: 30, head: [8.4, 7.8], body: [6.2, 5.2], ear: 4.9, eye: 2.4, tail: [10, 2.6] },
    { key: 'teen', label: 'Teen', growth: 75, head: [9, 8.4], body: [7.3, 6.3], ear: 5.6, eye: 2.3, tail: [12, 3.0] },
    { key: 'adult', label: 'Adult', growth: 140, head: [9.6, 9], body: [8.4, 7.3], ear: 6.9, eye: 2.2, tail: [14, 3.3] }
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
        if (sp.eyeStyle === 'slit') {
          L.ellipse(ex, ey, r * 1.0, r * 0.62, dark);
          L.set(ex - r * 0.4, ey - r * 0.2, white);
        } else {
          L.ellipse(ex, ey, r * 0.9, r * 1.05, dark);
          L.set(ex - r * 0.35, ey - r * 0.45, white);
          L.set(ex - r * 0.35 + 1, ey - r * 0.45, white);
          L.set(ex - r * 0.35, ey - r * 0.45 + 1, white);
          L.set(ex + r * 0.3, ey + r * 0.5, C('#7fd8b0'));
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
  function drawPet(L, speciesId, stageKey, opts) {
    opts = opts || {};
    var sp = SPECIES[speciesId] || SPECIES.fox;
    var st = STAGES[stageIndex(stageKey)];

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
    L.ellipse(headCX, headCY + hry * 0.5, hrx * 0.52, hry * 0.34, cream);
    if (sp.cheekPatch) {
      for (var s4 = -1; s4 <= 1; s4 += 2) {
        L.ellipse(headCX + s4 * hrx * 0.62, headCY + hry * 0.3, hrx * 0.34, hry * 0.32, cream);
      }
      L.ellipse(headCX, headCY + hry * 0.34, hrx * 0.36, hry * 0.3, cream);
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

    // blush
    if (opts.blush !== false) {
      for (var s5 = -1; s5 <= 1; s5 += 2) {
        L.ellipse(headCX + s5 * hrx * 0.62, headCY + hry * 0.36, hrx * 0.19, 1, C(sp.blush));
      }
    }

    // nose + mouth
    var noseY = headCY + hry * 0.34;
    L.ellipse(headCX, noseY, 1.1, 0.9, C(sp.nose));
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

    /* ---- outline ---- */
    L.outline(ink);

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

  /* Geometry of a stage, in layer coordinates — used to scatter dirt and
     tufts inside the body and head. */
  function metrics(stageKey) {
    var st = STAGES[stageIndex(stageKey)];
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
    SIZE: SIZE,
    FEET: FEET,
    stageFor: stageFor,
    metrics: metrics,
    stageIndex: stageIndex,
    drawPet: drawPet,
    HEART: HEART
  };
})(window);
