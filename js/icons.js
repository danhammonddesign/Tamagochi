/* icons.js — custom 16x16 pixel icons.
   Each icon is drawn with the same primitives as the pets and then run through
   the outline pass, so the UI and the animals share one visual language. */
(function (global) {
  'use strict';

  var C = PX.C;
  var INK = '#141014';
  var SZ = 16;

  var DEFS = {
    // ---- care actions -------------------------------------------------
    feed: function (L) {                       // apple
      L.rect(7, 1, 2, 4, C('#8a5a2a'));
      L.ellipse(11, 3, 2.6, 1.5, C('#63c93f'));
      L.ellipse(10.6, 2.6, 1.6, 0.9, C('#8ee86a'));
      L.disc(8, 9.5, 5.2, C('#ff5f5f'));
      L.ellipse(5.6, 7.6, 1.5, 2, C('#ff9b9b'));
      L.set(8, 14, 0);
      L.set(7, 14, 0);
    },
    water: function (L) {                      // droplet
      L.tri(8, 1, 3.6, 8.5, 12.4, 8.5, C('#5fc8ff'));
      L.disc(8, 9.5, 4.6, C('#5fc8ff'));
      L.ellipse(5.8, 9.5, 1.2, 1.9, C('#c8f0ff'));
    },
    play: function (L) {                       // ball
      L.disc(8, 8, 6, C('#ff5f8f'));
      L.ellipse(8, 8, 6, 1.4, C('#ffffff'));
      L.disc(5.4, 5, 1.7, C('#ff8fb0'));
    },
    bath: function (L) {                       // soap bar + bubbles
      L.disc(12.2, 3.4, 2.3, C('#d6f2ff'));
      L.set(11, 2.4, C('#ffffff'));
      L.disc(4.6, 4, 1.4, C('#d6f2ff'));
      L.ellipse(7.6, 11, 5.6, 2.9, C('#5fc8ff'));
      L.ellipse(7.6, 10, 5, 2.2, C('#b6e6ff'));
      L.ellipse(5.6, 9.6, 1.6, 0.8, C('#eaf9ff'));
    },
    brush: function (L) {                      // hair brush
      L.line(9, 7, 13.4, 2.2, C('#d9954f'), 2.6);
      L.ellipse(6, 8.4, 4.8, 3, C('#d9954f'));
      L.ellipse(6, 7.4, 4.2, 1.9, C('#eab275'));
      for (var x = 2; x <= 10; x += 2) L.rect(x, 11, 1, 3, C('#fbf3e6'));
    },

    foodIce: function (L) {                    // ice cream cone
      L.tri(4.5, 8, 11.5, 8, 8, 15.5, C('#e0a45e'));
      L.tri(5.4, 8.6, 10.6, 8.6, 8, 14, C('#f0bd7c'));
      L.disc(5.6, 7, 3.1, C('#ffc3dd'));
      L.disc(10.4, 6.6, 3.1, C('#c8f0ff'));
      L.disc(8, 4, 3.2, C('#fff3a8'));
      L.disc(8, 1.4, 1.1, C('#ff5f8f'));
    },
    rugCandy: function (L) {                   // candy corn rug
      L.ellipse(8, 8, 7.4, 5.4, C('#ffd93d'));
      L.ellipse(8, 8, 5, 3.6, C('#ff9f3d'));
      L.ellipse(8, 8, 2.6, 1.8, C('#fff6e0'));
    },
    toilet: function (L) {                     // little loo
      L.rect(3, 1, 10, 2, C('#c9d6e2'));       // cistern
      L.rect(3, 3, 10, 3, C('#eef4fa'));
      L.ellipse(8, 8.5, 5.4, 3, C('#eef4fa')); // bowl rim
      L.ellipse(8, 8.5, 3.4, 1.8, C('#7fd8ff'));
      L.tri(3.6, 9.6, 12.4, 9.6, 8, 13.5, C('#eef4fa'));
      L.rect(6, 13, 4, 2, C('#c9d6e2'));       // pedestal
      L.set(12, 2, C('#8fa3b8'));
    },
    picSkull: function (L) {                   // framed skull
      L.rect(1, 2, 14, 13, C('#4a2f6e'));
      L.rect(3, 4, 10, 9, C('#2b1f3d'));
      L.ellipse(8, 7.6, 3.8, 3.2, C('#f4efe6'));
      L.rect(6, 10, 4.4, 2.6, C('#f4efe6'));
      L.rect(5.2, 6.4, 1.8, 1.8, C('#2b1f3d'));
      L.rect(9, 6.4, 1.8, 1.8, C('#2b1f3d'));
      L.set(8, 8.8, C('#2b1f3d'));
      L.set(7, 11, C('#2b1f3d'));
      L.set(9, 11, C('#2b1f3d'));
    },
    wallPumpkin: function (L) {                // a swatch of pumpkin paper
      L.rect(1, 1, 14, 14, C('#6b4b8f'));
      L.rect(1, 11, 14, 4, C('#523571'));
      [[5, 5], [11, 8]].forEach(function (p) {
        L.ellipse(p[0], p[1], 3, 2.6, C('#ff8a2b'));
        L.ellipse(p[0], p[1], 1, 2.6, C('#ffa53d'));
        L.rect(p[0] - 0.5, p[1] - 3.4, 1.4, 1.4, C('#4e8f3a'));
        L.set(p[0] - 1, p[1] - 0.6, C('#4a2f6e'));
        L.set(p[0] + 1, p[1] - 0.6, C('#4a2f6e'));
        L.rect(p[0] - 1.5, p[1] + 1, 3.4, 1, C('#4a2f6e'));
      });
    },
    plantCactus: function (L) {                // potted cactus
      L.rect(5.5, 2, 5, 9, C('#63c93f'));
      L.ellipse(8, 2.4, 2.5, 2.2, C('#63c93f'));
      L.rect(6.4, 2.4, 1.2, 8, C('#8ee86a'));
      L.rect(1.6, 6, 4, 2, C('#63c93f'));
      L.rect(1.6, 3.4, 2, 4.4, C('#63c93f'));
      L.ellipse(2.6, 3.4, 1.1, 1, C('#8ee86a'));
      L.rect(10.4, 7, 4, 2, C('#63c93f'));
      L.rect(12.4, 4.6, 2, 4.4, C('#63c93f'));
      L.ellipse(13.4, 4.6, 1.1, 1, C('#8ee86a'));
      L.disc(8, 1, 1.6, C('#ff5f8f'));
      L.rect(4, 11, 8, 5, C('#e58f6a'));
      L.rect(3, 10, 10, 2, C('#f2a682'));
    },
    bannerSkull: function (L) {                // skulls on a string
      L.rect(0, 3, 16, 1, C('#4a2f6e'));
      [3.5, 8, 12.5].forEach(function (x) {
        L.ellipse(x, 7, 2.6, 2.4, C('#f4efe6'));
        L.rect(x - 1.6, 9, 3.4, 1.8, C('#f4efe6'));
        L.set(x - 1, 6.6, C('#3a2b40'));
        L.set(x + 1, 6.6, C('#3a2b40'));
        L.set(x, 8.2, C('#3a2b40'));
        L.set(x - 1, 10, C('#3a2b40'));
        L.set(x + 1, 10, C('#3a2b40'));
      });
    },
    drinkWater: function (L) {                 // glass of water
      L.tri(2.5, 3, 13.5, 3, 8, 15, C('#dbe9f2'));
      L.tri(3.6, 5.4, 12.4, 5.4, 8, 14, C('#5fc8ff'));
      L.rect(2, 2, 12, 2, C('#eef6fb'));
      L.line(5.4, 6.6, 6.6, 10, C('#c8f0ff'), 1);
    },
    drinkMilk: function (L) {                  // milk carton
      L.tri(3, 5, 13, 5, 8, 0.5, C('#e8eef5'));
      L.rect(3, 5, 11, 10, C('#f6f9fc'));
      L.rect(3, 5, 11, 2, C('#e8eef5'));
      L.rect(5, 8, 7, 5, C('#5fc8ff'));
      L.ellipse(8.5, 10.4, 2.4, 1.8, C('#ffffff'));
      L.set(8.5, 2.6, C('#c9d6e2'));
    },
    drinkJuice: function (L) {                 // glass of orange juice
      L.tri(2.5, 3, 13.5, 3, 8, 15, C('#ffd9a8'));
      L.tri(3.6, 5.4, 12.4, 5.4, 8, 14, C('#ff9f3d'));
      L.rect(2, 2, 12, 2, C('#ffe9c8'));
      L.line(11, 1, 9.4, 6, C('#8ee86a'), 1);   // straw
      L.disc(4.6, 3, 2.4, C('#ff8a3d'));        // slice on the rim
      L.disc(4.6, 3, 1.4, C('#ffd07a'));
    },
    medicine: function (L) {                   // bottle with a cross
      L.rect(6, 1, 4, 2, C('#b9c2d0'));
      L.rect(4, 3, 8, 3, C('#d8dee8'));
      L.rect(3, 6, 10, 8, C('#7fd8a8'));
      L.rect(3, 8, 10, 5, C('#ffffff'));
      L.rect(7, 9, 2, 3, C('#ff5f5f'));
      L.rect(6, 10, 4, 1, C('#ff5f5f'));
    },

    // ---- dinner menu --------------------------------------------------
    foodMeal: function (L) {                   // bowl of kibble
      L.disc(5, 6, 1.6, C('#e0a566'));
      L.disc(8, 5, 1.6, C('#c98a4b'));
      L.disc(11, 6, 1.6, C('#e0a566'));
      L.ellipse(8, 8, 7, 2.4, C('#ff8a5c'));
      L.rect(2, 8, 12, 3, C('#e56b40'));
      L.ellipse(8, 11, 6, 2.2, C('#c4552f'));
    },
    foodSteak: function (L) {
      L.ellipse(8, 9, 6, 4.4, C('#c4553f'));
      L.ellipse(7, 8, 4, 2.8, C('#e0705c'));
      L.ellipse(2.6, 5, 2, 2, C('#f4efe6'));
      L.ellipse(4.4, 3.4, 1.8, 1.8, C('#f4efe6'));
      L.rect(3, 4.6, 3, 2, C('#f4efe6'));
    },
    foodBone: function (L) {
      L.rect(4, 7, 8, 3, C('#f4efe6'));
      L.disc(3.6, 6.4, 2, C('#f4efe6'));
      L.disc(3.6, 10, 2, C('#f4efe6'));
      L.disc(12.4, 6.4, 2, C('#f4efe6'));
      L.disc(12.4, 10, 2, C('#f4efe6'));
      L.rect(6, 8, 4, 1, C('#ddd6c8'));
    },
    foodDonut: function (L) {
      L.disc(8, 8.5, 6.4, C('#d9954f'));
      L.disc(8, 7.6, 6, C('#ff9ec4'));
      L.disc(8, 8.5, 2.2, 0);
      L.disc(8, 8.5, 2.2, C('#d9954f'));
      L.disc(8, 8.5, 1.4, 0);
      L.set(5, 5, C('#8ee86a')); L.set(10, 4.6, C('#ffe07a'));
      L.set(11.6, 9, C('#7fd8ff')); L.set(4.6, 10.4, C('#ffffff'));
    },
    foodFish: function (L) {
      L.ellipse(8.5, 8, 5.4, 3.4, C('#7fd8ff'));
      L.ellipse(7.5, 7, 3.4, 1.8, C('#c8f0ff'));
      L.tri(3.4, 8, 0.6, 4.4, 0.6, 11.6, C('#5fc8ff'));
      L.tri(9, 4.8, 12, 1.6, 12.6, 5.4, C('#5fc8ff'));
      L.set(11, 6.6, C('#141014'));
      L.set(9.5, 9.5, C('#5fc8ff'));
    },
    foodLolly: function (L) {
      L.rect(7.5, 9, 1.5, 6, C('#f4efe6'));
      L.disc(8, 6, 5, C('#ff5f8f'));
      L.disc(8, 6, 3.4, C('#ffffff'));
      L.disc(8, 6, 2, C('#ff5f8f'));
      L.set(6, 4, C('#ffb3cc'));
    },
    present: function (L) {
      L.rect(2, 7, 12, 7, C('#ff8fb8'));
      L.rect(1, 5, 14, 3, C('#ff5f8f'));
      L.rect(7, 5, 2, 9, C('#ffd93d'));
      L.disc(6.4, 3.4, 2, C('#ffd93d'));
      L.disc(9.6, 3.4, 2, C('#ffd93d'));
      L.rect(7, 3, 2, 2, C('#ffb01a'));
    },

    // ---- mini games ---------------------------------------------------
    bubble: function (L) {
      L.disc(6.5, 9, 5.2, C('#bfe9ff'));
      L.disc(6.5, 9, 3.4, C('#eaf9ff'));
      L.disc(4.6, 7, 1.4, C('#ffffff'));
      L.disc(12.5, 4, 2.6, C('#bfe9ff'));
      L.set(12, 3, C('#ffffff'));
    },
    treat: function (L) {                      // cup with a star over it
      L.tri(3, 14, 13, 14, 4.6, 6, C('#77b8f0'));
      L.tri(13, 14, 11.4, 6, 4.6, 6, C('#77b8f0'));
      L.rect(4, 5, 8, 2, C('#9ad0ff'));
      L.rect(5, 9, 2, 4, C('#a8d8ff'));
      L.tri(8, 0.5, 6, 4.5, 10, 4.5, C('#ffd93d'));
      L.tri(8, 0.5, 6, 4.5, 10, 4.5, C('#ffd93d'));
      L.disc(8, 3, 1.6, C('#ffd93d'));
    },

    shower: function (L) {                     // hand shower with jets
      L.line(9, 5, 13.5, 1.5, C('#b9c2d0'), 2.4);
      L.ellipse(6.5, 5.5, 4.6, 2.6, C('#d8dee8'));
      L.ellipse(6.5, 4.6, 4, 1.8, C('#eef2f8'));
      for (var i = 0; i < 4; i++) {
        L.rect(3 + i * 2.2, 8, 1, 2 + (i % 2) * 2, C('#5fc8ff'));
        L.set(3 + i * 2.2, 12 + (i % 2) * 2, C('#7fd8ff'));
      }
    },
    towel: function (L) {                      // folded towel
      L.rect(2, 4, 12, 9, C('#ffd0e6'));
      L.rect(2, 4, 12, 2, C('#ff8fb8'));
      L.rect(2, 8, 12, 1, C('#ffb3d0'));
      for (var t = 0; t < 4; t++) L.rect(3 + t * 3, 13, 2, 2, C('#ffe4f0'));
    },

    // ---- prizes --------------------------------------------------------
    hatParty: function (L) {
      L.tri(8, 0.5, 3, 13, 13, 13, C('#ff5f8f'));
      L.tri(8, 0.5, 3, 13, 8, 13, C('#ff8fb8'));
      L.rect(3, 12, 10, 2, C('#ffd93d'));
      L.disc(8, 1.5, 2, C('#ffd93d'));
      L.set(6, 8, C('#ffe07a')); L.set(9, 6, C('#7fd8ff')); L.set(7, 10, C('#8ee86a'));
    },
    hatCrown: function (L) {
      L.rect(2, 9, 12, 4, C('#ffb01a'));
      L.rect(2, 9, 12, 1, C('#ffe07a'));
      L.tri(2, 9, 2, 3, 5.5, 8, C('#ffd93d'));
      L.tri(8, 2, 5, 8.5, 11, 8.5, C('#ffd93d'));
      L.tri(14, 9, 14, 3, 10.5, 8, C('#ffd93d'));
      L.set(4, 11, C('#ff5f8f')); L.set(8, 11, C('#7fd8ff')); L.set(11, 11, C('#8ee86a'));
    },
    hatWitch: function (L) {
      L.tri(4, 12, 12, 12, 11.5, 4, C('#4a2f6e'));     // cone, flopping over
      L.tri(11.5, 4.5, 10, 6, 14, 2, C('#4a2f6e'));
      L.tri(4.5, 12, 9.5, 12, 10.5, 5, C('#63409c'));  // lit side
      L.ellipse(8, 12.5, 7.5, 2.4, C('#4a2f6e'));      // brim
      L.ellipse(8, 11.8, 7.2, 1.8, C('#63409c'));
      L.rect(4, 9.6, 8, 2, C('#ffd93d'));              // band
      L.rect(7, 9.2, 2.4, 2.8, C('#ffb01a'));          // buckle
    },
    hatBow: function (L) {
      L.tri(8, 8, 1, 3.5, 1, 12.5, C('#ff5f8f'));
      L.tri(8, 8, 15, 3.5, 15, 12.5, C('#ff5f8f'));
      L.ellipse(4, 8, 2, 2.4, C('#ff8fb8'));
      L.ellipse(12, 8, 2, 2.4, C('#ff8fb8'));
      L.disc(8, 8, 2.4, C('#e8629a'));
    },
    toyWand: function (L) {                    // a cat on a string, on a stick
      L.line(0.5, 1, 7, 5.5, C('#b07a3a'), 2);
      L.line(0.5, 1.4, 6.6, 5.6, C('#d19a54'), 1);
      L.line(7, 5.5, 9, 8.5, C('#cfd6e6'), 1);
      L.tri(7.6, 10, 9.6, 9.6, 7.8, 7.4, C('#8a7fb8'));   // ears
      L.tri(13.4, 10, 11.4, 9.6, 13.2, 7.4, C('#8a7fb8'));
      L.disc(10.5, 11.6, 3.4, C('#8a7fb8'));              // head
      L.ellipse(10.5, 13, 2.4, 1.6, C('#d4cfe0'));        // muzzle
      L.set(9, 11, C('#141014'));
      L.set(12, 11, C('#141014'));
      L.set(10.5, 12.4, C('#ff9ec4'));
    },
    toyFrisbee: function (L) {
      L.ellipse(8, 9, 7, 3.4, C('#ff9f3d'));
      L.ellipse(8, 8, 7, 3.2, C('#ffd93d'));
      L.ellipse(8, 7.8, 4, 1.8, C('#fff3a8'));
      L.ellipse(8, 7.8, 1.6, 0.8, C('#ff9f3d'));
    },
    gift: function (L) {
      L.rect(2, 7, 12, 7, C('#ff8fb8'));
      L.rect(1, 5, 14, 3, C('#ff5f8f'));
      L.rect(7, 5, 2, 9, C('#ffd93d'));
      L.disc(6.4, 3.4, 2, C('#ffd93d'));
      L.disc(9.6, 3.4, 2, C('#ffd93d'));
    },
    moon: function (L) {                       // crescent: a disc with a bite out
      L.disc(8, 8, 6.4, C('#ffe98a'));
      L.disc(12, 5, 5.8, 0);
      L.set(4.5, 10, C('#fff6d0'));
      L.set(5.5, 5, C('#fff6d0'));
    },
    lock: function (L) {
      L.rect(4, 7, 8, 7, C('#b9b3c8'));
      L.rect(5, 3, 6, 4, C('#8f8aa0'));
      L.rect(6.5, 4.5, 3, 3, 0);
      L.rect(7, 9, 2, 3, C('#6d6880'));
    },

    // ---- chrome -------------------------------------------------------
    paw: function (L) {
      L.disc(4, 5, 2, C('#ff8fb0'));
      L.disc(8, 3.8, 2, C('#ff8fb0'));
      L.disc(12, 5, 2, C('#ff8fb0'));
      L.ellipse(8, 11, 4.8, 3.8, C('#ff8fb0'));
    },
    heart: function (L) {
      L.disc(5.4, 6, 3.1, C('#ff5f8f'));
      L.disc(10.6, 6, 3.1, C('#ff5f8f'));
      L.tri(2.4, 7.4, 13.6, 7.4, 8, 14.4, C('#ff5f8f'));
      L.ellipse(5, 5, 1.2, 1, C('#ff9dc0'));
    },
    heartEmpty: function (L) {
      L.disc(5.4, 6, 3.1, C('#e6e0e8'));
      L.disc(10.6, 6, 3.1, C('#e6e0e8'));
      L.tri(2.4, 7.4, 13.6, 7.4, 8, 14.4, C('#e6e0e8'));
    },
    star: function (L) {
      var y = C('#ffd93d');
      L.tri(8, 0.5, 5, 8, 11, 8, y);
      L.tri(8, 15.5, 5, 8, 11, 8, y);
      L.tri(0.5, 8, 8, 5, 8, 11, y);
      L.tri(15.5, 8, 8, 5, 8, 11, y);
      L.disc(8, 8, 2.4, C('#fff3a8'));
    },
    soundOn: function (L) {
      var d = C('#3a2b40');
      L.rect(2, 6, 3, 4, d);
      L.tri(4, 8, 8, 2.5, 8, 13.5, d);
      L.line(10.5, 5, 10.5, 11, d, 1);
      L.line(13, 3.5, 13, 12.5, d, 1);
    },
    soundOff: function (L) {
      var d = C('#3a2b40');
      L.rect(2, 6, 3, 4, d);
      L.tri(4, 8, 8, 2.5, 8, 13.5, d);
      L.line(10.5, 5, 14.5, 11, d, 1);
      L.line(14.5, 5, 10.5, 11, d, 1);
    },
    plus: function (L) {
      L.rect(7, 3, 2, 10, C('#3a2b40'));
      L.rect(3, 7, 10, 2, C('#3a2b40'));
    },
    close: function (L) {
      L.line(4, 4, 12, 12, C('#3a2b40'), 2);
      L.line(12, 4, 4, 12, C('#3a2b40'), 2);
    },
    check: function (L) {
      L.line(3.5, 8.5, 6.5, 12, C('#3fd6a0'), 2);
      L.line(6.5, 12, 12.5, 4, C('#3fd6a0'), 2);
    },
    trash: function (L) {
      var d = C('#e8629a');
      L.rect(6, 2, 4, 2, d);
      L.rect(3, 4, 10, 2, d);
      L.rect(4, 6, 8, 8, d);
      L.rect(6, 8, 1, 4, C('#ffd9e6'));
      L.rect(9, 8, 1, 4, C('#ffd9e6'));
    }
  };

  var cache = {};

  function layer(name) {
    if (cache[name]) return cache[name];
    var L = new PX.Layer(SZ, SZ);
    (DEFS[name] || DEFS.paw)(L);
    L.outline(C(INK));
    cache[name] = L;
    return L;
  }

  /* Renders an icon into a <canvas> element and sizes it for crisp pixels. */
  function render(canvas, name, px) {
    var scr = canvas._iconScreen;
    if (!scr) {
      scr = new PX.Screen(canvas, SZ, SZ);
      canvas._iconScreen = scr;
    }
    scr.layer.clear();
    scr.layer.blit(layer(name), 0, 0);
    scr.present();
    if (px) {
      canvas.style.width = px + 'px';
      canvas.style.height = px + 'px';
    }
  }

  function renderAll(root, px) {
    var list = (root || document).querySelectorAll('[data-icon]');
    for (var i = 0; i < list.length; i++) {
      render(list[i], list[i].dataset.icon, px || parseInt(list[i].dataset.iconSize, 10) || 0);
    }
  }

  global.Icons = { layer: layer, render: render, renderAll: renderAll, SIZE: SZ, names: Object.keys(DEFS) };
})(window);
