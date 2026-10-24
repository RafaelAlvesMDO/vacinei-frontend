import { colors } from '@/theme';

// Centro padrão (Maceió), usado até as UBS chegarem
export const MACEIO_CENTER = { latitude: -9.6658, longitude: -35.7353 };

/**
 * Página do mapa (Leaflet 1.9.4 com tiles do OpenStreetMap), aberta numa WebView.
 * Política de uso dos tiles (RNF15): atribuição sempre visível, sem pré-carregamento (keepBuffer baixo,
 * tiles só da área visível) e o cache HTTP da WebView, que segue os cabeçalhos do servidor.
 *
 * Mensagens para o app: `init` (Leaflet carregado), `tiles-ok` (primeiro tile), `unavailable` (Leaflet
 * ou tiles falharam) e `select` (toque num marcador). O app atualiza os marcadores com `window.vacinei.update`
 */
export const MAP_HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; background: ${colors.background}; }
  .leaflet-container { font-family: -apple-system, Roboto, sans-serif; }
  .pin { width: 36px; height: 36px; border-radius: 50%; box-sizing: border-box; display: flex;
    align-items: center; justify-content: center; background: ${colors.white};
    border: 2px solid ${colors.primary}; box-shadow: 0 1px 4px rgba(16, 59, 52, 0.3); }
  .pin svg { width: 18px; height: 18px; fill: ${colors.primary}; }
  .pin.selected { width: 48px; height: 48px; background: ${colors.primary}; border-color: ${colors.white}; }
  .pin.selected svg { width: 24px; height: 24px; fill: ${colors.white}; }
  .me { width: 18px; height: 18px; border-radius: 50%; box-sizing: border-box; background: ${colors.accent};
    border: 3px solid ${colors.white}; box-shadow: 0 0 0 6px rgba(4, 122, 128, 0.25); }
  .leaflet-control-attribution { font-size: 11px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  function post(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  function leafletFailed() { post({ type: 'unavailable' }); }
</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin="" onerror="leafletFailed()"></script>
<script>
(function () {
  if (!window.L) { leafletFailed(); return; }

  var map = L.map('map', { zoomControl: false, minZoom: 10, maxZoom: 18 })
    .setView([${MACEIO_CENTER.latitude}, ${MACEIO_CENTER.longitude}], 13);
  map.attributionControl.setPrefix(false);

  var tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    keepBuffer: 1,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">colaboradores do OpenStreetMap</a>'
  }).addTo(map);

  // Sem nenhum tile carregado e com falhas seguidas, o mapa é dado como indisponível
  var loaded = 0;
  var errors = 0;
  tiles.on('tileload', function () {
    loaded += 1;
    if (loaded === 1) post({ type: 'tiles-ok' });
  });
  tiles.on('tileerror', function () {
    errors += 1;
    if (loaded === 0 && errors === 3) post({ type: 'unavailable' });
  });

  var CROSS = '<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>';
  var markers = {};
  var userMarker = null;
  var lastIds = '';
  var lastSelected = null;

  function pinIcon(selected) {
    var size = selected ? 48 : 36;
    return L.divIcon({
      className: '',
      html: '<div class="pin' + (selected ? ' selected' : '') + '">' + CROSS + '</div>',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2]
    });
  }

  window.vacinei = {
    update: function (data) {
      Object.keys(markers).forEach(function (id) { markers[id].remove(); });
      markers = {};
      data.points.forEach(function (point) {
        var selected = point.id === data.selectedId;
        var marker = L.marker([point.latitude, point.longitude], {
          icon: pinIcon(selected),
          title: point.name,
          zIndexOffset: selected ? 1000 : 0
        }).addTo(map);
        marker.on('click', function () { post({ type: 'select', id: point.id }); });
        markers[point.id] = marker;
      });

      if (userMarker) { userMarker.remove(); userMarker = null; }
      if (data.user) {
        userMarker = L.marker([data.user.latitude, data.user.longitude], {
          icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
          interactive: false
        }).addTo(map);
      }

      // Lista nova (busca ou atualização): enquadra tudo. Só a seleção mudou: centraliza o marcador
      var ids = data.points.map(function (point) { return point.id; }).join(',');
      if (ids !== lastIds) {
        var bounds = data.points.map(function (point) { return [point.latitude, point.longitude]; });
        if (data.user) bounds.push([data.user.latitude, data.user.longitude]);
        if (bounds.length > 0) {
          map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 200], maxZoom: 15 });
        }
      } else if (data.selectedId && data.selectedId !== lastSelected && markers[data.selectedId]) {
        map.panTo(markers[data.selectedId].getLatLng());
      }
      lastIds = ids;
      lastSelected = data.selectedId;
    }
  };

  post({ type: 'init' });
})();
</script>
</body>
</html>`;
