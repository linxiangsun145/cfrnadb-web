# cfRNAdb web

Initial static website for the cfRNAdb project. This preview contains no research measurements, sample metadata, credentials, or server connections.

## Deploy on Vercel

Import `linxiangsun145/cfrnadb-web` and select the `main` branch.

- Framework Preset: **Other**
- Root Directory: repository root (leave the default)
- Build Command: no build required; leave empty
- Output Directory: repository root (`.`), or leave automatic
- Environment Variables: none required

The root `index.html` is served directly. No package installation is needed.

## Local preview

Open `index.html` in a browser, or run `python -m http.server 3000 --bind 127.0.0.1` from this directory and visit `http://127.0.0.1:3000`.

## Development scope

Future work includes dataset browsing, feature search, provenance and quality displays, and versioned downloads. Data publication and backend integration will be handled separately from this initial deployment.
