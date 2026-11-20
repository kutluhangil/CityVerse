# CityVerse

An isometric 3D city-builder running in the browser with a tactile architectural **Paper Model (Fildişi Kâğıt)** aesthetic, deterministic RCI economy, seasonal weather simulation, rule-based civic advisor, and full English / Turkish localization.

## Features

- **3D Architectural Paper Diorama**: React Three Fiber & Three.js isometric canvas with procedurally built buildings (upgrading up to Level 3), terrain masking (grass, coastal sand, forests, water), soft shadows, day/night cycle, animated traffic cars, pedestrians, construction dust, floating income feedback, and fireworks celebrations.
- **RCI Economy & Municipal Budget**: Residential, Commercial, and Industrial demand bars coupled with BFS road connectivity (`sim/connectivity.ts`), adjustable municipal tax rates, building upkeep, bankruptcy risk warnings & emergency bailout, and seasonal weather impact (rain slowdowns, winter `-30%` industrial output).
- **City Services & Progression**: Unlockable civic infrastructure across **Village → Town → City → Metropolis** milestones (`Power Plant`, `Fire Station`, `School`, `Police Station`, `Hospital`) with 5 heat-map data overlays (`none`, `population`, `income`, `happiness`, `services`).
- **Rule-Based City Advisor & Events**: Telemetry-driven goals (`sim/advisorAnalysis.ts`, `services/advisor.ts`) with escalating rewards, non-repeating history, random civic events (`fire`, `festival`, `strike`) causing repairable tile damage, and context-linked city headlines (`services/newsTemplates.ts`).
- **Map Expansion, Drag-Painting & History**: Expand island plots from `15×15 → 21×21 → 27×27 → 33×33`, click-and-drag tool painting, and 30-step Undo/Redo history (`Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`).
- **Keyboard Shortcuts & Bilinguality (EN / TR)**:
  - `1–9`: Select building / upgrade / inspect tools
  - `R`: Select Road tool
  - `Del` / `Backspace` / `0`: Select Demolish tool
  - `Space`: Pause / Resume simulation
  - `Q` / `E`: Rotate camera left / right
  - `P` / `Esc`: Toggle / Exit Photo Mode
  - Instant **EN / TR** toggle (`cityverse_lang`) and local save persistence + JSON export/import (`cityverse_save_v1`).

## Tech Stack

- **Frontend & 3D**: React 19, TypeScript, Tailwind CSS v4, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `three`, `lucide-react`
- **Audio**: Procedural Web Audio API sound effects (`utils/audio.ts`)
- **Testing & Quality**: ESLint, TypeScript (`tsc --noEmit`), Vitest, Playwright E2E, GitHub Actions CI (`.github/workflows/ci.yml`)

## Project Structure

- `App.tsx` / `index.tsx` — Root application shell & I18n provider
- `sim/` — Pure deterministic simulation engine & unit tests (`grid.ts`, `history.ts`, `connectivity.ts`, `economy.ts`, `services.ts`, `milestones.ts`, `events.ts`, `advisorAnalysis.ts`, `placement.ts`, `refund.ts`, `storage.ts`, `tick.ts`)
- `services/` — Rule-based advisor & news headline generators (`advisor.ts`, `newsTemplates.ts`)
- `scene/` — 3D R3F scene modules (`CameraRig.tsx`, `graphics.ts`, `ground/`, `buildings/`, `traffic/`, `lighting/`, `weather/`)
- `components/` — HUD & modals (`IsoMap.tsx`, `UIOverlay.tsx`, `HudTopBar.tsx`, `HudWidgets.tsx`, `BudgetPanel.tsx`, `AdvisorCard.tsx`, `Inspector.tsx`, `EventBanner.tsx`, `NewsFeedCard.tsx`, `StartScreen.tsx`, `CityModals.tsx`, `PhotoModeOverlay.tsx`)
- `utils/` — React hooks & helpers (`useCityActions.ts`, `useCityHistory.ts`, `useCityPersistence.ts`, `useCitySimulation.ts`, `useKeyboardShortcuts.ts`, `i18n.ts`, `audio.ts`)
- `e2e/` — Playwright end-to-end smoke suite (`smoke.spec.ts`)

## Development & Verification

```sh
npm install
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:e2e
```
