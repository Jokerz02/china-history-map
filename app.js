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

const colors = {
  main: '#d4af37',
  periphery: '#7eb8da',
  external: '#e05d5d'
};

function clearLayers() {
  currentLayers.forEach(layer => map.removeLayer(layer));
  currentLayers = [];
}

function updateMap(year) {
  const period = periods.find(p => year >= p.start && year <= p.end) || periods[periods.length - 1];

  document.getElementById('year-display').textContent = year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
  document.getElementById('dynasty-name').textContent = period.name;
  document.getElementById('dynasty-years').textContent = period.years;
  document.getElementById('dynasty-desc').textContent = period.desc;

  if (period !== lastPeriod) {
    clearLayers();

    // Draw in order: external, periphery, main (so main is on top)
    const order = ['external', 'periphery', 'main'];
    order.forEach(type => {
      (period.features || [])
        .filter(f => f.type === type)
        .forEach(feature => {
          const latlngs = feature.coords.map(c => [c[1], c[0]]);
          const color = colors[feature.type] || '#888';
          const layer = L.polygon(latlngs, {
            color: color,
            weight: feature.type === 'main' ? 2.5 : 1.5,
            fillColor: color,
            fillOpacity: feature.type === 'main' ? 0.5 : 0.35,
            opacity: 0.9
          }).addTo(map);

          layer.bindTooltip(feature.name, {
            permanent: false,
            direction: 'center',
            className: 'territory-tooltip'
          });

          currentLayers.push(layer);
        });
    });

    // Fit to main territory
    const mainFeature = (period.features || []).find(f => f.type === 'main');
    if (mainFeature) {
      const mainLatLngs = mainFeature.coords.map(c => [c[1], c[0]]);
      map.fitBounds(L.polygon(mainLatLngs).getBounds(), {
        padding: [60, 60],
        maxZoom: 5,
        animate: true,
        duration: 0.5
      });
    }

    lastPeriod = period;
  }
}

const timeline = document.getElementById('timeline');
updateMap(parseInt(timeline.value));

timeline.addEventListener('input', (e) => {
  updateMap(parseInt(e.target.value));
});
