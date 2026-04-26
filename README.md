<div align="center">

<br />

<img src="https://img.shields.io/badge/SkyMetropolis-v1.0-000000?style=for-the-badge&logoColor=white" alt="version" />
<img src="https://img.shields.io/badge/Built_with-React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="react" />
<img src="https://img.shields.io/badge/Three.js-3D-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="threejs" />
<img src="https://img.shields.io/badge/TailwindCSS-v3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="tailwind" />
<img src="https://img.shields.io/badge/Gemini_AI-API-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="gemin" />
<img src="https://img.shields.io/badge/Vite-Bundler-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="vite" />

<br /><br />

```text
  ██████╗██╗  ██╗██╗   ██╗███╗   ███╗███████╗████████╗██████╗  ██████╗ ██████╗  ██████╗ ██╗     ██╗███████╗
 ██╔════╝██║ ██╔╝╚██╗ ██╔╝████╗ ████║██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗██╔══██╗██╔═══██╗██║     ██║██╔════╝
 ███████╗█████╔╝  ╚████╔╝ ██╔████╔██║█████╗     ██║   ██████╔╝██║   ██║██████╔╝██║   ██║██║     ██║███████╗
 ╚════██║██╔═██╗   ╚██╔╝  ██║╚██╔╝██║██╔══╝     ██║   ██╔══██╗██║   ██║██╔═══╝ ██║   ██║██║     ██║╚════██║
 ███████║██║  ██╗   ██║   ██║ ╚═╝ ██║███████╗   ██║   ██║  ██║╚██████╔╝██║     ╚██████╔╝███████╗██║███████║
 ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝╚═╝╚══════╝
```

### **Build the Future. Powered by AI.** — The intelligent isometric 3D city builder.

</div>

---

## ✦ What is SkyMetropolis?

**SkyMetropolis** is a next-generation isometric 3D city-building simulation where Artificial Intelligence dynamically responds to your actions. Create thriving urban centers with residential, commercial, industrial, and park zones while managing the economy, population growth, and citizen happiness.

Instead of static events, the **Gemini AI Advisor** evaluates your city's exact state to generate unique quests, shape the daily news feed, and respond directly to fluctuations in citizen morale. Built for the modern web with React Three Fiber, Vite, and Tailwind CSS.

---

<details>
<summary><strong>🇹🇷 Türkçe Açıklama</strong></summary>

<br />

**SkyMetropolis**, Yapay Zekanın eylemlerinize dinamik olarak tepki verdiği yeni nesil izometrik 3D şehir kurma simülasyonudur. Şehir ekonomisini, nüfus artışını ve vatandaş mutluluğunu yönetirken; konut, ticaret, sanayi ve park alanlarıyla büyüyen kentsel merkezler inşa edin.

Statik olaylar yerine, **Gemini Yapay Zeka Danışmanı** şehrinizin tam durumunu değerlendirerek benzersiz görevler oluşturur, günlük haber akışını şekillendirir ve vatandaş moralindeki dalgalanmalara doğrudan tepki verir. React Three Fiber, Vite ve Tailwind CSS ile modern web için inşa edilmiştir.

</details>

---

## ⚡ Features

| Feature | Description |
|---------|-------------|
| 🏙️ **Izometric 3D Engine** | Stunning procedurally generated 3D environments powered by Three.js & React Three Fiber |
| 🤖 **Gemini AI Advisor** | AI analyzes your city stats to generate real-time goals and immersive news events |
| 📊 **Dynamic Economy** | Sophisticated simulation of population growth, income generation, and citizen happiness |
| 🚗 **Live Traffic System** | Simulated vehicles autonomously navigate your expanding road networks |
| 🏗️ **Procedural Architecture** | Buildings have dynamic variance in shape, height, textures, and details |
| 🚦 **Smart Infrastructure** | Traffic lights, road connections, and terrain generation happen seamlessly |
| 📱 **Responsive UI** | Beautiful, premium cross-platform HUD with Tailwind CSS and Framer Motion |

---

## 🛠️ Tech Stack

```text
Frontend        →  React 19 · TypeScript (strict) · Vite · Framer Motion
3D Engine       →  Three.js · React Three Fiber (@react-three/fiber)
3D Helpers      →  React Three Drei (@react-three/drei)
UI Styling      →  Tailwind CSS v3 · Lucide React (Icons)
AI Integration  →  @google/genai (Gemini API)
Fonts           →  Inter (UI) · Space Grotesk (HUD/Display)
```

---

## 📐 Project Structure

```text
SkyMetropolis/
├── components/
│   ├── IsoMap.tsx           # Primary 3D simulation engine, procedural grids, and traffic
│   ├── StartScreen.tsx      # Premium landing & initialization interface
│   └── UIOverlay.tsx        # In-game HUD, tool selection, and dynamic news ticker
├── services/
│   └── geminiService.ts     # AI interactions (generating goals & news) via Gemini API
├── App.tsx                  # Core game state loop (money, population, happiness, ticks)
├── constants.tsx            # Economy tuning, building costs, definitions
├── types.ts                 # TypeScript interfaces and globally shared types
├── index.html               # Entry point with Tailwind config & web fonts
├── vite.config.ts           # Vite build configuration & environment setup
└── package.json             # Dependencies and build scripts
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18`
- A valid Gemini API Key from Google AI Studio

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/SkyMetropolis.git
cd SkyMetropolis

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App runs at `http://localhost:3000`.

---

## 🔒 Security & Performance

| Category | Implementation |
|----------|----------------|
| **AI Safety** | Strict JSON schema enforcement for Gemini responses via structured outputs |
| **GPU Optimization** | InstancedMeshes used for thousands of trees and vehicles for 60FPS performance |
| **State Management** | Memoized 3D geometry generation and strict React interval refs to prevent render thrashing |
| **Responsive** | Mobile-first HUD layout scaled seamlessly over the WebGL canvas |

---

## 🗺️ Roadmap

- [x] Initial 3D engine setup & isometric camera controls
- [x] Procedural building generation & variant styling
- [x] Core resource loop (Money, Population, Day tick)
- [x] Gemini AI integration for custom active goals
- [x] Live dynamic traffic and intersection rendering
- [x] Premium SaaS-style landing screen & typography overhaul
- [ ] Implement day-night cycle & dynamic lighting
- [ ] Add advanced disaster events powered by AI
- [ ] Cloud save infrastructure for sharing city layouts

---

<div align="center">

Built with precision and imagination.

<br />

*If you find this useful, consider giving it a ⭐*

</div>
