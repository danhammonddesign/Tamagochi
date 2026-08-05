/* pixel.js — a tiny indexed-colour pixel raster engine.
   Everything is drawn into a Layer (an index buffer), layers get composited
   onto a Screen, and the Screen paints a small ImageData that CSS blows up
   with image-rendering: pixelated. */
(function (global) {
  'use strict';

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // Global colour registry. Index 0 is always "transparent".
  var Palette = {
    colors: [null],
    map: new Map(),
    idx: function (hex) {
      var i = this.map.get(hex);
      if (i !== undefined) return i;
      this.colors.push(hexToRgb(hex));
      i = this.colors.length - 1;
      this.map.set(hex, i);
      return i;
    }
  };

  function C(hex) { return Palette.idx(hex); }

  function Layer(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Int16Array(w * h);
  }

  Layer.prototype.clear = function (v) {
    this.data.fill(v || 0);
  };

  Layer.prototype.set = function (x, y, v) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = v;
  };

  Layer.prototype.get = function (x, y) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[y * this.w + x];
  };

  Layer.prototype.rect = function (x, y, w, h, v) {
    var x0 = Math.round(x), y0 = Math.round(y);
    var x1 = Math.round(x + w), y1 = Math.round(y + h);
    for (var j = y0; j < y1; j++) for (var i = x0; i < x1; i++) this.set(i, j, v);
  };

  Layer.prototype.ellipse = function (cx, cy, rx, ry, v) {
    if (rx <= 0 || ry <= 0) return;
    var x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx);
    var y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, v);
      }
    }
  };

  Layer.prototype.disc = function (cx, cy, r, v) {
    this.ellipse(cx, cy, r, r, v);
  };

  Layer.prototype.tri = function (ax, ay, bx, by, cx, cy, v) {
    var minX = Math.floor(Math.min(ax, bx, cx)), maxX = Math.ceil(Math.max(ax, bx, cx));
    var minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
    function edge(x0, y0, x1, y1, px, py) {
      return (px - x0) * (y1 - y0) - (py - y0) * (x1 - x0);
    }
    for (var y = minY; y <= maxY; y++) {
      for (var x = minX; x <= maxX; x++) {
        var px = x + 0.5, py = y + 0.5;
        var w0 = edge(ax, ay, bx, by, px, py);
        var w1 = edge(bx, by, cx, cy, px, py);
        var w2 = edge(cx, cy, ax, ay, px, py);
        if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) this.set(x, y, v);
      }
    }
  };

  Layer.prototype.line = function (x0, y0, x1, y1, v, thick) {
    thick = thick || 1;
    var dist = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    var n = Math.max(1, Math.ceil(dist * 2));
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      var x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (thick <= 1) this.set(x, y, v);
      else this.disc(x, y, thick / 2, v);
    }
  };

  // Grows the silhouette by one pixel of `v`, reading from a snapshot so the
  // outline never feeds itself.
  Layer.prototype.outline = function (v) {
    var src = this.data.slice();
    var w = this.w, h = this.h;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (src[y * w + x] !== 0) continue;
        var hit =
          (x > 0 && src[y * w + x - 1]) ||
          (x < w - 1 && src[y * w + x + 1]) ||
          (y > 0 && src[(y - 1) * w + x]) ||
          (y < h - 1 && src[(y + 1) * w + x]);
        if (hit) this.data[y * w + x] = v;
      }
    }
  };

  Layer.prototype.blit = function (src, ox, oy) {
    ox = Math.round(ox); oy = Math.round(oy);
    for (var y = 0; y < src.h; y++) {
      for (var x = 0; x < src.w; x++) {
        var v = src.data[y * src.w + x];
        if (v) this.set(ox + x, oy + y, v);
      }
    }
  };

  // Draws a grid of characters, e.g. ["..#..", ".###."] with a key map.
  Layer.prototype.stamp = function (rows, key, ox, oy) {
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var v = key[rows[y][x]];
        if (v) this.set(ox + x, oy + y, v);
      }
    }
  };

  function Screen(canvas, w, h) {
    this.w = w;
    this.h = h;
    this.canvas = canvas;
    canvas.width = w;
    canvas.height = h;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.img = this.ctx.createImageData(w, h);
    this.layer = new Layer(w, h);
  }

  /* `tint` is an optional [r, g, b, amount] wash applied to every colour —
     used for the night-time and golden-hour lighting. It is folded into a
     copy of the palette once per frame rather than per pixel. */
  Screen.prototype.present = function (tint) {
    var P = Palette.colors;
    var pal = P;
    if (tint && tint[3] > 0.002) {
      var a = tint[3], ia = 1 - a;
      pal = this._tinted || (this._tinted = [null]);
      pal.length = P.length;
      for (var j = 1; j < P.length; j++) {
        var src = P[j];
        var t = pal[j];
        if (!t) t = pal[j] = [0, 0, 0];
        t[0] = src[0] * ia + tint[0] * a;
        t[1] = src[1] * ia + tint[1] * a;
        t[2] = src[2] * ia + tint[2] * a;
      }
      pal[0] = null;
    }
    var d = this.img.data, L = this.layer.data;
    for (var i = 0, p = 0; i < L.length; i++, p += 4) {
      var c = pal[L[i]];
      if (!c) {
        d[p] = 0; d[p + 1] = 0; d[p + 2] = 0; d[p + 3] = 0;
      } else {
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
  };

  global.PX = { Palette: Palette, C: C, Layer: Layer, Screen: Screen };
})(window);
