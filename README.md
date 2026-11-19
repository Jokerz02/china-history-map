# Historical Atlas — Interactive Map Platform

High-performance, extensible map for historical borders, conquests, routes, and more.

## Features
- **MapLibre GL JS** for smooth rendering and large datasets
- Timeline playback with adjustable speed
- Layer toggles (main / periphery / external / routes / points)
- Multi-file GeoJSON loader (drop CHGIS or other data)
- Search periods
- Click popups
- Dark theme, responsive sidebar
- Built for future extensions: shipping lanes, conquest animation, multi-region focus

## Run locally
```bash
git clone https://github.com/Jokerz02/china-history-map.git
cd china-history-map
python -m http.server 8000
```
Open http://localhost:8000

## Custom data
Load GeoJSON files via the sidebar. Features with `type` property (`main`, `periphery`, `external`) get matching colors. Line geometries are treated as routes.

## Stack
- MapLibre GL JS 4.7
- Vanilla JS (no build step)
- Schematic fallback data in `data.js`
