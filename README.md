# Swish 🏀

A premium, lightweight NBA statistics application for iOS, built with React Native and Expo. Designed with a focus on minimalist aesthetics, smooth motion, and real-time data insights.

## ✨ Features

- **Dynamic Games Dashboard**: A polished "Apple Sports" style feed of today's games with real-time status and scores.
- **Immersive Game Details**:
  - **Sticky Collapsing Header**: Smooth transitions between expanded scoreboard and compact tracking bar.
  - **AI Game Summary**: Intelligence-driven match recaps with visual highlights.
  - **Statistical Comparison**: Side-by-side efficiency metrics (FG%, 3P%, Points in Paint, etc.) with proportional comparison bars.
  - **Star of the Game**: MVP highlights with headshots and advanced impact scores.
- **Pre-match Insights**: Season series history and side-by-side season stats for upcoming games.
- **Conference Standings**: Fast, categorized rankings for East and West conferences with playoff seeding badges.
- **Native Performance**: 
  - Zero-latency team logo loading via local asset bundling.
  - Fluid gesture-based navigation.
  - Dark-first design consistent with iOS system aesthetics.

## 🚀 Tech Stack

- **Framework**: [Expo SDK 54](https://expo.dev/) (React Native)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State Management**: [@tanstack/react-query](https://tanstack.com/query/latest) (Data fetching & caching)
- **Visuals**: `expo-linear-gradient`, `Animated` API, `Ionicons`
- **Backend**: Private `nba-stats-api` (Express/Node.js)

## 🛠️ Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API
Update `API_BASE_URL` in `app/services/api.ts`:
- **Simulator**: `http://localhost:3000`
- **Physical Device**: Use your local IP (e.g., `http://192.168.x.x:3000`)
- **Production**: Your Railway/Cloud deployment URL

### 3. Launch
```bash
npx expo start
```
*Press **i** for iOS simulator or scan the QR code with **Expo Go** on your physical iPhone.*

## 📁 Project Structure

```text
swish/
├── app/
│   ├── _layout.tsx      # Root configuration & Tab navigation
│   ├── index.tsx        # Games feed (Main)
│   ├── teams.tsx        # Standings screen
│   ├── game/[id].tsx    # Polished Game Detail (Dynamic)
│   ├── services/
│   │   └── api.ts       # Centralized API logic
│   └── utils/
│       └── teamImages.ts # Local asset mapping
├── assets/
│   └── images/teams/    # Bundled high-res team logos
└── docs/                # Development roadmap & API summaries
```

## 📈 Development Roadmap

- [x] Phase 0: Core Games Feed
- [x] Phase 1: Immersive Game Details & AI Summary
- [x] Phase 2: Conference Standings
- [ ] Phase 3: Team Detail Screens (Roster, Schedule, Stats)
- [ ] Phase 4: Player Profiles & Career Logs
- [ ] Phase 5: News & Social Feed Integration

---
*Created by [Askar](https://github.com/askar) - 2026*
