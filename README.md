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

1. **Pick a pet** and give it a name. It arrives gift-wrapped: tap the present
   and your new pet pops out of the box in a shower of confetti.
2. Five round buttons along the bottom care for five needs. Each button is its
   own gauge: the coloured ring around the icon shows how full that need is.

   | Button | Need | How it works |
   |---|---|---|
   | Feed | Food | Pick from six things to eat |
   | Water | Water | A water bowl to lap from |
   | Play | Fun | Pick one of three mini games |
   | Bath | Clean | **Hands on:** scrub, rinse and dry your pet in three steps |
   | Brush | Brush | **Hands on:** swipe the brush over the fur to smooth the tufts out |

   A sixth **Medicine** button appears only when your pet is poorly.

3. **Stroke your pet** anywhere on screen to give it cuddles — hearts float up
   and it purrs. Keep going and it gets so happy it calls out: cats meow and
   chirrup, the Dalmatian barks twice and whines, the fox yips.
4. Care earns growth points. Fill the gold bar at the top to grow up:
   **Baby → Kid → Teen → Adult**, each with a little celebration.
5. Tap the **paw** button (top left) for *My Pets*: switch between pets, add a
   new one (up to six), or say goodbye to one.
6. Tap the **moon** button (top right) to tuck your pet into bed, and again to
   wake it. Waking it this way is gentle — it is prodding a sleeping pet that
   makes it cross.

### Dinner time

Feed opens a menu split in two. The top row is **meals** — a proper meal, a
fish or a steak — and each fills about three quarters of the Food ring. The
bottom row is **treats** — a donut, a bone or a lollipop — which only fill
about a quarter but give a good helping of Fun. So a lollipop makes a poor
dinner and a lovely snack. Whatever you pick slides in and shrinks bite by bite
as your pet works through it.

### Prizes and the toy box

There are four ways to win a prize:

* **Top up two meters to 85% or more at the same time.**
* **Get a perfect score** in any of the mini games — every game has a target
  score, shown next to your score while you play, and a ★ appears when you
  reach it.
* **Beat your own best score** in any of the mini games.
* **Match your own best score**, so a great run still counts even when you
  can't quite go one better.

A round only ever wins one prize, so a perfect run that is also a new record
pays out once. However you win it, the same thing happens: **"New Prize!"**
pops up over your pet in a shower of confetti, the prize itself sails across
the room into the toy box in the back left corner, and **the box lights up** —
glowing, rattling and twinkling — until you go and look. Nothing covers the
screen, so whatever you were doing carries on underneath. **Tap the toy box**
to open it and the light goes out. Prizes also wait until you are between
things, so one never lands in the middle of a bath or a game.

There are six prizes: four **hats** — a party hat, a crown, a cap and a bow —
and two **toys**. Tap a hat to put it on your pet; it wears it everywhere,
including on its card in My Pets. Tap it again to take it off. **Tap a toy and
your pet starts playing with it there and then** — the box closes and the game
begins, no need to go back out through the Play menu. The toys also show up in
the Play menu once you have won them.

### Mini games

Tapping **Play** lets you pick what to play:

| Game | How it works | Perfect score |
|---|---|---|
| **Bounce** | A ball ricochets around the room; tap it to keep it flying. | 8 |
| **Bubbles** | Bubbles drift up from the floor; pop as many as you can before time runs out. Your pet follows them with its eyes. | 12 |
| **Find It** | A treat goes under one of three cups, the cups shuffle, and you pick the one you think is hiding it. Three rounds. | 3 |
| **Chase** *(needs the toy mouse)* | A mouse darts about the floor changing direction; tap it to send it scurrying off again. | 10 |
| **Fetch** *(needs the frisbee)* | A frisbee sails around the room; tap it to fling it back before it lands. | 8 |

Each game shows your score in the bar at the bottom, counting up towards that
game's perfect score, and tops up the Fun ring as you play. **Done** ends a
game early. Your best score in each game is remembered — hit the target, beat
your record or match it and you win a prize from the toy box.

### Naps and bedtime

Press the **moon** button any time to put your pet to bed. It curls up in its
basket and stays there until you press the moon again, or until it has had a
good long rest. Waking it with the moon button is gentle, because you were the
one who put it down.

Your pet also nods off by itself now and then — closed eyes, drooped ears, Zzz
floating up. Let it sleep and it wakes on its own in a better mood. Poke it, or
press a care button while it's asleep, and it wakes up **cross**: angry brows,
gritted teeth, red pops over its head, and it sulks for a few seconds before
forgiving you. It only naps when it doesn't need anything, so a sleeping pet
never blocks you from looking after it.

### Day and night

The room runs on your real clock. It brightens through a **sunrise between 7
and 9 in the morning** and dims again through a **sunset between 7 and 9 in
the evening** into night. The lighting only makes the room darker — it never
recolours it — and your pet and whatever tool you are holding always keep
their own colours, so they stay bright and readable whatever the hour.

The evening light falls on the **room only**. Your pet, its food, the bath, the
toys and everything else you put in the room keep their own colours, so nothing
changes shade as it passes in front of the pet.

The window is where the colour lives: the sky outside changes through the day,
a sun or moon rides an arc across the panes, stars come out after dark and a
night light switches on in the corner. Your pet dozes off far more readily at
night — and once it is properly dark it curls up in its own little bed — and it
greets you differently depending on the hour.

### The houseplant

The plant in the corner grows on its own, a little every minute, whether the
game is open or not. Left long enough it turns into a sprawling thing with
shoots poking out in all directions — then **tap it to give it a trim**.
Clippings fly, it snips back to a tidy size, and it starts growing again.

### Accidents

Every so often your pet has an accident on the floor — a poop or a puddle. It
squats, says "Oops!", and the mess stays there until you **tap it to clean it
up**. Leave it and the room gets dirty roughly twice as fast per mess, and
flies turn up after a while. Come back after a long time away and you may find
one or two waiting for you.

### Bath time

Bath time is a proper three-step job, and every step is hands on:

1. **Scrub** — the soap sits waiting beside the tub. Grab it and rub it over
   your pet; the mud comes off where you rub and leaves foam behind.
2. **Rinse** — the shower is next. Wash all that foam away and the fur is left
   dripping wet.
3. **Dry** — finally the towel, until every last drip is gone.

Each step takes **three seconds of work with the tool on your pet**, shown by
the tall gauge down the left of the screen. When the meter fills you get a happy chime, the
thing you were holding puffs away, and the next one pops in beside the tub
ready to be picked up — so each step is its own little job with a clear start
and finish. Press **Done** any time to stop early and keep what you've done so
far.

### Brushing

Same idea, one step: the scruffy tufts in your pet's fur are real objects on
the sprite. Swipe the brush over one and it works out, with fur flying and the
gauge ticking up.

Because the number of spots is derived from the Clean and Brush stats, the mess
you can see always matches the gauges — a pet on 40% Clean has exactly five
patches of mud to find.

### Getting poorly

Leave your pet hungry or thirsty for long enough and it falls ill: an ice pack
appears on its head, its cheeks flush, it looks miserable, everything drains
faster and it is too under the weather to play. A **Medicine** button appears
in the dock — a bottle and spoon slide in, your pet takes its medicine, and it
sparkles better again.

Your pet never dies, and medicine always works. If a need runs low it just
looks sad, a thought bubble shows what it wants, and the matching button pulses
— so a young player always knows what to do next.

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
