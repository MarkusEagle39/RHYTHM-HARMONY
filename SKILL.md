---
name: rhythm-game-prototype
description: Build, refine, and debug browser-based rhythm-game prototypes with note lanes, song charts, timing judgments, scoring, and game menus. Apply to the user's RHYTHM HARMONY prototype and similar rhythm-game simulation tasks; do not add accounts or server features unless requested.
---

# Rhythm Game Prototype

Use this skill when implementing or reviewing a browser rhythm-game prototype. Reply in the user's language and continue in the existing project when available.

## Current project defaults

These are the user's current choices for RHYTHM HARMONY, not permanent constraints on unrelated projects. Follow newer user instructions over these defaults.

- Project files are in `outputs/neon-rhythm/`; this prototype is plain HTML, CSS, and JavaScript and can run directly in a browser.
- Keep it local and simulation-only: no login, Google OAuth, backend, database, or real persistence unless the user asks to expand scope.
- Preserve the current dark visual direction with gold and cyan accents when refining this project. Use distinct locally stored cover art for each track and treat new visual references as guidance while keeping the interface original.
- The catalog contains locally synthesized demos of **Für Elise**, **Atraente**, **Brejeiro**, and **Odeon**. **Easy**, **Medium**, and **Hard** are chart variants for each selected track; vary note density and timing without changing its musical motif. Keep each chart's planned runtime below 60 seconds, including countdown and end tail; user pauses can extend wall-clock time.
- Track and difficulty selection both update the chart, note count, selected state, and result metadata.
- Menu controls use arrow keys to navigate and Enter to activate; Backspace goes back. In gameplay, D/F/J/K and arrow keys hit the four lanes.
- Use public-domain compositions for these demos and local synthesis unless the user provides or authorizes a specific audio source. Label synthesized excerpts as demos rather than full recordings.

## Implementation guidance

Inspect the current files before editing and preserve existing behavior outside the requested change. Keep song/chart data separate from screen presentation enough that adding another track does not require rewriting scoring or navigation.

For chart changes, verify the last event time plus countdown and end tail stays below the one-minute cap. Keep note coordinates local to their lane element; the lane already provides the horizontal offset. Ensure difficulty selection, keyboard navigation, and mouse activation all select the same chart.

When reviewing gameplay visuals, inspect the active game screen at the user's viewport size. Check that notes fall in their assigned lane, the judgment line aligns with the hit window, and side HUD elements do not cover notes. Prefer focused fixes over redesigning unrelated screens.

Run a lightweight syntax or browser smoke check when it materially verifies the requested change. Do not add a test suite unless requested. Update the project README when controls or run instructions change.

## Skill map and module ownership

Use this project skill as the shared workflow for browser rhythm-game implementation and review. Keep each change in the module that owns the behavior:

| Task | Source of truth | Review focus |
| --- | --- | --- |
| Game rules, chart generation, timing, score, Fever | `js/Game.js` | Four valid lanes, sorted events, difficulty density, Fever enabled/disabled behavior, under-60-second chart runtime |
| Track catalog, musical motifs, composer metadata, cover paths | `js/tracks.js` | Distinct motifs, valid note values, local artwork files |
| Screen state, selected-track art, HUD and results | `js/Screen.js` | Display matches game state and selected track |
| Navigation, keyboard/touch controls and settings | `js/Menu.js` | Keyboard and pointer actions reach the same game actions |
| Synthesized notes and volume | `js/Audio.js` | Local Web Audio only; tolerate normal start, mute, resume and disconnect lifecycle |
| Startup and local-file bundle | `game.js`, `build.mjs` | Regenerate `game.bundle.js` from modules; do not hand-edit generated bundle |
| Layout and visual assets | `index.html`, `style.css`, `assets/` | Responsive layout, readable labels, local image references |
| Automated logic checks | `tests/game.test.mjs` | Use Node's built-in test runner (`node --test`); no third-party test dependency |

When the user explicitly asks for tests, add focused regression tests for the changed behavior. A bundle syntax check complements the unit tests; visual behavior still needs a browser check when the browser environment permits it.
