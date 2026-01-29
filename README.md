# Swish 🏀

A premium, lightweight NBA statistics application for iOS, built with React Native and Expo. Designed with a focus on minimalist aesthetics, smooth motion, and real-time data insights.

## ✨ Features

- **Dynamic Games Dashboard**: A polished "Apple Sports" style feed of today's games with real-time status, marquee game highlighting, and date navigation.
- **Immersive Game Details**:
  - **Sticky Collapsing Header**: Smooth transitions between expanded scoreboard and compact tracking bar.
  - **AI Game Summary**: Intelligence-driven match recaps with visual highlights.
  - **Statistical Comparison**: Side-by-side efficiency metrics (FG%, 3P%, Points in Paint, etc.) with proportional comparison bars.
  - **Star of the Game**: MVP highlights with headshots and advanced impact scores.
- **📸 Player Performance Cards**: A "killer feature" inspired by Real App. View a high-density performance card for any player in a live/finished game and save it as a high-quality PNG directly to your device's photo gallery.
- **📰 NBA News Feed**: Stay updated with an infinite-scroll feed of the latest NBA news and social updates from top sources like Shams Charania.
- **👥 Comprehensive Team & Player Details**:
  - **Team Profiles**: Full roster summaries, upcoming schedules, and recent game results.
  - **Player Profiles**: Deep-dives into career statistics, biographical info, and historical game logs.
- **📊 Top Players Leaderboard**: Quickly view league leaders across various statistical categories (Points, Rebounds, Assists, etc.) with rank badges and team context.
- **Conference Standings**: Fast, categorized rankings for East and West conferences with playoff seeding badges.
- **Native Performance**: 
  - Zero-latency team logo loading via local asset bundling.
  - Fluid gesture-based navigation.
  - Centralized **Motion System** for consistent durations, easing, and staggered entry animations.
  - Dark-first design consistent with iOS system aesthetics.

## 🚀 Tech Stack

- **Framework**: [Expo SDK 54](https://expo.dev/) (React Native)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State Management**: [@tanstack/react-query](https://tanstack.com/query/latest) (Data fetching & caching)
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
├── app/                # Expo Router directory (Routes only)
│   ├── index.tsx       # Games feed (Home)
│   ├── teams.tsx       # Standings
│   ├── players.tsx     # Stats Leaderboard
│   ├── news.tsx        # News Feed
│   ├── game/[id].tsx   # Game Detail
│   ├── team/[id].tsx   # Team Profile
│   └── player/[id].tsx # Player Profile
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
- [ ] Phase 7: Search, Favorites & Personalization (Planned)

---
*Created by [Askar](https://github.com/askar) - 2026*
