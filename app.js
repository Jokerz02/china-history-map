// Historical Atlas — high-performance interactive map platform
// Built for extensibility: conquests, routes, shipping lanes, multi-region focus

const map = new maplibregl.Map({
  container: 'map',
  style: {
    version: 8,
    sources: {},
    layers: [{
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0d1117' }
    }]
  },
  center: [105, 35],
  zoom: 4,
  minZoom: 2,
  maxZoom: 12
});

map.addControl(new maplibregl.NavigationControl(), 'bottom-right');
map.addControl(new maplibregl.ScaleControl(), 'bottom-left');

let currentYear = -1046;
let isPlaying = false;
let playbackTimer = null;
let customSources = [];
let layerVisibility = { main: true, periphery: true, external: true, routes: false, points: false };

const COLORS = {
  main: '#d4af37',
  periphery: '#7eb8da',
  external: '#e05d5d',
  route: '#a78bfa'
};

function yearLabel(y) {
  return y < 0 ? `${Math.abs(y)} BCE` : `${y} CE`;
}

function getPeriod(year) {
  return periods.find(p => year >= p.start && year <= p.end) || periods[periods.length - 1];
}

function updateUI(year) {
  currentYear = year;
  document.getElementById('year-display').textContent = yearLabel(year);
  document.getElementById('timeline').value = year;
  const p = getPeriod(year);
  document.getElementById('period-name').textContent = p.name;
  document.getElementById('period-years').textContent = p.years || '';
}

function clearCustomLayers() {
  customSources.forEach(id => {
    if (map.getLayer(id + '-fill')) map.removeLayer(id + '-fill');
    if (map.getLayer(id + '-line')) map.removeLayer(id + '-line');
    if (map.getSource(id)) map.removeSource(id);
  });
  customSources = [];
}

function addGeoJSONSource(id, data, type = 'main') {
  if (map.getSource(id)) map.removeSource(id);
  map.addSource(id, { type: 'geojson', data, generateId: true });
  customSources.push(id);

  const color = COLORS[type] || COLORS.main;
  const isLine = data.features?.some(f => f.geometry?.type?.includes('Line'));

  if (isLine) {
    map.addLayer({
      id: id + '-line',
      type: 'line',
      source: id,
      paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.8 },
      layout: { visibility: layerVisibility.routes ? 'visible' : 'none' }
    });
  } else {
    map.addLayer({
      id: id + '-fill',
      type: 'fill',
      source: id,
      paint: { 'fill-color': color, 'fill-opacity': type === 'main' ? 0.45 : 0.3 },
      layout: { visibility: layerVisibility[type] ? 'visible' : 'none' }
    });
    map.addLayer({
      id: id + '-line',
      type: 'line',
      source: id,
      paint: { 'line-color': color, 'line-width': type === 'main' ? 1.5 : 1, 'line-opacity': 0.7 },
      layout: { visibility: layerVisibility[type] ? 'visible' : 'none' }
    });
  }
}

function drawSchematic(year) {
  clearCustomLayers();
  const period = getPeriod(year);
  const features = { main: [], periphery: [], external: [] };

  (period.features || []).forEach(f => {
    const coords = f.coords.map(c => [c[0], c[1]]);
    features[f.type]?.push({
      type: 'Feature',
      properties: { name: f.name, type: f.type },
      geometry: { type: 'Polygon', coordinates: [coords] }
    });
  });

  Object.entries(features).forEach(([type, feats]) => {
    if (feats.length) {
      addGeoJSONSource('schematic-' + type, { type: 'FeatureCollection', features: feats }, type);
    }
  });
}

function render(year) {
  updateUI(year);
  if (customSources.some(s => s.startsWith('custom-'))) return;
  drawSchematic(year);
}

function togglePlay() {
  isPlaying = !isPlaying;
  document.getElementById('play-btn').textContent = isPlaying ? '⏸' : '▶';
  if (isPlaying) {
    const speed = parseFloat(document.getElementById('playback-speed').value);
    playbackTimer = setInterval(() => {
      let next = currentYear + Math.round(speed);
      if (next > 2000) next = -1600;
      render(next);
    }, 80);
  } else {
    clearInterval(playbackTimer);
  }
}

document.getElementById('timeline').addEventListener('input', e => {
  if (isPlaying) togglePlay();
  render(parseInt(e.target.value));
});

document.getElementById('play-btn').addEventListener('click', togglePlay);
document.getElementById('reset-view').addEventListener('click', () => {
  map.flyTo({ center: [105, 35], zoom: 4, duration: 800 });
});

['main', 'periphery', 'external', 'routes', 'points'].forEach(key => {
  const el = document.getElementById('layer-' + key);
  if (el) el.addEventListener('change', e => {
    layerVisibility[key] = e.target.checked;
  });
});

document.getElementById('geojson-file').addEventListener('change', async e => {
  const files = Array.from(e.target.files);
  let loaded = 0;
  for (const file of files) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const id = 'custom-' + Date.now() + '-' + loaded;
      const type = data.features?.[0]?.properties?.type || 'main';
      addGeoJSONSource(id, data, type);
      loaded++;
    } catch (err) {
      console.error('Failed to load', file.name, err);
    }
  }
  document.getElementById('load-status').textContent = loaded ? `Loaded ${loaded} file(s)` : 'No valid files';
});

document.getElementById('clear-data').addEventListener('click', () => {
  clearCustomLayers();
  document.getElementById('load-status').textContent = '';
  document.getElementById('geojson-file').value = '';
  render(currentYear);
});

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const results = document.getElementById('search-results');
  if (!q) { results.innerHTML = ''; return; }
  const matches = periods.filter(p => p.name.toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q));
  results.innerHTML = matches.slice(0, 6).map(p =>
    `<div class="search-hit" data-year="${p.start}">${p.name} (${p.years || ''})</div>`
  ).join('');
  results.querySelectorAll('.search-hit').forEach(el => {
    el.addEventListener('click', () => {
      render(parseInt(el.dataset.year));
      results.innerHTML = '';
    });
  });
});

map.on('click', e => {
  const features = map.queryRenderedFeatures(e.point);
  if (!features.length) return;
  const f = features[0];
  const name = f.properties?.name || f.properties?.NAME || 'Territory';
  new maplibregl.Popup({ closeButton: false })
    .setLngLat(e.lngLat)
    .setHTML(`<strong>${name}</strong>`)
    .addTo(map);
});

map.on('load', () => render(currentYear));
