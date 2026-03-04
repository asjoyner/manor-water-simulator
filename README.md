# Manor Water Simulator

**[Try the live simulator](https://asjoyner.github.io/manor-water-simulator/)**

## Overview
Whole-house water system simulator modeling the complete domestic hot water architecture. Extended from the [Apollo Mixing Valve Simulator](https://github.com/asjoyner/mixing-simulator).

## System Architecture
- **Cold Water Inlet** → **HTP GL119** (119-gallon indirect preheat tank)
- **Preheat Loop** (non-potable, closed): **Mitsubishi-Trane TPWFYP036AU141A** heat pump → **Grundfos UP15-29SF** circulator → **Robin Wood 20-gallon buffer tank** → back to heat pump coil in GL119
- **HTP GL119** output → **Rheem PROPH80 T2 RH400** (80-gallon hybrid, configured in Heat Pump mode)
- Rheem output → fixtures

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
