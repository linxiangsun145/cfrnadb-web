# cfRNAdb web

Interactive static website for the cfRNAdb project. Live preview: https://cfrnadb-web-hcha.vercel.app/

The `demo-0.1.0` release contains **entirely synthetic data**: 24 fictional samples, 3 fictional studies, 48 illustrative features across 4 analysis views, and 2,592 measurements. It contains no real research measurements, clinical metadata, credentials, or laboratory server connection.

## Available features

- Overview and per-view feature browsing.
- Search, combined filters, availability sorting, pagination, and bookmarkable URLs.
- Feature details with channel selection, sample charts, exact values, and exports.
- Sample details with separate study / subject / biosample / library / run identities.
- Filtered catalogs, sample metadata, long-format measurements, complete release JSON, and a checksum manifest.
- Guide to measurement states, channels, identity evidence, and project scope.

Observed zero is kept distinct from not measured, failed, and low depth. Unavailable values are never imputed as zero. A chart displays one channel and unit at a time. Every TSV measurement retains its release, feature revision, sample, channel, unit, state, and synthetic-data label.

The four demonstration views are not the original five overlapping workflow categories and do not imply those workflows are all complete. Gene/RNA labels are illustrative; no curated biological mapping is asserted. `DEMO_REFERENCE_v1` is not a real reference assembly, and coordinates are unspecified.

## Deploy on Vercel

Import `linxiangsun145/cfrnadb-web` and select the `main` branch.

- Framework Preset: **Other**
- Root Directory: repository root (leave the default)
- Build Command: no build required; leave empty
- Output Directory: repository root (`.`), or leave automatic
- Environment Variables: none required

The root `index.html` and `assets/` are served directly. No package installation, build, environment variables, or backend is needed. The app uses hash routes so direct links work without server rewrites.

## Local preview

Run `python -m http.server 3000 --bind 127.0.0.1` from this directory and visit `http://127.0.0.1:3000`. Use an HTTP server rather than opening the file directly because the app fetches its JSON release.

## Checks and fixture generation

```text
python scripts/generate_demo.py
node --check assets/app.mjs
node --test tests/data.test.mjs
```

The generator reads no external files and produces deterministic synthetic fixtures. The manifest records the exact JSON file's SHA-256. Tests check identity and measurement keys, unit compatibility, filters, channel-specific exports, observed-zero handling, unavailable states, and pagination.

## Source layout

- `index.html`: accessible application shell.
- `assets/app.mjs`: route rendering and interactions.
- `assets/data.mjs`: filters, measurement summaries, and export functions shared with tests.
- `assets/styles.css`: responsive styling.
- `data/demo-release.json`: synthetic release consumed by the browser.
- `data/manifest.json`: release counts, definitions, and checksum.
- `scripts/generate_demo.py`: reproducible fixture generator.
- `tests/data.test.mjs`: dependency-free Node tests.

## Development scope

Real data ingestion and database-backed APIs remain future work. Do not replace the fixture with research data without validating identity mappings, reference and channel definitions, quality states, release provenance, and the allowed publication scope. The current client explicitly accepts synthetic releases only.
