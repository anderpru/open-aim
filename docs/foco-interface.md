# Foco interface

This fork uses a quieter lobby with a persistent side menu and one primary action per area.

- **Train:** one stable recommendation. Change map and Browse exercises reveal the original catalog.
- **Targets:** select an exercise, then use its original preview, Tune, favorites and Play actions.
- **Community:** discovery and filters come first. The publishing billboard is removed; Create & Publish remains available.
- **Progress:** latest result, weekly activity and five recent runs. Calendar and task breakdown expand on demand.
- **Collection:** weapon preview, variants and equipment selection retain their original actions.
- **Settings:** General starts with five common controls. More options exposes the remaining controls, and Show explanations reveals help. Search can jump directly to an optional control.

Search is available from the side menu or `/`; Escape closes it. Tools & account contains the original utility actions. The side menu disappears during training.

## Run

From `app/`, install dependencies with `npm ci`, then run `npm start`. Running from source uses the repository's existing isolated test profile.

## Implementation

`app/foco-ui.css` is the lobby theme layer, loaded after the previous theme by `app/main.js`. `app/foco-ui.js` delegates navigation and utilities to the existing controls. `app/target-workshop.js` renders one selected exercise; `app/site/aim-ui/history-board.mjs` renders the condensed history. No new runtime dependency is required. Gameplay, maps, scoring and save formats use the original implementation.

## Validation

Validated the six lobby areas at 1600, 1280 and 1024 pixels, map/catalog disclosure, search and Escape, target selection and tuning, all settings categories, advanced options, search jumps and weapon selection. In Electron, verified sensitivity changes and restoration, desktop import access, utility actions, a complete 60-second target run, return to the lobby and its recorded history. `npm run check` validates all 104 scenarios. An installer was not built as part of this menu update.
