# Manor Water Simulator

**[Try the live simulator](https://asjoyner.github.io/manor-water-simulator/)**

## Overview
Whole-house water system simulator modeling preheat tanks, recirculation loops, mixing valves, and tankless heaters. Extended from the [Apollo Mixing Valve Simulator](https://github.com/asjoyner/mixing-simulator).

## Current State
The simulator currently includes the core physics models from the mixing-simulator:
- **Stratified Tank Model** — 10-layer vertical thermal stratification with advection, recovery, and convection
- **Rinnai RX199iN Tankless Heater** — 199,000 BTU/h burner with BTU-limiting at high flow
- **Apollo MVA Mixing Valve** — Thermostatic wax element with 8-second time constant
- **Series-Hybrid Architecture** — Tank feeds tankless as booster, valve mixes output

## Project Structure
- **Source:** `src/` (React/TS code and physics models)
- **Build Output:** `dist/` (Static production assets, committed for GitHub Pages)
- **Tests:** `src/models/ValveModel.test.ts`

## Development & Deployment
```bash
npm install      # install dependencies
npm run dev      # start dev server
npm run test     # run vitest
npm run build    # build to dist/
git add dist/ && git commit
git push origin main
```
Pushing to `main` automatically deploys to [asjoyner.github.io/manor-water-simulator](https://asjoyner.github.io/manor-water-simulator/) via GitHub Actions.
