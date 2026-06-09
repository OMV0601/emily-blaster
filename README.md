# EmilyBlaster

A literary word-shooter built in vanilla JavaScript + HTML5 Canvas. Words from Emily Dickinson's "Because I could not stop for Death" drift down the screen; shoot them in order with your quill pen to compose the poem line by line.

Inspired by the fictional game of the same name in Gabrielle Zevin's *Tomorrow, and Tomorrow, and Tomorrow*.

## Stack

- **Vite** (no-framework build)
- **Vanilla JavaScript** (ES modules)
- **HTML5 Canvas** for all gameplay rendering
- Web Audio API for synthesized sound (no audio files)
- Google Fonts: Cormorant Garamond + EB Garamond

## Quick start

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default: http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

## Controls

| Input | Action |
|---|---|
| Mouse move | Aim quill |
| Left click or Spacebar | Fire ink |
| ← → Arrow keys | Move quill |
| ♪ button (top right) | Mute / unmute |

## Rules

- Shoot the **next word in sequence** to compose the Dickinson stanza.
- Correct hit → ink splatter, +100 score, word flows to the manuscript.
- Wrong hit → ink blot, screen shake, −30 score.
- Miss a required word (it falls off screen) → it respawns after 1.5 s.
- 5 blots → game over.
- Complete the stanza → victory screen.

## File structure

```
src/
  config.js    — all tunable constants, palette, poem data
  audio.js     — Web Audio API synthesis
  input.js     — mouse + keyboard polling
  entities.js  — WordToken, Projectile, InkParticle, InkBlot, Quill
  render.js    — canvas draw routines, paper grain, vignette, quill art
  game.js      — game logic, update loop, collision detection
  main.js      — state machine, screen transitions, HUD wiring
  style.css    — all CSS (screens, HUD, manuscript panel, buttons)
index.html     — shell markup (title / game / victory / gameover screens)
```
