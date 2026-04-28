# SkyMetropolis | Final Project Audit & Review

**Date:** April 2026
**Reviewer:** AI Studio Senior Engineer 

## 1. Project Status Overview

- **Completed:**
  - 15x15 grid-based city builder foundation with React Three Fiber (R3F).
  - Basic economy loop: population growth (Residential) & money generation (Commercial/Industrial).
  - AI Integration (Gemini): Dynamically generated events, citizen quotes, and milestone goals.
  - Interactive UI with build tools, news feed, game speed controls (1x/2x/3x), and inspector.
  - 3D Visuals: Instance-based traffic, pedestrians, stylized procedural buildings, particle effects (smoke, water), post-processing, and day/night cycle.
  - Optimized rendering with Material Caching and grouped instancing.

- **Partially Done:**
  - Happiness mechanics: Currently evaluated at a global scale rather than localized (e.g., pollution radii).
  - Visual Time-of-Day: A day/night cycle exists but operates fully disconnected from the actual game logic loop and speed controls.
  - Demolition/Redevelopment: Exists but lacks clear UI indicators of cost or refunds before acting.

- **Missing:**
  - **Save / Load System:** The game completely resets on browser refresh.
  - **Audio Engine:** No sound effects, music, or ambient audio.
  - **Terrain Generation:** The map is a perfectly flat plane with no water features or elevation.
  - **City Amenities / Utilities:** No electricity, water supply, or emergency services mechanics.

---

## 2. Critical Issues (Must Fix Before Finish)

1. **Disconnected Day/Night Cycle (Desync Bug):** 
   - *Issue*: The `DayNightSystem` inside `IsoMap.tsx` relies on `THREE.Clock.elapsedTime` instead of the global `day` state or `gameSpeed` multiplier. Accelerating the game to `3x` has no impact on the visual sun/moon rotation.
   - *Fix*: Pass `gameSpeed` or `gameDay` into the `IsoMap` and synchronize the sun's rotation to the core game loop.
2. **Missing Progression Persistence (Save System):**
   - *Issue*: Core loop relies on long-term accumulation, but if a player accidentally reloads, they lose hours of progress. 
   - *Fix*: Implement `localStorage` serialization for the `grid`, `stats`, `newsFeed`, and `currentGoal` states. Load them in a `useEffect` on mount.
3. **Overlapping UI on Mobile Layouts (UX):**
   - *Issue*: The `absolute`-positioned panels in `UIOverlay.tsx` (Top left heatmap, top right goals, bottom toolbars) can aggressively overlap on 768px-wide screens and below, making the game unplayable.
   - *Fix*: Add `z-index` management, responsive collapsing (e.g., hiding the goal UI under a toggle), and CSS grid definitions for UI overlays.

---

## 3. Improvements (High Impact)

1. **Localized Adjacency Penalties (Logic/Gameplay):**
   - *Improvement*: Instead of globally deducting happiness via `(indCount * 4)`, iterate over residential tiles to check if industrial tiles are in a 1-2 block radius. It encourages actual "city planning."
2. **Audio & Sound Effects (UX/Immersion):**
   - *Improvement*: Add a global audio manager (via `Howler.js` or standard HTML Audio). Required sounds:
     - Ambient background noise (birds chirping, low traffic hum).
     - Distinct "Pop" / "Thud" sounds for placing buildings.
     - Cash register sound when goals are met.
3. **Visual Feedback on Hover (UX):**
   - *Improvement*: When "Road" or "House" is selected, hovering over an empty tile should render a holographic / transparent phantom version of the building (and its cost in red/green text) before clicking so the user knows exactly what will happen.
4. **Enhanced Heatmap (UI):**
   - *Improvement*: Prevent grid selections/interactions while viewing Heatmap modes. Accidental clicks currently place buildings while trying to analyze population density.

---

## 4. Final Features to Add (To Call It "Done")

- **Win Condition / Scaling Milestones:** Add a macro-goal (e.g., "Megalopolis: Reach 10,000 population and $500,000"). Display a congratulatory modal once reached.
- **Natural Obstacles:** Randomly spawn trees, rocks, or lakes on empty tiles during map generation that must be bulldozed for a high penalty to expand.
- **Save / Load / Wipe Data Options:** Add straightforward settings in the Start Screen.

---

## 5. Manual Tasks (For You To Do)

Here is your exact actionable checklist to close out this project:

- [ ] **Fix Time Sync:** In `App.tsx`, pass a new `normalizedTime` prop to `<IsoMap>`. Update it via `setInterval` accounting for `gameSpeed`. In `IsoMap.tsx`, update the sun position using this prop instead of `useFrame`'s `state.clock`.
- [ ] **Implement localStorage Initialization:** 
   1. Create `saveState` and `loadState` utility functions.
   2. Hook into `useEffect` in `App.tsx` that dumps `grid` and `stats` to `localStorage` every 5 in-game days.
   3. On the `StartScreen`, check if `localStorage.getItem('save')` exists to show a "Continue" button instead of just "Start".
- [ ] **Implement Audio Context:** Add an `AudioContext` or `HTMLAudioElement` references in your main App wrapper. Hook standard `play()` functions into the `onClick` handlers of the build menu and the grid placement logic.
- [ ] **Responsive UI Refactor:** Audit `UIOverlay.tsx`. Change absolute floating panels on mobile to use a bottom-sheet pattern or an off-canvas drawer to avoid occluding the 3D canvas entirely.
- [ ] **Adjacency Logic Rewrite:** Update the `setInterval` in `App.tsx` where happiness is evaluated: Map over the grid arrays to find the distance between Res/Ind tiles.

---

## 6. Optional Enhancements (Nice-to-have)

- **Weather-based Economics:** Rain causes slower traffic; snow increases population happiness slightly but lowers factory efficiency.
- **Catastrophes (Gemini Powered):** Let the AI spawn rare "Disasters" (e.g., "A rogue meteor hits sector 7") converting a radius of tiles to "Damaged" status which requires money to clear out.
- **Edge-pan Camera:** Let users pan the camera by moving their mouse to the edge of the screen, common in RTS / City Builders.
