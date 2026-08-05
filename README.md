# 🦊 Pixel Pals

A Tamagotchi-style pet game for kids. Adopt a baby **cat**, **fox**,
**black cat** or **Dalmatian**, look after it, and watch it grow up from Baby
to Adult. Keep a whole shelf of pets and switch between them whenever you like.

No build step, no dependencies, no network — just open `index.html`.

## Play

```
open index.html
```

Or serve the folder any way you like:

```
python3 -m http.server 8000     # then visit http://localhost:8000
```

Built mobile-first: the room fills the whole screen, the controls are big
thumb-sized targets along the bottom, and everything is saved to
`localStorage`.

## How to play

1. **Pick a pet** — cat or fox — and give it a name.
2. Five round buttons along the bottom care for five needs. Each button is its
   own gauge: the coloured ring around the icon shows how full that need is.

   | Button | Need | How it works |
   |---|---|---|
   | Feed | Food | A bowl slides in and your pet tucks in |
   | Water | Water | A water bowl to lap from |
   | Play | Fun | Pick one of three mini games |
   | Bath | Clean | **Hands on:** scrub, rinse and dry your pet in three steps |
   | Brush | Brush | **Hands on:** swipe the brush over the fur to smooth the tufts out |

3. **Stroke your pet** anywhere on screen to give it cuddles — hearts float up
   and it purrs.
4. Care earns growth points. Fill the gold bar at the top to grow up:
   **Baby → Kid → Teen → Adult**, each with a little celebration.
5. Tap the **paw** button (top left) for *My Pets*: switch between pets, add a
   new one (up to six), or say goodbye to one.

### Mini games

Tapping **Play** lets you pick what to play:

* **Bounce** — a ball ricochets around the room; tap it to keep it flying.
* **Bubbles** — bubbles drift up from the floor; pop as many as you can before
  time runs out. Your pet follows them with its eyes.
* **Find It** — a treat goes under one of three cups, the cups shuffle, and you
  pick the one you think is hiding it. Three rounds.

Each game shows your score in the bar at the bottom and tops up the Fun ring
as you play. **Done** ends a game early.

### Naps

Your pet nods off by itself now and then — closed eyes, drooped ears, Zzz
floating up. Let it sleep and it wakes on its own in a better mood. Poke it, or
press a care button while it's asleep, and it wakes up **cross**: angry brows,
gritted teeth, red pops over its head, and it sulks for a few seconds before
forgiving you. It only naps when it doesn't need anything, so a sleeping pet
never blocks you from looking after it.

### Day and night

The room runs on your real clock. It is bright through the middle of the day,
warms into a **sunrise between 7 and 9 in the morning**, and sinks through a
**sunset between 7 and 9 in the evening** into night. After dark the whole
room takes a deep blue wash, the moon rides across the window with a field of
twinkling stars, and a night light comes on in the corner. Your pet dozes off
far more readily at night, and it greets you differently depending on the hour.

### Accidents

Every so often your pet has an accident on the floor — a poop or a puddle. It
squats, says "Oops!", and the mess stays there until you **tap it to clean it
up**. Leave it and the room gets dirty roughly twice as fast per mess, and
flies turn up after a while. Come back after a long time away and you may find
one or two waiting for you.

### Bath time

Bath time is a proper three-step job, and every step is hands on:

1. **Scrub** — drag the bar of soap over your pet. Each patch of mud you find
   comes off and leaves a blob of foam behind.
2. **Rinse** — pick up the shower and wash all that foam away. Every blob you
   rinse leaves the fur dripping wet.
3. **Dry** — rub the towel over your pet until every last drip is gone.

Each step needs a fresh press, so you lift your finger, pick up the next thing
and start again. Your pet sparkles clean once the last drip is towelled off.
There are always at least seven patches of mud, so a bath is never a two-second
job. Press **Done** any time to stop early and keep what you have cleaned.

### Brushing

Same idea, one step: the scruffy tufts in your pet's fur are real objects on
the sprite. Swipe the brush over one and it works out, with fur flying and the
gauge ticking up.

Because the number of spots is derived from the Clean and Brush stats, the mess
you can see always matches the gauges — a pet on 40% Clean has exactly five
patches of mud to find.

The pet never gets sick and never dies. If a need runs low it just looks sad, a
thought bubble shows what it wants, and the matching button pulses — so a young
player always knows what to do next.

## Files

```
index.html      full-screen canvas plus the floating HUD
css/style.css   minimal translucent controls
js/pixel.js     indexed-colour pixel raster engine (layers, shapes, outline pass, blit)
js/icons.js     the custom 16x16 pixel icons used all over the UI
js/pets.js      the animals — palettes, life stages, procedural sprite
js/game.js      the room, props, particles, care actions, growth, saving, pet switching
```

### How the art works

Nothing is a bitmap asset. Everything — the animals, the room, the interface
icons — is drawn at runtime with the same handful of primitives in
`js/pixel.js` (ellipse, triangle, line, rect) onto small index buffers, then
run through one `outline()` pass that wraps the silhouette in black. That is
why the UI icons and the pets look like they come from the same set.

The pets are built from a few numbers per life stage — head radius, body
radius, ear length, eye size, tail length — so one function covers both species
at all four stages, ears/tails/eyes/mouths animate by parameter, and growing up
is a change of proportions rather than a new sprite sheet. Overlapping parts
(tail, body, ears, head, legs) are each drawn one pixel larger in black first,
so every piece keeps a solid outline against the piece behind it.

The room is sized to the viewport at runtime: the game picks an integer pixel
scale from the screen height, works out how many logical pixels fit, and lays
the floor, furniture and decorations out proportionally. So the same room fills
a small phone, a tablet or a desktop window without letterboxing.

Sound is generated with the Web Audio API — no audio files — and mutes with the
speaker button.
