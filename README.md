# 🦊 Pixel Pals

A Tamagotchi-style pet game for kids. Adopt a baby **cat** or **fox**, look after it,
and watch it grow up from a Baby into a full-grown Adult.

No build step, no dependencies, no network — just open `index.html` in a browser.

## Play

```
open index.html
```

Or serve the folder any way you like:

```
python3 -m http.server 8000     # then visit http://localhost:8000
```

Works on phones, tablets and desktop. Everything is saved to `localStorage`, so
your pet is still there when you come back.

## How to play

1. **Pick a pet** — cat or fox — and give it a name.
2. Keep the four bars topped up:

   | Button | Looks after | Refills |
   |---|---|---|
   | 🍎 Feed | Food | +38 |
   | 💧 Water | Water | +42 |
   | 🎾 Play | Fun | +45 (tap the bouncing ball for extra!) |
   | 🛁 Bath | Clean | +60 |

3. **Pet your pal** — press and stroke it on the screen. Hearts float up, it
   purrs, and it loves you a bit more.
4. Every bit of care adds **growth points**. Fill the gold bar at the top to grow
   up: **Baby → Kid → Teen → Adult**. Each stage gets a little celebration.

The pet never gets sick and never dies. If a bar runs low it just looks sad, a
thought bubble shows what it wants, and the matching button wiggles — so a young
player always knows what to do next.

## Files

```
index.html      layout and controls
css/style.css   the chunky, colourful UI
js/pixel.js     tiny indexed-colour pixel raster engine (layers, ellipse/tri/line, outline pass, blit)
js/pets.js      the animals — palettes, life stages, and the procedural sprite
js/game.js      the room, props, particles, care actions, growth, saving
```

### How the art works

The sprites are not fixed images. `js/pets.js` draws each pet procedurally onto a
44×44 index buffer from a handful of numbers per life stage (head radius, body
radius, ear length, eye size, tail length). That means:

* one function covers both species at all four stages,
* ears, tails, eyes, mouths and leaning are all animated by parameters,
* growing up is a smooth change of proportions rather than a new sprite sheet.

Parts that overlap (tail, body, ears, head, legs) are each drawn one pixel larger
in black first, so every piece keeps the solid outline of the reference art. A
final `outline()` pass wraps the whole silhouette.

The scene is an 88×64 pixel buffer scaled up by an integer factor with
`image-rendering: pixelated`, so pixels stay square and crisp at any size.

Sound is generated at runtime with the Web Audio API (no audio files) and can be
muted with the 🔊 button.
