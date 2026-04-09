# App Store Notes for Review (Guideline 4.3)

Use these points in App Store Connect **Notes for Review** if asked about app uniqueness or minimum functionality (Guideline 4.3).

## Differentiators

- **Swish Score (GIS)** — Proprietary Game Impact Score with tier labels (MVP, Elite, Starter, etc.). Shows who dominated each game at a glance; not a generic stats viewer.
- **Player Performance Cards** — Shareable, saveable PNG cards for any player’s game stats; save to Photos or share. Unique to this app.
- **AI Game Summary** — Post-game AI match recaps (AI INSIGHTS) for finished games.
- **Player Comparison** — Side-by-side stat comparison with visual bars (points, rebounds, FG%, etc.).
- **Chinese-localized** — Full UI and translated NBA news for Chinese-speaking users.
- **Non-official** — Clearly disclosed as a third-party stats tool; not affiliated with ESPN or NBA.

## How to test key features

1. **Games** — Tap a game for live/period scores, team stats, and AI summary (when game is finished).
2. **Performance card** — Game → tap a player → view card → Save to Photos or Share.
3. **Player comparison** — From a player profile, use comparison to compare two players.
4. **News** — 新闻 tab: translated articles; tap an item for full article.
5. **Push (optional)** — 关于 → 开启比赛提醒: opt-in for game alerts (requires physical device / permission).
6. **About** — Version, Privacy Policy link, data source disclaimer.

Privacy Policy: https://askaralim.github.io/swish-privacy/privacy.html

---

## Metadata checklist (after feature changes)

Before each submission, confirm in **App Store Connect**:

- [ ] Screenshots reflect current tabs (including 新闻 if enabled).
- [ ] Description and “What’s New” match the binary (no implied official NBA/league partnership).
- [ ] If using push: user must opt in inside the app (关于 → 开启比赛提醒); mention only if you describe the feature in marketing text.

---

## Release verification (manual)

### iOS push (D1)

- [ ] Apple Developer: App ID `com.taklip.swish` has **Push Notifications** enabled.
- [ ] EAS: production credentials include a valid push key; `eas credentials` or Expo dashboard.
- [ ] Run a **production** or **TestFlight** build on a **physical device**.
- [ ] Enable 比赛提醒 in 关于, confirm token registers (API logs / DB `push_tokens` if migrated).
- [ ] Confirm a test push is received (server cron or manual Expo push).

### Android push (D2)

- [ ] If shipping Play: configure **FCM** in Expo/EAS as per current Expo docs; test on a device.

### API (production)

- [ ] Apply migration `migrations/003_create_push_tokens.sql` on Postgres when using push in production.
- [ ] Optional: set `DISABLE_PUSH_CRON=true` until push delivery is verified; remove after validation.
- [ ] Season env: `NBA_ESPN_STATS_SEASON`, `NBA_STANDINGS_SEASON_YEAR`, `NBA_STANDINGS_SEASON_TYPE` when the league year rolls.
