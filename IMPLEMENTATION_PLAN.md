# SkyMetropolis | Final Implementation Plan

**Objective:** Transition from analysis to execution and SHIP the project. This document outlines the exact, step-by-step technical implementation required to finalize SkyMetropolis.

---

## 1. Immediate Fixes (Do First)

These are critical game-breaking or immersion-breaking issues that need to be resolved immediately.

### 1.1 Synchronize the Day/Night Cycle with Game Speed
Currently, the visual day/night cycle runs on real-time (`elapsedTime`), making it disconnected from the actual in-game days and the `1x/2x/3x` speed controls.

**Files to Edit:**
- `App.tsx`
- `components/IsoMap.tsx`

**What to Change:**
1. In `App.tsx`, introduce a `globalTime` state variable: `const [globalTime, setGlobalTime] = useState(0);`.
2. Inside the main game loop (`setInterval`), increment `globalTime` by a small fraction (e.g., `setGlobalTime(prev => prev + 0.1)`) every tick. Multiply the increment by `gameSpeed`.
3. Pass `globalTime` down to the `<IsoMap timeOfDay={globalTime} />` component.
4. In `components/IsoMap.tsx`, update the `DayNightSystem` component to accept `timeOfDay` as a prop.
5. Remove `state.clock.elapsedTime` dependencies in `useFrame` for lighting, and instead base the sun's rotation and light intensities on the passed `timeOfDay`.

### 1.2 Prevent Grid Interaction in Heatmap Mode
Users can accidentally build over structures while analyzing population or land value in the heatmap overlay.

**Files to Edit:**
- `components/UIOverlay.tsx`
- `App.tsx`

**What to Change:**
1. In `App.tsx`, when `dataMode !== 'none'` (Heatmap mode is active), intercept the `onPointerDown` or grid click event to `return false`.
2. In `UIOverlay.tsx`, add a visual indicator or a toast notification warning the user: *"Build tools disabled while Heatmap is active."*

---

## 2. Core Implementations (Finish the Product)

### 2.1 Persistence (Save & Load System)
A city builder without a save system is fundamentally broken. We must serialize the game state to `localStorage`.

**Files to Edit:**
- `App.tsx`
- `components/StartScreen.tsx`

**What to Change:**
1. **Serialization:** Create a `useEffect` in `App.tsx` that triggers whenever `day` increments.
   ```typescript
   useEffect(() => {
       if (!gameStarted) return;
       const saveData = { grid, stats, newsFeed, currentGoal, globalTime };
       localStorage.setItem('skymetropolis_save', JSON.stringify(saveData));
   }, [stats.day]);
   ```
2. **Deserialization:** Refactor the `StartScreen` to check for an existing save. Emit an `onLoadGame` event back to `App.tsx` if the user clicks "Continue".
3. **Application:** When `onLoadGame` is triggered, parse the JSON, apply it to all state variables, and bypass the normal `createInitialGrid` initialization.

### 2.2 Localized Adjacency Penalties (Advanced Game Logic)
Global industrial penalties are too simplistic. Industry should only hurt residential happiness if they are built too close to each other.

**Files to Edit:**
- `App.tsx`

**What to Change:**
1. Locate the happiness calculation block inside the main loop interval.
2. Instead of a flat `indCount * 4` deduction, map over `grid` to locate all `BuildingType.Residential` tiles.
3. For each Residential tile, scan a radius of 2 tiles. Deduct localized happiness (and consequently tax income) for every `BuildingType.Industrial` tile found within that proximity.

---

## 3. Feature Additions

### 3.1 Audio Engine
Add auditory feedback for immersion.

**Files to Edit:**
- `App.tsx`
- `/utils/audio.ts` (New File)

**What to Change:**
1. Build a simple utility script exporting functions like `playBuildSound()`, `playCoinSound()`, and `startAmbientMusic()`. Use base64 audio strings or external CDN links.
2. Call `playBuildSound()` in the grid click handler.
3. Call `playCoinSound()` inside `handleClaimReward()`.

### 3.2 Win Condition & Milestones
Give the player a macro reason to play.

**Files to Edit:**
- `App.tsx`
- `components/UIOverlay.tsx`

**What to Change:**
1. Define a Megalopolis Milestone: e.g., Population 5,000 and Money $100,000.
2. Check against these stats in the main loop interval.
3. Once breached, trigger a `setShowWinScreen(true)` state which mounts an overarching congratulatory modal outlining total days survived and final stats.

---

## 4. Step-by-Step Execution Plan

Follow these steps in strict, chronological order to avoid merge conflicts and logic breakdowns.

1. **Step 1:** Fix the `Heatmap` interaction bug. It's the fastest win and prevents data corruption while testing.
2. **Step 2:** Refactor the `DayNightSystem` to use deterministic time (`globalTime`) synced to `gameSpeed`.
3. **Step 3:** Overhaul the Adjacency Logic. Get the simulation working as intended.
4. **Step 4:** Implement `localStorage` serialization. Ensure you can refresh the page and continue your city.
5. **Step 5:** Add layout responsiveness to `UIOverlay.tsx`. Use Tailwind `hidden md:flex` or collapsing panels to ensure nothing overlaps on mobile devices.
6. **Step 6:** Hook up the Audio Engine to the interactions.
7. **Step 7:** Implement the final Win Condition modal.

---

## 5. Manual Actions (For Me)

*Here is your exact execution checklist. Copy and paste code based on the instructions above.*

- [ ] Audit `App.tsx` and wrap the `onPointerUp` grid-click logic with `if (dataMode !== 'none') return;`.
- [ ] Add `globalTime` state to `App.tsx` and update the `Interval` to increment it based on `gameSpeed`.
- [ ] Modify `components/IsoMap.tsx` and swap `state.clock.elapsedTime` with the new time prop.
- [ ] Add the `saveState` logic to `App.tsx` inside a `useEffect` tracking `stats.day`.
- [ ] Update `components/StartScreen.tsx` to detect `localStorage` and expose a 'Continue Game' button.
- [ ] Add distance checking (Euclidean or Manhattan) to the `App.tsx` happiness formula.
- [ ] Setup simple HTML5 `<audio>` tags or use a lightweight utility function for sound effects.
- [ ] Convert `absolute` panels in `UIOverlay.tsx` to standard document flow or bottom-anchored sheets on `< 768px` screens.

---

## 6. Final Quality Pass

Before shipping, verify the following:

- **Verification 1:** Refresh the browser. Does the `<StartScreen/>` persist your layout and stats perfectly?
- **Verification 2:** Set the simulator to `3x` speed. Watch the sun. Does the day/night cycle rotate 3x faster?
- **Verification 3:** Build a factory right next to a level 3 house. Does only that house show a decline, or does global happiness tank?
- **Verification 4:** Shrink your browser window to a mobile aspect ratio. Can you select all building options? Can you still see your money?
- **Verification 5:** Play until the Megalopolis goal is met. Does the modal appropriately interrupt gameplay? 

*If all 5 verify successfully, the project is officially DONE.*
