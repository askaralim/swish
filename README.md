# Swish

A premium NBA statistics app for iOS, built with React Native and Expo. Focused on unique insights, clean design, and real-time data.

## Highlights

- **Swish Score (GIS)** — Proprietary Game Impact Score with tier labels (MVP, Elite, Starter, etc.). Shows who dominated each game at a glance.
- **Player Performance Cards** — View any player's game stats on a shareable card; save as PNG to your device or share.
- **AI Game Summary** — Post-game AI match recaps (AI INSIGHTS) for finished games.
- **Player Comparison** — Side-by-side stat comparison with visual bars (points, rebounds, FG%, etc.).
- **Chinese-Localized** — UI and translated NBA news for Chinese-speaking users.

## Features

### Games & Live Data
- **Games Dashboard** — Today's games with real-time status, marquee highlighting, and date navigation.
- **Game Details** — Collapsing header, live auto-refresh (10s for live games), period scores, team stats.
- **Statistical Comparison** — FG%, 3P%, Points in Paint, rebounds, assists, etc., with proportional bars.
- **Pre-Game Context** — Season series history, injury reports by team.

### Teams & Players
- **Team Profiles** — Roster, schedule, recent results, team leaders.
- **Player Profiles** — Career stats, bio, game logs.
- **Top Players Leaderboard** — League leaders by category with rank badges.

### News & More
- **NBA News Feed** — Infinite-scroll feed of translated NBA news.
- **Conference Standings** — East/West rankings with playoff seeding badges.
- **About** — Version, legal links (Privacy Policy), data source disclaimer.

### Technical
- Local team logo assets for fast loading.
- Network resilience via `NetInfo` for offline/online recovery.
- Dark-first design with consistent motion and layout.
- Private backend (`nba-stats-api`) for data aggregation.

## Tech Stack

- **Framework** — [Expo SDK 54](https://expo.dev/) (React Native)
- **Routing** — [Expo Router](https://docs.expo.dev/router/introduction/)
- **Data** — [TanStack React Query](https://tanstack.com/query/latest)
- **Network** — `@react-native-community/netinfo`
- **Cards** — `react-native-view-shot`, `expo-media-library`
- **Backend** — `nba-stats-api` (Express/Node.js)

## Setup

### 1. Install
```bash
npm install
```

### 2. API Configuration
Set `API_BASE_URL` in `src/services/api.ts`:
- **Simulator** — `http://localhost:3000`
- **Physical Device** — Your local IP (e.g. `http://192.168.x.x:3000`)
- **Production** — Your deployment URL

### 3. Run
```bash
npx expo start -- --clear
```

## Project Structure

```
swish/
├── app/
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── index.tsx    # Games feed
│   │   ├── teams.tsx    # Standings
│   │   ├── players.tsx  # Stats leaderboard
│   │   ├── news.tsx
│   │   └── about.tsx
│   ├── game/[id].tsx
│   ├── game/[id]/player/[playerId].tsx  # Performance Card
│   ├── playerComparison/[id1]/[id2].tsx
│   ├── team/[id].tsx
│   └── player/[id].tsx
├── src/
│   ├── components/
│   ├── services/
│   ├── constants/
│   ├── types/
│   └── utils/
└── assets/
```

## Roadmap

- [x] Core Games Feed
- [x] Game Details & AI Summary
- [x] Standings
- [x] Team & Player Profiles
- [x] News Feed
- [x] Player Performance Cards
- [x] Player Comparison
- [x] App Store readiness
- [ ] Search, Favorites, Personalization

---

*Swish is not affiliated with ESPN or the NBA. All data is aggregated from third-party sources.*
