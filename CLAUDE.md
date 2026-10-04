# Parity

Timed mental math drills for case and finance interview prep. Installable web app (PWA): Vite + React + TypeScript + Tailwind v4, tests with Vitest. Two people work on this (the-shaayl and zanesatchu), each with their own Claude.

- Live: https://parity-opal.vercel.app
- Repo: https://github.com/the-shaayl/parity

## Workflow (both people, every change)

- **Never commit or push to `main`.** Anything on `main` goes live within a minute.
- Start from an up-to-date `main`, make a branch (`git switch -c short-description`), commit there, push the branch, and open a pull request with `gh pr create`.
- Every pull request gets an automatic **Checks** run (lint, tests, build) and a **Vercel preview link**. The other person reviews the preview on their phone and approves before merging.
- Right after opening a pull request, turn on auto-merge: `gh pr merge --auto --merge`. It then merges by itself the moment it's approved and the checks pass, so nobody has to come back and press Merge.
- Before pushing, run the same checks locally: `npm run lint && npm test && npm run build`.
- Pull before starting work (`git switch main && git pull`) so you don't build on old code.

## Commands

| Command                           | What it does                                                  |
| --------------------------------- | ------------------------------------------------------------- |
| `npm install`                     | Install dependencies (once, and after `package.json` changes) |
| `npm run dev`                     | Run locally at http://localhost:5173                          |
| `npm test`                        | Run the tests                                                 |
| `npm run lint` / `npm run format` | Check / auto-format code                                      |
| `npm run build`                   | Type-check and build for production                           |

## How the code is organised

- `src/modes/index.ts`: list of game modes. Each mode's question generator lives in `src/modes/<mode>/generator.ts` with a test next to it.
- `src/engine/`: shared round logic (`sprint.ts`), answer checking, the shared round clock (`useRoundClock.ts`).
- `src/screens/`: Home, Setup, Play (question modes), RushPlay (Rush), Results.
- `src/modes/instructions.ts`: How to play text for every mode.
- `src/storage/stats.ts`: scores saved on the device (localStorage, versioned). Never change the saved data shape without a migration.

Every question generator must have tests that generate thousands of questions and re-check each answer independently. A wrong answer in an interview-prep app is the worst possible bug.

## Analytics

Anonymous usage analytics via PostHog, in `src/lib/analytics.ts`. It only runs where `VITE_POSTHOG_KEY` is set (the live site on Vercel), so local development sends nothing.

- Events: `app_opened` (with `from_home_screen`), `app_installed` (first launch from the home screen), `round_started`, `round_finished` (with score), `round_quit`, `how_to_play_opened`. Rounds carry `mode`, `level` and `duration`.
- Use `track('event_name', { ... })` for new events. Never send names, emails or anything that identifies a person. No cookies, no session recording, no autocapture.

(agreed, do not drift)

The owner strongly dislikes anything that looks AI-generated. Keep to these:

- **Font:** the device's system font only. No web fonts.
- **Colour:** warm off-white / warm near-black, one forest-green accent (`--accent` in `src/index.css`). Colours only via the tokens in `index.css`. No extra accent colours.
- **Never:** glows, gradients, textures, emoji as icons, rounded cards or pills, drop shadows, confetti, streaks, floating "+1"s, count-up animations, decorative divider lines, dot separators (" · "), numbered lists of modes.
- **Shape:** 2px corners at most. Group things with spacing, not boxes or lines.
- **Motion:** quiet. A short fade or a small shake on a wrong answer, nothing more.
- **Copy:** sentence case, short plain sentences, everyday words. **No em dashes.** No hype or "AI" phrasing ("level up your game", "master", "unlock", "dive in").
- **Mode names:** one word (Blitz, Delta, Rush, Audit, Clock).
- When a choice is a matter of taste (fonts, colours, layout), show options side by side and let the owner pick rather than guessing.

## Product decisions already made

- Rounds are timed sprints. Rush is fixed at 2 minutes; other modes offer 30/60/120s.
- Blitz powers: Easy squares up to 10², Medium up to 25², Hard up to 30² plus cubes up to 10³. Factorials up to 5!, 7!, 10!. At most one exponent and one factorial question per 30 seconds.
- Delta has no "a → b" percentage-change questions. Every Delta answer is a whole number. Easy and Medium: % of and sale price (Easy sale prices are multiples of $50, discounts multiples of 10%). Hard adds net % change. No original price or total discount questions.
- Rush levels: Easy uses only numbers 1 to 10, Medium has one of 25 or 50, Hard has one of 25, 50, 75 or 100.
- Slice, Compound and Outs were dropped.
- Clock (from the Dial spec): shows a time as digits, plus an analog clock only if the Show clock switch on the setup screen is on (off by default); type the smaller angle between the hands (0 to 180). Easy (:00 and :30, answers multiples of 15) and Hard (quarter hours, answers can end in .5) only. No 12:00, never the same time twice in a row. Uses the shared keypad and round screen like Blitz and Delta.
- Audit (from the Sudden Death spec): true/false equations, one miss or timeout ends the run, Easy (+ −) and Hard (+ − × ÷) only, no round clock. Time per equation 3s (2.7s Hard) down to 1.5s by a score of 40.
- Rush has no streak multiplier. Scoring: 3 exact, 2 very close, 1 close. Submit locks in the selected number.
- Home screen shows mode names only (no personal bests). Bests live on each mode's setup screen.
- How to play: two sections only, Goal and How to answer. No question lists, no explaining Skip/Back.
- Spec for the remaining Target variants (untimed puzzle, Endless, Daily): the owner's doc "Parity — Target Mode Feature Spec".
