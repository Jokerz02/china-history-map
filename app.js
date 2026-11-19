const map = L.map('map', {
  center: [35, 105],
  zoom: 4,
  minZoom: 3,
  maxZoom: 10
});

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  maxZoom: 16
}).addTo(map);

let currentLayers = [];
let lastPeriod = null;
let customGeoJSON = null; // Holds user-loaded GeoJSON if present

const colors = {
  main: '#d4af37',
  periphery: '#7eb8da',
  external: '#e05d5d'
};

function clearLayers() {
  currentLayers.forEach(layer => map.removeLayer(layer));
  currentLayers = [];
}

function styleForType(type) {
  const color = colors[type] || '#888';
  return {
    color: color,
    weight: type === 'main' ? 2.5 : 1.5,
    fillColor: color,
    fillOpacity: type === 'main' ? 0.5 : 0.35,
    opacity: 0.9
  };
}

function addFeatureLayer(latlngs, name, type) {
  const layer = L.polygon(latlngs, styleForType(type)).addTo(map);
  if (name) {
    layer.bindTooltip(name, {
      permanent: false,
      direction: 'center',
      className: 'territory-tooltip'
    });
  }
  currentLayers.push(layer);
  return layer;
}

function drawSchematic(period) {
  const order = ['external', 'periphery', 'main'];
  order.forEach(type => {
    (period.features || [])
      .filter(f => f.type === type)
      .forEach(feature => {
        const latlngs = feature.coords.map(c => [c[1], c[0]]);
        addFeatureLayer(latlngs, feature.name, feature.type);
      });
  });
}

function drawCustomGeoJSON(year) {
  if (!customGeoJSON || !customGeoJSON.features) return false;

  const relevant = customGeoJSON.features.filter(f => {
    const p = f.properties || {};
    if (p.start !== undefined && p.end !== undefined) {
      return year >= p.start && year <= p.end;
    }
    return true;
  });

  if (relevant.length === 0) return false;

  relevant.forEach(feature => {
    const p = feature.properties || {};
    const name = p.name || p.NAME || p.title || 'Territory';
    const type = p.type || p.TYPE || 'main';

    if (feature.geometry.type === 'Polygon') {
      const latlngs = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
      addFeatureLayer(latlngs, name, type);
    } else if (feature.geometry.type === 'MultiPolygon') {
      feature.geometry.coordinates.forEach(poly => {
        const latlngs = poly[0].map(c => [c[1], c[0]]);
        addFeatureLayer(latlngs, name, type);
      });
    }
  });

  return true;
}

function updateMap(year) {
  const period = periods.find(p => year >= p.start && year <= p.end) || periods[periods.length - 1];

  document.getElementById('year-display').textContent = year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  document.getElementById('dynasty-name').textContent = period.name;
  document.getElementById('dynasty-years').textContent = period.years;
  document.getElementById('dynasty-desc').textContent = period.desc;

  if (period !== lastPeriod || customGeoJSON) {
    clearLayers();

    let usedCustom = false;
    if (customGeoJSON) {
      usedCustom = drawCustomGeoJSON(year);
    }

    if (!usedCustom) {
      drawSchematic(period);
    }

    const mainLayer = currentLayers.find(l => l.options.fillColor === colors.main);
    if (mainLayer) {
      map.fitBounds(mainLayer.getBounds(), {
        padding: [60, 60],
        maxZoom: 5,
        animate: true,
        duration: 0.5
      });
    }

    lastPeriod = period;
  }
}

document.getElementById('geojson-file')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      customGeoJSON = JSON.parse(ev.target.result);
      lastPeriod = null;
      updateMap(parseInt(document.getElementById('timeline').value));
      document.getElementById('load-status').textContent = `Loaded: ${file.name}`;
    } catch (err) {
      alert('Invalid GeoJSON file');
      console.error(err);
    }
  };
  reader.readAsText(file);
});

document.getElementById('clear-geojson')?.addEventListener('click', () => {
  customGeoJSON = null;
  lastPeriod = null;
  document.getElementById('load-status').textContent = '';
  document.getElementById('geojson-file').value = '';
  updateMap(parseInt(document.getElementById('timeline').value));
});

const timeline = document.getElementById('timeline');
updateMap(parseInt(timeline.value));

timeline.addEventListener('input', (e) => {
  updateMap(parseInt(e.target.value));
});
