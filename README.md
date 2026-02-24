# Swish 🏀

A premium, lightweight NBA statistics application for iOS, built with React Native and Expo. Designed with a focus on minimalist aesthetics, smooth motion, and real-time data insights.

## ✨ Features

- **Dynamic Games Dashboard**: A polished "Apple Sports" style feed of today's games with real-time status, marquee game highlighting, and date navigation.
- **Immersive Game Details**:
  - **Sticky Collapsing Header**: Smooth transitions between expanded scoreboard and compact tracking bar.
  - **Live Auto-Refresh**: Intelligent 10-second refresh cycles for live games to keep scores and clocks perfectly in sync.
  - **AI Game Summary**: Intelligence-driven match recaps with visual highlights and real-time generation placeholders.
  - **Statistical Comparison**: Side-by-side efficiency metrics (FG%, 3P%, Points in Paint, etc.) with proportional comparison bars.
  - **Pre-Game Context**: Detailed season series history and grouped team injury reports.
  - **Star of the Game**: MVP highlights with headshots and advanced impact scores.
- **📸 Player Performance Cards**: A "killer feature" inspired by Real App. View a high-density performance card for any player in a live/finished game, preview the layout, and save it as a high-quality PNG directly to your device's photo gallery with a premium progress overlay.
- **📰 NBA News Feed**: Stay updated with an infinite-scroll feed of the latest NBA news and social updates from top sources like Shams Charania.
- **👥 Comprehensive Team & Player Details**:
  - **Team Profiles**: Full roster summaries, upcoming schedules, and recent game results.
  - **Player Profiles**: Deep-dives into career statistics, biographical info, and historical game logs.
- **📊 Top Players Leaderboard**: Quickly view league leaders across various statistical categories (Points, Rebounds, Assists, etc.) with rank badges and team context.
- **Conference Standings**: Fast, categorized rankings for East and West conferences with playoff seeding badges.
- **ℹ️ About Screen**: Displays app version, developer credits, legal links (Privacy Policy, Terms of Service), and data sources.
- **Native Performance**: 
  - Zero-latency team logo loading via local asset bundling.
  - Fluid gesture-based navigation.
  - **Network Resilience**: Integrated `NetInfo` for automatic data recovery the moment network access is granted.
  - Centralized **Motion System** for consistent durations, easing, and staggered entry animations.
  - Dark-first design consistent with iOS system aesthetics.

## 🚀 Tech Stack

- **Framework**: [Expo SDK 54](https://expo.dev/) (React Native)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State Management**: [@tanstack/react-query](https://tanstack.com/query/latest) (Data fetching & caching)
- **Network Monitoring**: `@react-native-community/netinfo`
- **Image Capture**: `react-native-view-shot`
- **Device Integration**: `expo-media-library` for saving shared cards
- **Visuals**: `expo-linear-gradient`, `Animated` API, `Ionicons`
- **Backend**: Private `nba-stats-api` (Express/Node.js)

## 🛠️ Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API
Update `API_BASE_URL` in `src/services/api.ts`:
- **Simulator**: `http://localhost:3000`
- **Physical Device**: Use your local IP (e.g., `http://192.168.x.x:3000`)
- **Production**: Your Railway/Cloud deployment URL

### 3. Launch
```bash
npx expo start -- --clear
```
*The `--clear` flag is recommended after first installation to ensure Metro correctly caches the new source structure.*

## 📁 Project Structure

```text
swish/
├── app/                # Expo Router root Stack navigator
│   ├── _layout.tsx     # Root Stack Navigator (defines main navigation flow)
│   ├── (tabs)/         # Group for tab-based screens
│   │   ├── _layout.tsx # Tabs Navigator (defines bottom tab bar)
│   │   ├── index.tsx   # Games feed (Home)
│   │   ├── teams.tsx   # Standings
│   │   ├── players.tsx # Stats Leaderboard
│   │   ├── news.tsx    # News Feed (hidden in v1)
│   │   └── about.tsx   # About Screen
│   ├── game/[id].tsx   # Game Detail (direct child of root Stack)
│   ├── game/[id]/player/[playerId].tsx # Performance Card (direct child of root Stack)
│   ├── team/[id].tsx   # Team Profile (direct child of root Stack)
│   └── player/[id].tsx # Player Profile (direct child of root Stack)
├── src/                # Shared internal resources
│   ├── components/     # Reusable UI (AnimatedSection, etc.)
│   ├── services/       # API integration & data parsing
│   ├── constants/      # Theme (COLORS, MOTION)
│   ├── types/          # Shared TypeScript interfaces
│   └── utils/          # Helper functions (Team logo mapping)
└── assets/             # Bundled images & fonts
```

## 📈 Development Roadmap

- [x] Phase 0: Core Games Feed & Prioritization
- [x] Phase 1: Immersive Game Details & AI Summary
- [x] Phase 2: Conference Standings
- [x] Phase 3: Team Detail Screens (Roster, Schedule, Stats)
- [x] Phase 4: Player Profiles & Career Logs
- [x] Phase 5: NBA News Feed Integration
- [x] Phase 6: Shareable Player Performance Cards (Real App Style)
- [x] Phase 7: App Store Readiness (Icons, Splash, Network Resilience)
- [ ] Phase 8: Search, Favorites & Personalization (Planned)

---
*Created by [Askar](https://github.com/askar) - 2026*
