<div align="center">

<img src="docs/media/hero.svg" alt="CityVerse — an isometric 3D city builder with an AI advisor" width="100%">

<p>
  <a href="https://city-verse-gilt.vercel.app"><img alt="Live" src="https://img.shields.io/badge/live-start%20building-5ad1ff?style=for-the-badge&labelColor=050914"></a>
  <img alt="R3F" src="https://img.shields.io/badge/R3F-isometric%203D-ffb547?style=for-the-badge&labelColor=050914">
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-city%20advisor-7cf29c?style=for-the-badge&labelColor=050914">
  <img alt="React" src="https://img.shields.io/badge/React-Vite-5ad1ff?style=for-the-badge&labelColor=050914">
</p>

<p><em>An isometric 3D city-building simulation where an AI advisor responds to everything you do.<br>
Zone, grow and keep your citizens happy while the news writes itself.</em></p>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## What it is

Build residential, commercial, industrial and park zones, manage the economy and watch the population grow. Instead of scripted events, a Gemini advisor reads your city's exact state and generates quests, shapes the daily news feed and reacts to swings in citizen morale.

| | |
|---|---|
| **Isometric 3D engine** | Procedurally generated scenes with Three.js and React Three Fiber, with a day and night cycle. |
| **AI advisor** | Real-time goals and news events from your city's statistics. |
| **Dynamic economy** | Population growth, income and happiness simulated together. |
| **Live traffic** | Vehicles drive your road network on their own, with traffic lights at junctions. |
| **Procedural architecture** | Buildings vary in shape, height and detail. |
| **Premium HUD** | A responsive interface with smooth motion. |

```mermaid
flowchart LR
  P[Player · zoning · roads] --> SIM[Simulation<br/>population · income · happiness]
  SIM --> R[R3F scene · traffic · buildings]
  SIM --> AI[Gemini advisor]
  AI --> Q[Quests]
  AI --> N[News feed]
  Q --> P
```

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**CityVerse**, yapay zekânın hamlelerine anlık tepki verdiği izometrik bir 3B şehir kurma simülasyonu. Konut, ticaret, sanayi ve park alanları kurup ekonomiyi, nüfusu ve vatandaş mutluluğunu yönetiyorsun. Statik olaylar yerine Gemini danışmanı şehrin durumunu okuyup görevler üretiyor ve günlük haber akışını yazıyor. Yollarda trafik canlı akıyor, binalar prosedürel olarak çeşitleniyor.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

```sh
npm install
echo "GEMINI_API_KEY=..." > .env.local
npm run dev
npm run build
```

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>Every block tells a story.</sub>
</div>
