# Parity

Timed mental math drills for case and finance interviews. Installable web app (PWA) — works offline and can be added to a phone's home screen.

**Live:** https://parity-opal.vercel.app

## Publishing

The repo is connected to Vercel. Every merge into `main` publishes automatically within about a minute. Every pull request gets its own preview link first. To install on iPhone: open the link in Safari → Share → Add to Home Screen.

## Getting started (new collaborator)

1. Install Node.js LTS from https://nodejs.org and Git (macOS: run `git --version` and accept the prompt).
2. Download the project and install its packages:
   ```bash
   git clone https://github.com/the-shaayl/parity.git
   cd parity
   npm install
   ```
3. Run it: `npm run dev`, then open http://localhost:5173.

See `CLAUDE.md` for the workflow (branches and pull requests, never push to `main`) and the design rules.

## Commands

| Command                           | What it does                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`                     | Start the app locally at http://localhost:5173 (updates live as code changes) |
| `npm test`                        | Run the automated tests                                                       |
| `npm run build`                   | Type-check and build the production version into `dist/`                      |
| `npm run lint` / `npm run format` | Check code quality / auto-format code                                         |
| `npm run icons`                   | Regenerate app icons from `public/favicon.svg`                                |

## How the code is organised

- `src/engine/` — the rules shared by every mode: question shape, timer-free round logic (`sprint.ts`), answer checking.
- `src/modes/` — one folder per game mode. Each has a `generator.ts` (makes questions) and tests. `modes/index.ts` lists all modes.
- `src/screens/` — Home, Setup, Play, Results.
- `src/components/` — reusable UI pieces (buttons, keypad, icons).
- `src/storage/stats.ts` — personal bests and history, saved on the device.
