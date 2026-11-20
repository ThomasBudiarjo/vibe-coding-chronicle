# Vibe Factory — Design Specification

**Date:** 2026-11-20  
**Genre:** Incremental / Management Simulator with Light Story Beats & Random Events  
**Platform:** Web (Desktop keyboard-only & Mobile one-handed portrait)  
**Tech Stack:** Svelte 5 + Vite + TypeScript + Canvas 2D Isometric Pixel Art Renderer + Web Audio API + Vitest

---

## 1. Concept & Player Fantasy

**Vibe Factory** simulates the journey of an indie solo vibe coder starting in a cramped boarding room (*kamar kos*) with a 450 VA electrical meter and a single laptop screen, manually reading client emails and accepting AI code diffs one by one.

Over time, the player gradually upgrades their engineering discipline (**Prompting → Planning → Code Review → Workflows → Autonomous Agent → Swarm of Agents → Software Factory**), wires their inbox to **Hermes Agent / Grok Bot** for automated client intake, upgrades household electrical capacity so the breaker (*MCB*) stops tripping, expands their room, and builds up from **1 to 5 monitors** glowing in an animated 3D isometric pixel-art room.

---

## 2. Layout & Controls (Keyboard-Only PC ↔ One-Handed Mobile)

### Portrait-First Layout
- **Mobile:** Full-screen vertical layout (`100dvh`), with all primary actions anchored in the lower half for comfortable single-thumb play.
- **Desktop:** Centered vertical cabinet (`max-width: 460px`, full height) on a dark atmospheric backdrop, with subtle keyboard shortcut hints (`[Space]`, `[←]`, `[1-4]`) that hide automatically on touch devices.

### Screen Zones
1. **Top Resource Bar (~10%):** `Cash ($)`, `Vibe XP`, `Power Load (W / VA)` with green/amber/red meter + trip indicator, `Tech Debt`, and current Era badge.
2. **Isometric Pixel Art Room (~36%):** Live `240×150` crisp-pixel `<canvas>` showing the coder prompting at their desk, evolving room, 1–5 monitors, server rack, cooling, and MCB blackout state.
3. **Active Workspace Panel (~44%):** Clean, modern dark HUD displaying the active tab:
   - **Work:** Active project progress, Prompt button, randomized Diff card (`Accept` / `Reject & Fix`), Plan phase button (when unlocked), or emergency **Flip MCB Up** panel during power trips.
   - **Inbox:** Incoming randomized client emails (manual selection early on; later adds **Hermes Agent / Grok Bot** auto-intake & negotiation toggle).
   - **Skills:** Gradual skill tree bridging the 7 eras.
   - **Setup:** Physical upgrades — Monitors (1→5), Electrical Capacity (450 VA → 16,500 VA), Room Tier, Cooling, and Compute Rig.
4. **Bottom Navigation Bar (~10%):** 4 large thumb-friendly tabs (`Work`, `Inbox`, `Skills`, `Setup`) with unread/affordable badges.

### 1:1 Control Mapping
| Action | PC Keyboard | Mobile One-Hand |
|---|---|---|
| Switch Tabs | `1` `2` `3` `4` or `Q` / `E` | Tap bottom tab bar |
| Primary Action (`Prompt`, `Accept Diff`, `Flip MCB`) | `Space` or `→` / `D` | Tap primary thumb button or swipe right on Diff card |
| Secondary Action (`Reject / Fix Diff`, `Plan`) | `←` / `A` or `Backspace` / `P` | Tap secondary button or swipe left on Diff card |
| Navigate Lists (Inbox / Skills / Setup) | `↑` / `↓` (`W` / `S`) + `Enter` | Single-thumb scroll & tap |
| Event / Story Modal Choices | `1` `2` `3` or `↑` / `↓` + `Enter` | Tap choice card |
| Toggle Audio Mute | `M` | Tap speaker icon in top bar |

When an Event/Story modal is open, global tab hotkeys are suspended so `1/2/3` exclusively select modal choices.

---

## 3. Core Systems & Economy

### Resources
- **Cash (`$`)**: Earned by shipping client projects and (in later eras) passive SaaS products from the Software Factory. Spent on Hardware/Setup upgrades, API/compute tiers, and event choices.
- **Vibe XP (`XP`)**: Earned from prompts, clean diff reviews, planning, and shipping projects. Spent on unlocking Skills.
- **Power (`usedW` / `capacityVA`)**:
  - Every monitor, compute rig, cooling unit, bot, and active agent slot draws Wattage (`usedW`).
  - Effective safe ceiling is `capacityVA * 0.85` watts (accounting for power factor).
  - Between `85%` and `100%` load, electrical stability enters warning state (flickering light + low trip chance per second). Above `100%` load, trip probability escalates quickly.
  - **MCB Trip (Power Outage):** Lights go out in the isometric room, all active agents/prompts pause, and a red blinking MCB indicator appears. Pressing `Space` / tapping **Flip MCB Breaker** restores power after a short 2-second cooldown (no game over, encouraging players to upgrade PLN VA capacity).
- **Tech Debt (`0–100`)**:
  - Accepting a `hallucination` diff adds `+12` Tech Debt; accepting a `smell` diff adds `+4` Tech Debt.
  - Rejecting/fixing a bad diff or running Refactor lowers Tech Debt.
  - Higher Tech Debt reduces project payout multiplier (up to `-35%` at 100 debt) and increases the chance of negative random events (e.g., *Prod Down*, *Angry Client*).
- **Reputation & Shipped Count**: Tracks completed projects, scales incoming contract quality, and unlocks story milestones.

---

## 4. Seven Eras & Gradual Skill Progression

Each era unlocks organically through **Skills** and **Setup** upgrades, with intermediate skills bridging every major capability jump:

| Era | Name | Typical Setup | Core Gameplay Shift | Bridge Skills |
|---|---|---|---|---|
| 1 | **Kamar Kos & Manual Diff** | 450 VA, 1 Monitor | Manual email pickup → manual Prompt → manual Accept/Reject Diff. | *Better Prompting*, *Git Stash*, *Prompt Templates* |
| 2 | **Belajar Planning** | 900 VA, 2 Monitors | Unlocks **Plan First** phase per project (adds small upfront step, cuts hallucination rate by 45% & boosts payout). | *Spec Writing*, *Context Hygiene*, *Task Breakdown* |
| 3 | **Belajar Code Review** | 1300 VA, 2–3 Monitors | Unlocks **Review Scanner** showing diff risk clues/badges (`Clean` / `Smell` / `Hallucination`) & boosts client payout. | *Diff Linter*, *Test Generation*, *Security Audit* |
| 4 | **Workflow & Bot Intake** | 2200 VA, 3 Monitors | Unlocks **Workflow Pipeline** (auto-chains Plan → Prompt → Auto-Accept Clean Diffs) and **Hermes Agent / Grok Bot** to auto-screen & accept inbox emails. | *Project Rules*, *Safe Auto-Accept*, *Hermes/Grok Webhook* |
| 5 | **Single Autonomous Agent** | 3500 VA, 4 Monitors | 1 background Coding Agent autonomously works through queued projects end-to-end; Bot can auto-negotiate higher rates. | *Agent Tool Use*, *Persistent Memory*, *Bot Negotiation* |
| 6 | **Swarm of Agents** | 5500 VA, 5 Monitors + AC | Multi-agent parallel swarm (*Planner, Coder, Reviewer, Ops*) working on up to 3–5 concurrent projects. Requires Room & Cooling upgrades to avoid thermal throttling. | *Swarm Orchestrator*, *Auto Merge Resolver*, *Prompt Caching* |
| 7 | **Software Factory** | 10,000+ VA, 5-Monitor Command Center | Fully autonomous factory: Hermes/Grok Bot spots opportunities → Swarm builds, tests, and ships recurring SaaS products passively. Unlocks **Exit & New Studio** prestige loop + endless mode. | *Autonomous SaaS Loop*, *Self-Healing Prod*, *Zero-Touch Deploy* |

---

## 5. Setup & Physical Upgrades

All setup upgrades directly impact both simulation stats and the 3D isometric pixel-art room:

1. **Monitors (`1 → 5`):**
   - `1` (Old Laptop) → `2` (Side Monitor) → `3` (Triple Wraparound) → `4` (Overhead Dashboard) → `5` (Full 5-Monitor Command Arc).
   - Grants prompt throughput, inbox visibility, parallel agent slots, and review clarity; increases Watt draw.
2. **Daya Listrik / PLN VA:**
   - `450 VA` → `900 VA` → `1300 VA` → `2200 VA` → `3500 VA` → `5500 VA` → `10000 VA` → `16500 VA`.
3. **Room Tier (`1 → 5`):**
   - `Kamar Kos 3×3` → `Kontrakan Sederhana` → `Home Studio` → `Mini Server Studio` → `Software Factory HQ`.
   - Expands max monitor/server capacity and transforms walls, floor, desk, and props in the pixel-art scene.
4. **Cooling (`1 → 4`):**
   - `Kipas Kecil` → `Standing Fan` → `AC 1/2 PK` → `Dedicated Rack Cooling`.
   - Prevents thermal throttling penalty when running multiple agents / swarm workloads.
5. **Compute Rig (`1 → 5`):**
   - `Laptop Kentang` → `PC Mid-Range` → `Workstation 64GB` → `Home Mini-Server` → `Local Rack Cluster`.
   - Boosts agent speed, token throughput, and unlocks higher swarm concurrency.

---

## 6. Randomization, Random Events & Light Story Beats

### Procedural Email Project Generator
Each inbox email is procedurally generated using a seeded/deterministic RNG interface:
- **Client Archetype:** *Warung/UMKM*, *Indie Founder*, *Seed Startup*, *Creative Agency*, *Crypto/AI Bros*, *Enterprise Corp*.
- **Project Type:** *Landing Page*, *Admin Dashboard*, *WhatsApp/Telegram Bot*, *SaaS MVP*, *Legacy Refactor*, *AI Wrapper*.
- **Random Modifier (0–1 per contract):**
  - *Rush Deadline* (`+40%` cash, higher hallucination chance)
  - *Vague Brief* (`+30%` cash, extra diffs unless Planned)
  - *Clean Spec* (`-30%` hallucination chance)
  - *Generous Tip* (`+25%` XP & cash if shipped with low tech debt)
- **Scaling:** Diff count, payout, and XP scale smoothly with player Era and Reputation.

### Randomized Diff Cards
Each generated diff has:
- A funny/relatable file path and snippet (e.g., `src/auth.ts: // TODO: fix later, trust me`, `package.json: +420 dependencies`, `api/pay.ts: hardcode_price = 0`).
- A risk tier: `clean`, `smell`, or `hallucination`.
- **Visibility Progression:**
  - Era 1: Risk is hidden behind subtle comedic text hints only.
  - Era 2 (Planning): Hallucination probability drops significantly.
  - Era 3 (Code Review): Explicit scanner badges (`SAFE`, `SUSPECT`, `HALLUCINATION`) appear with increasing accuracy.

### Random Events & Story Milestones
- **Story Beats (One-time Era/Setup Milestones):** Triggered when hitting key moments — first shipped client, buying Monitor #2, first MCB power trip, connecting Hermes/Grok Bot, launching first Autonomous Agent, reaching 5 Monitors, and activating the Software Factory.
- **Periodic Random Events:** Trigger every ~45–90 seconds of active play (never interrupting while an event is already open or during MCB trip), offering 2–3 meaningful trade-off choices:
  - *API Rate Limit Hit* (wait/throttle vs pay surge credits vs switch to chaotic cheap model)
  - *Client: "Just Move This Button 2px"* (free quick fix for reputation vs charge scope-creep fee)
  - *New SOTA Model Dropped* (adopt immediately: 2× speed + temporary hallucination spike vs stay stable)
  - *PLN Voltage Drop / Heavy Rain* (pause heavy agents temporarily vs risk MCB trip for bonus payout)
  - *Viral X/Thread Post* (influx of randomized high-pay emails into Inbox)
  - *Prod Incident at 2 AM* (weighted by Tech Debt: quick hotfix vs proper refactor)

---

## 7. Isometric 3D Pixel Art Renderer

- **Canvas Specification:** Logical buffer `240×150` px drawn on an HTML `<canvas>` with `ctx.imageSmoothingEnabled = false` and CSS `image-rendering: pixelated`.
- **Isometric Projection:** Standard 2:1 dimetric/isometric pixel projection (`sx = originX + (x - y) * tileW/2`, `sy = originY + (x + y) * tileH/2 - z * zScale`) with painter's algorithm depth ordering.
- **Dynamic Visual Elements:**
  - **Room Shell:** Floor tiles, back-left & back-right walls, window (ambient dusk/night glow), wall MCB breaker box, floor mattress (Era 1) upgrading to acoustic panels, shelves, potted plant, and server rack (Era 5–7).
  - **Desk & 1–5 Monitors:** Desk widens with Room Tier; monitors appear sequentially around the coder (center laptop → left vertical monitor → right monitor → top-left overhead → top-right overhead), each rendering animated scrolling pixel lines in distinct colors (green code, cyan terminal, amber logs, purple agent graphs).
  - **Vibe Coder Character:** Pixel avatar seated at desk with animated hands typing when prompting/agents run, occasional coffee mug lift, head-scratch indicator when a hallucination diff is active, and startled exclamation mark on MCB trip.
  - **Live Effects:**
    - Flickering amber overlay when power load > 85%.
    - Full darkroom blackout with blinking red LED on the wall MCB box during an MCB trip.
    - Floating envelope pixel particles flying into the side monitor when **Hermes/Grok Bot** grabs an email.
    - Glowing data packets pulsing between monitors and server rack when **Swarm / Software Factory** is running.

---

## 8. Architecture, Save System & Testing

### Module Boundaries
```text
src/
├── engine/              # Pure TypeScript simulation (zero DOM/Svelte imports)
│   ├── types.ts         # Complete state, action, catalog, and event types
│   ├── rng.ts           # Seedable PRNG (Mulberry32) for testable randomness
│   ├── catalog.ts       # Eras, skills, setup tiers, project/diff/event templates
│   ├── generators.ts    # Procedural email, diff, and random event generators
│   ├── simulation.ts    # Pure tick(state, dt, rng) and reduce(state, action, rng)
│   └── storage.ts       # Versioned localStorage save/load, export/import, offline progress
├── renderer/            # Standalone Canvas 2D Isometric Pixel Renderer
│   ├── iso.ts           # Isometric projection helpers & color palettes
│   ├── sprites.ts       # Procedural pixel-art room, furniture, coder, 1-5 monitors, FX
│   └── roomRenderer.ts  # 240×150 frame renderer consuming read-only RenderSnapshot
├── audio/
│   └── sfx.ts           # Synthesized Web Audio API retro SFX (key click, accept, buzz, MCB clunk, level up)
└── ui/                  # Svelte 5 runes UI
    ├── gameStore.svelte.ts
    ├── components/
    │   ├── TopBar.svelte
    │   ├── IsoRoomCanvas.svelte
    │   ├── WorkPanel.svelte
    │   ├── InboxPanel.svelte
    │   ├── SkillsPanel.svelte
    │   ├── SetupPanel.svelte
    │   ├── EventModal.svelte
    │   └── BottomNav.svelte
    └── App.svelte
```

### Persistence & Error Handling
- Auto-saves every 10 seconds and on `visibilitychange` / `beforeunload` to `localStorage` under a versioned key (`vibe-factory-save-v1`).
- **Offline Progress:** Calculates passive progress from active Agents / Bot / Software Factory up to 8 hours away (never triggers an MCB trip retroactively while offline so returning feels rewarding), displaying a compact welcome-back summary banner.
- **Fault Tolerance:** Corrupted or incompatible save payloads gracefully reset to a clean initial state without crashing. A lightweight Settings popover allows manual Reset and JSON Export/Import.

### Verification Plan
- **Unit Tests (Vitest)** covering `src/engine/`:
  1. Manual loop: email accept → prompt → diff accept/reject → project ship → cash & XP payout.
  2. Hallucination & Tech Debt mechanics + Planning and Code Review mitigation.
  3. Wattage calculation, overload warning, MCB trip trigger, and breaker reset recovery.
  4. Automation progression: Workflow auto-accept, Hermes/Grok Bot auto-intake, Single Agent, Swarm concurrency, and Software Factory passive income.
  5. Save/load roundtrip, corrupt-save fallback, and offline earnings cap.
- **Browser E2E & Visual Verification:**
  - Verify desktop keyboard-only play (`1-4`, `Space`, `←/→`, `↑/↓`, `Enter`, `1-3` modal) and mobile portrait viewport (`390×844`) layout without overflow or cut-off buttons.
  - Inspect rendered isometric pixel art across room tiers, 1→5 monitors, and MCB blackout state.
