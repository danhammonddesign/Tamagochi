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

    medicine: function (L) {                   // bottle with a cross
      L.rect(6, 1, 4, 2, C('#b9c2d0'));
      L.rect(4, 3, 8, 3, C('#d8dee8'));
      L.rect(3, 6, 10, 8, C('#7fd8a8'));
      L.rect(3, 8, 10, 5, C('#ffffff'));
      L.rect(7, 9, 2, 3, C('#ff5f5f'));
      L.rect(6, 10, 4, 1, C('#ff5f5f'));
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
